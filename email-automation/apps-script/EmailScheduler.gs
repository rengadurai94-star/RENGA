/**
 * EmailScheduler.gs
 * ----------------------------------------------------------------------------
 * The cloud engine. A time-driven trigger calls schedulerTick() every few
 * minutes on Google's servers (your computer can be off). Each run:
 *
 *   1. takes the script lock (no overlapping runs),
 *   2. recovers anything interrupted mid-send (checks Gmail "Sent"),
 *   3. for every Active campaign inside its sending window, sends the next
 *      eligible recipients up to: campaign daily limit, global daily cap,
 *      Gmail quota (minus reserve) and MAX_EMAILS_PER_RUN,
 *   4. writes every result to the sheets immediately, then releases the lock.
 *
 * Duplicate protection (defence in depth):
 *   - one queue row per CampaignID|ContactID and per e-mail address per campaign,
 *   - status set to "Sending" and flushed BEFORE Gmail is called,
 *   - any item that was interrupted or is being retried is first looked up in
 *     the Gmail Sent folder; if found it is marked Sent and NOT re-sent,
 *   - MIN_DAYS_BETWEEN_EMAILS across campaigns.
 */

// ---- Trigger entry points (must be top-level functions) ---------------------

function schedulerTick() { EmailScheduler.run(); }
function inboxTick() { UnsubscribeManager.processInbox(); }
function dailyMaintenanceTick() { EmailScheduler.dailyMaintenance(); }

var EmailScheduler = {
  RUN_BUDGET_MS: 4.5 * 60 * 1000,   // Apps Script hard limit is 6 minutes
  TRIGGER_HANDLERS: ['schedulerTick', 'inboxTick', 'dailyMaintenanceTick'],

  /** Main scheduler run. Returns a summary (also used by tests / "Run now"). */
  run: function (opts) {
    opts = opts || {};
    var started = Date.now();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(5000)) {
      console.log('Previous run still active — skipping this tick.');
      return { skipped: 'locked' };
    }
    var runId = Util.newRunId();
    var summary = { runId: runId, sent: 0, failed: 0, retry: 0, skipped: 0, recovered: 0, deferred: 0, campaigns: {} };
    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty('LAST_SCHEDULER_RUN', String(Date.now()));
      var settings = Config.load(true);

      UnsubscribeManager.syncSuppressedContacts();
      summary.recovered += this.recoverInFlight_(settings, runId);

      var now = opts.now || new Date();
      var campaigns = CampaignManager.read();
      var queue = Db.read(APP.SHEETS.QUEUE);
      var contacts = ContactManager.read();
      var byId = ContactManager.indexById(contacts);
      var today = Util.dayKey(now);

      var sentTodayAll = 0;
      var lastSentByEmail = {};
      queue.rows.forEach(function (q) {
        if ((q['Status'] === APP.QUEUE_STATUS.SENT || q['Status'] === APP.QUEUE_STATUS.BOUNCED) && q['Sent At'] instanceof Date) {
          if (Util.dayKey(q['Sent At']) === today) sentTodayAll++;
          var e = ContactManager.normalizeEmail(q['Email Address']);
          if (!lastSentByEmail[e] || lastSentByEmail[e].getTime() < q['Sent At'].getTime()) lastSentByEmail[e] = q['Sent At'];
        }
      });

      var quotaLeft = EmailSender.remainingQuota() - settings.quotaReserve;
      var runBudget = settings.maxPerRun;
      var stopAll = false;

      var ordered = campaigns.rows.slice().sort(function (a, b) {
        var x = a['Started At'] instanceof Date ? a['Started At'].getTime() : 0;
        var y = b['Started At'] instanceof Date ? b['Started At'].getTime() : 0;
        return x - y;
      });

      for (var ci = 0; ci < ordered.length && !stopAll; ci++) {
        var c = ordered[ci];
        var cid = String(c['Campaign ID']);
        var status = String(c['Status']);
        if (status === APP.CAMPAIGN_STATUS.STOPPED && CampaignManager.countQueue_(cid, queue).pending > 0) {
          CampaignManager.cancelPending_(cid, 'Campaign stopped by user');
          queue = Db.read(APP.SHEETS.QUEUE);
          CampaignManager.refreshStats_(campaigns, c, queue);
          continue;
        }
        if (status !== APP.CAMPAIGN_STATUS.ACTIVE && status !== APP.CAMPAIGN_STATUS.SCHEDULED) continue;

        var win = this.window_(c, settings, now);
        if (win.expired) {
          var n = CampaignManager.cancelPending_(cid, 'End date reached');
          Db.update(campaigns, c, { 'Status': APP.CAMPAIGN_STATUS.COMPLETED, 'Completed At': new Date(), 'Notes': Util.truncate(String(c['Notes'] || '') + ' | End date reached, ' + n + ' not sent', 500) });
          ErrorHandler.info('EmailScheduler', 'run', cid + ' reached its end date; ' + n + ' recipients not sent.', '', cid);
          queue = Db.read(APP.SHEETS.QUEUE);
          continue;
        }
        if (status === APP.CAMPAIGN_STATUS.SCHEDULED && win.started) {
          Db.update(campaigns, c, { 'Status': APP.CAMPAIGN_STATUS.ACTIVE });
        }
        Db.update(campaigns, c, { 'Last Run': new Date() });
        summary.campaigns[cid] = win.ok ? 'in window' : win.reason;
        if (!win.ok) continue;

        var content = EmailContentManager.get(c['Content ID']);
        var problems = content ? EmailContentManager.validate(content) : ['Content ' + c['Content ID'] + ' not found'];
        if (problems.length) {
          Db.update(campaigns, c, { 'Status': APP.CAMPAIGN_STATUS.PAUSED, 'Notes': Util.truncate('AUTO-PAUSED: ' + problems.join(' '), 500) });
          ErrorHandler.critical('EmailScheduler', 'run', new Error('Campaign ' + cid + ' auto-paused: ' + problems.join(' ')));
          continue;
        }

        var dailyLimit = parseInt(c['Daily Limit'], 10) || settings.defaultDailyLimit;
        var sentTodayC = 0;
        queue.rows.forEach(function (q) {
          if (String(q['Campaign ID']) === cid && (q['Status'] === APP.QUEUE_STATUS.SENT || q['Status'] === APP.QUEUE_STATUS.BOUNCED) &&
            q['Sent At'] instanceof Date && Util.dayKey(q['Sent At']) === today) sentTodayC++;
        });

        var candidates = queue.rows.filter(function (q) {
          if (String(q['Campaign ID']) !== cid) return false;
          if (q['Status'] === APP.QUEUE_STATUS.PENDING) return true;
          if (q['Status'] === APP.QUEUE_STATUS.RETRY) {
            return !(q['Next Retry At'] instanceof Date) || q['Next Retry At'].getTime() <= now.getTime();
          }
          return false;
        }).sort(function (a, b) { return (parseInt(a['Queue Order'], 10) || 0) - (parseInt(b['Queue Order'], 10) || 0); });

        for (var i = 0; i < candidates.length; i++) {
          var allowance = Math.min(dailyLimit - sentTodayC, settings.globalDailyCap - sentTodayAll, quotaLeft, runBudget);
          if (allowance <= 0) {
            if (quotaLeft <= 0) ErrorHandler.warn('EmailScheduler', 'run', 'Gmail daily quota (minus reserve) reached — sending resumes tomorrow.', '', cid);
            break;
          }
          if (Date.now() - started > this.RUN_BUDGET_MS) { stopAll = true; break; }

          // The owner may have paused/stopped the campaign while we were running.
          if (CampaignManager.liveStatus_(c) !== APP.CAMPAIGN_STATUS.ACTIVE && CampaignManager.liveStatus_(c) !== APP.CAMPAIGN_STATUS.SCHEDULED) {
            summary.campaigns[cid] = 'paused during run';
            break;
          }

          var item = candidates[i];
          var contact = byId[String(item['Contact ID'])];
          var suppression = UnsubscribeManager.loadSuppression(); // fresh, catches unsubscribes made seconds ago
          var el = ContactManager.checkEligibility(contact, item['Email Address'], settings, suppression);
          if (!el.ok) {
            this.finishItem_(queue, item, APP.QUEUE_STATUS.SKIPPED, { 'Error': el.reason });
            this.logSend_(cid, item, 'Skipped', el.reason, runId);
            summary.skipped++;
            continue;
          }
          var email = ContactManager.normalizeEmail(item['Email Address']);
          if (this.alreadySentInCampaign_(queue, cid, email, item)) {
            this.finishItem_(queue, item, APP.QUEUE_STATUS.SKIPPED, { 'Error': 'Duplicate address in this campaign' });
            this.logSend_(cid, item, 'Skipped', 'Duplicate address', runId);
            summary.skipped++;
            continue;
          }
          var last = lastSentByEmail[email];
          if (settings.minDaysBetween > 0 && last && (now.getTime() - last.getTime()) < settings.minDaysBetween * 86400000) {
            summary.deferred++;
            continue; // stays Pending; will be sent once the gap has passed
          }

          var r = this.sendItem_(queue, item, contact, contacts, content, c, settings, runId);
          if (r.sent) {
            summary.sent++;
            sentTodayC++; sentTodayAll++; quotaLeft--; runBudget--;
            lastSentByEmail[email] = new Date();
            if (runBudget > 0 && settings.secondsBetween > 0 && i < candidates.length - 1) Utilities.sleep(settings.secondsBetween * 1000);
          } else if (r.recovered) {
            summary.recovered++;
          } else if (r.retry) {
            summary.retry++;
          } else if (r.failed) {
            summary.failed++;
          }
          if (r.quotaExhausted) { stopAll = true; break; }
        }
        CampaignManager.refreshStats_(campaigns, c, queue);
      }

      // Refresh the dashboard after any activity, otherwise at most hourly
      // (keeps idle runs to a few seconds of the daily trigger-runtime quota).
      var lastDash = Number(props.getProperty('LAST_DASHBOARD_REFRESH') || 0);
      var active = summary.sent || summary.failed || summary.retry || summary.skipped || summary.recovered;
      if (active || Date.now() - lastDash > 60 * 60000) DashboardManager.refresh({ quick: true });
      if (summary.sent || summary.failed || summary.retry) {
        console.log('Run ' + runId + ': ' + JSON.stringify(summary));
      }
    } catch (e) {
      ErrorHandler.critical('EmailScheduler', 'run', e);
      summary.error = e.message;
    } finally {
      lock.releaseLock();
    }
    return summary;
  },

  /**
   * Is the campaign allowed to send right now?
   * Returns {ok, reason, started, expired}.
   */
  window_: function (c, settings, now) {
    var today = Util.dayKey(now);
    var hm = Util.hhmm(now);
    var start = Util.parseDateKey(c['Start Date']) || today;
    var end = Util.parseDateKey(c['End Date']);
    if (end && today > end) return { ok: false, expired: true, reason: 'End date passed' };
    if (today < start) return { ok: false, started: false, reason: 'Starts ' + start };
    var days = Util.parseDays(c['Sending Days']);
    if (!days.length) days = Util.parseDays(settings.defaultSendingDays);
    if (days.indexOf(Util.weekday(now)) < 0) return { ok: false, started: true, reason: 'Not a sending day' };
    var sendTime = Util.parseTime(c['Send Time']) || settings.defaultSendTime;
    var endTime = settings.windowEnd > sendTime ? settings.windowEnd : '23:59';
    if (hm < sendTime) return { ok: false, started: true, reason: 'Before send time ' + sendTime };
    if (hm >= endTime) return { ok: false, started: true, reason: 'After sending window ' + endTime };
    return { ok: true, started: true };
  },

  alreadySentInCampaign_: function (queue, cid, email, self) {
    for (var i = 0; i < queue.rows.length; i++) {
      var q = queue.rows[i];
      if (q === self || String(q['Campaign ID']) !== cid) continue;
      if (ContactManager.normalizeEmail(q['Email Address']) !== email) continue;
      if (q['Status'] === APP.QUEUE_STATUS.SENT || q['Status'] === APP.QUEUE_STATUS.SENDING || q['Status'] === APP.QUEUE_STATUS.BOUNCED) return true;
    }
    return false;
  },

  /** Builds the exact message (and actual recipient) for a queue item. */
  compose_: function (item, contact, content, cid, settings) {
    var email = ContactManager.normalizeEmail(item['Email Address']);
    var msg = EmailContentManager.build(content, contact, { settings: settings, unsubscribeUrl: UnsubscribeManager.buildUrl(email, cid) });
    var to = email;
    if (settings.testMode) {
      to = settings.testRecipient;
      msg.subject = '[TEST for ' + email + '] ' + msg.subject;
    }
    return { to: to, msg: msg, email: email };
  },

  /**
   * Sends one queue item with full bookkeeping.
   * Returns {sent|recovered|retry|failed, quotaExhausted}.
   */
  sendItem_: function (queue, item, contact, contacts, content, c, settings, runId) {
    var cid = String(c['Campaign ID']);
    var m = this.compose_(item, contact, content, cid, settings);
    var prevAttempts = parseInt(item['Attempts'], 10) || 0;

    // A retried item might actually have gone out last time → check Sent first.
    if (prevAttempts > 0 && item['Last Attempt At'] instanceof Date) {
      var found;
      try { found = EmailSender.findSent(m.to, m.msg.subject, item['Last Attempt At']); }
      catch (e) { return { retry: true }; } // cannot verify → do NOT send now
      if (found) {
        this.markSent_(queue, item, contacts, contact, cid, item['Last Attempt At'], found, settings, 'Confirmed in Gmail Sent folder', runId);
        return { recovered: true };
      }
    }

    var attempts = prevAttempts + 1;
    Db.update(queue, item, {
      'Status': APP.QUEUE_STATUS.SENDING, 'Attempts': attempts, 'Last Attempt At': new Date(),
      'Error': 'In flight → ' + m.to
    });
    SpreadsheetApp.flush(); // persist "Sending" BEFORE calling Gmail (crash safety)

    var res;
    try {
      res = EmailSender.send(m.to, m.msg);
    } catch (e) {
      var cls = ErrorHandler.classifySendError(e);
      if (cls.quotaExhausted) {
        // Not sent. Put back without consuming an attempt; try again in an hour.
        this.finishItem_(queue, item, APP.QUEUE_STATUS.RETRY, {
          'Attempts': prevAttempts, 'Next Retry At': new Date(Date.now() + 60 * 60000), 'Error': 'Gmail quota: ' + cls.message
        });
        this.logSend_(cid, item, 'Deferred', 'Quota: ' + cls.message, runId);
        ErrorHandler.warn('EmailScheduler', 'sendItem_', 'Gmail quota reached: ' + cls.message, '', cid);
        return { retry: true, quotaExhausted: true };
      }
      if (cls.temporary && attempts < settings.maxAttempts) {
        var delay = settings.retryDelayMinutes * Math.pow(2, attempts - 1);
        this.finishItem_(queue, item, APP.QUEUE_STATUS.RETRY, {
          'Next Retry At': new Date(Date.now() + delay * 60000), 'Error': 'Attempt ' + attempts + ': ' + cls.message
        });
        ContactManager.markFailed(contacts, contact, cid, cls.message, false);
        this.logSend_(cid, item, 'Retry', cls.message, runId);
        ErrorHandler.warn('EmailScheduler', 'sendItem_', 'Temporary failure, will retry in ' + delay + ' min: ' + cls.message, item['Email Address'], cid, item['Contact ID']);
        return { retry: true };
      }
      this.finishItem_(queue, item, APP.QUEUE_STATUS.FAILED, { 'Error': 'Attempt ' + attempts + ': ' + cls.message });
      ContactManager.markFailed(contacts, contact, cid, cls.message, true);
      this.logSend_(cid, item, 'Failed', cls.message, runId);
      ErrorHandler.log('ERROR', 'EmailScheduler', 'sendItem_', 'Send failed: ' + cls.message, item['Email Address'], cid, item['Contact ID']);
      return { failed: true };
    }

    this.markSent_(queue, item, contacts, contact, cid, new Date(), res.messageId, settings, settings.testMode ? 'TEST MODE → delivered to ' + m.to : '', runId);
    return { sent: true };
  },

  markSent_: function (queue, item, contacts, contact, cid, when, messageId, settings, note, runId) {
    Db.update(queue, item, {
      'Status': APP.QUEUE_STATUS.SENT, 'Sent At': when, 'Gmail Message ID': messageId || '',
      'Next Retry At': '', 'Error': note || ''
    });
    SpreadsheetApp.flush(); // persist "Sent" immediately
    if (!settings.testMode && contact) ContactManager.markSent(contacts, contact, cid, when);
    this.logSend_(cid, item, settings.testMode ? 'Sent (test mode)' : 'Sent', note || messageId || '', runId);
  },

  finishItem_: function (queue, item, status, extra) {
    var f = { 'Status': status };
    Object.keys(extra || {}).forEach(function (k) { f[k] = extra[k]; });
    Db.update(queue, item, f);
    SpreadsheetApp.flush();
  },

  logSend_: function (cid, item, result, detail, runId) {
    try {
      Db.sheet(APP.SHEETS.SEND_LOG).appendRow([new Date(), cid, item['Contact ID'], item['Email Address'], result,
        Util.truncate(detail || '', 500), item['Queue Key'], runId || '']);
    } catch (e) { /* logging must never block sending */ }
  },

  /**
   * Finds items left in "Sending" by an interrupted run and resolves them by
   * checking Gmail's Sent folder. Caller holds the lock, so no other run is
   * active. Returns the number of items resolved.
   */
  recoverInFlight_: function (settings, runId) {
    var queue = Db.read(APP.SHEETS.QUEUE);
    var stuck = queue.rows.filter(function (q) { return q['Status'] === APP.QUEUE_STATUS.SENDING; });
    if (!stuck.length) return 0;
    var contacts = ContactManager.read();
    var byId = ContactManager.indexById(contacts);
    var resolved = 0;
    var self = this;
    stuck.forEach(function (item) {
      var cid = String(item['Campaign ID']);
      var campaigns = CampaignManager.read();
      var c = CampaignManager.find(campaigns, cid);
      var content = c ? EmailContentManager.get(c['Content ID']) : null;
      var contact = byId[String(item['Contact ID'])];
      var last = item['Last Attempt At'] instanceof Date ? item['Last Attempt At'] : new Date(Date.now() - 3600000);
      var inflightTo = (String(item['Error'] || '').match(/In flight → (\S+)/) || [])[1];
      var subject = '';
      if (content) {
        var m = self.compose_(item, contact || {}, content, cid, settings);
        subject = m.msg.subject;
        if (inflightTo && inflightTo !== m.to) {
          // Test mode was toggled since; rebuild subject for the recipient actually used.
          subject = inflightTo === m.email ? EmailContentManager.build(content, contact || {}, { settings: settings }).subject : '[TEST for ' + m.email + '] ' + EmailContentManager.build(content, contact || {}, { settings: settings }).subject;
        }
      }
      var to = inflightTo || ContactManager.normalizeEmail(item['Email Address']);
      var found = '';
      try {
        found = subject ? EmailSender.findSent(to, subject, last) : '';
      } catch (e) {
        return; // cannot verify now; leave as Sending, try next run
      }
      if (found) {
        self.markSent_(queue, item, contacts, contact, cid, last, found, settings, 'Recovered after interruption (found in Gmail Sent)', runId);
        resolved++;
      } else if (Date.now() - last.getTime() > 3 * 60000) {
        self.finishItem_(queue, item, APP.QUEUE_STATUS.RETRY, { 'Next Retry At': new Date(), 'Error': 'Interrupted before Gmail confirmed sending — verified not sent, will retry' });
        self.logSend_(cid, item, 'Recovered', 'Not found in Sent; re-queued', runId);
        resolved++;
      }
    });
    if (resolved) ErrorHandler.info('EmailScheduler', 'recoverInFlight_', 'Recovered ' + resolved + ' interrupted send(s)');
    return resolved;
  },

  /**
   * Estimates the sending date (yyyy-MM-dd) for each of the next `pending`
   * recipients of a campaign, respecting daily limit, sending days and dates.
   * '' = would not be sent before the End Date.
   */
  estimateDates: function (c, pending, sentToday, settings, now) {
    now = now || new Date();
    var out = [];
    if (pending <= 0) return out;
    var today = Util.dayKey(now);
    var hm = Util.hhmm(now);
    var limit = parseInt(c['Daily Limit'], 10) || settings.defaultDailyLimit;
    var start = Util.parseDateKey(c['Start Date']) || today;
    var end = Util.parseDateKey(c['End Date']);
    var days = Util.parseDays(c['Sending Days']);
    if (!days.length) days = Util.parseDays(settings.defaultSendingDays);
    var sendTime = Util.parseTime(c['Send Time']) || settings.defaultSendTime;
    var endTime = settings.windowEnd > sendTime ? settings.windowEnd : '23:59';
    var d = start > today ? start : today;
    for (var guard = 0; guard < 3660 && out.length < pending; guard++) {
      if (end && d > end) break;
      var cap = days.indexOf(Util.weekdayOfKey(d)) >= 0 ? limit : 0;
      if (d === today) cap = hm >= endTime ? 0 : Math.max(0, cap - (sentToday || 0));
      for (var k = 0; k < cap && out.length < pending; k++) out.push(d);
      d = Util.addDaysKey(d, 1);
    }
    while (out.length < pending) out.push('');
    return out;
  },

  // ---------------------------------------------------------------- triggers

  /** (Re)creates all time-driven triggers. Idempotent. */
  installTriggers: function () {
    var settings = Config.load(true);
    var self = this;
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (self.TRIGGER_HANDLERS.indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger('schedulerTick').timeBased().everyMinutes(settings.intervalMinutes).create();
    ScriptApp.newTrigger('inboxTick').timeBased().everyHours(1).create();
    ScriptApp.newTrigger('dailyMaintenanceTick').timeBased().everyDays(1).atHour(6).inTimezone(APP.TZ).create();
    PropertiesService.getScriptProperties().setProperty('TRIGGERS_INSTALLED_AT', String(Date.now()));
    ErrorHandler.info('EmailScheduler', 'installTriggers', 'Cloud triggers installed (scheduler every ' + settings.intervalMinutes + ' min, inbox hourly, maintenance daily 06:00 Dubai).');
    return settings.intervalMinutes;
  },

  removeTriggers: function () {
    var self = this, n = 0;
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (self.TRIGGER_HANDLERS.indexOf(t.getHandlerFunction()) >= 0) { ScriptApp.deleteTrigger(t); n++; }
    });
    ErrorHandler.warn('EmailScheduler', 'removeTriggers', 'All automation triggers removed (' + n + '). No emails will be sent until triggers are re-installed.');
    return n;
  },

  triggerStatus: function () {
    var found = {};
    var self = this;
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (self.TRIGGER_HANDLERS.indexOf(t.getHandlerFunction()) >= 0) found[t.getHandlerFunction()] = true;
    });
    return { scheduler: !!found.schedulerTick, inbox: !!found.inboxTick, maintenance: !!found.dailyMaintenanceTick };
  },

  ensureTriggers: function () {
    var s = this.triggerStatus();
    if (!s.scheduler || !s.inbox || !s.maintenance) this.installTriggers();
  },

  // ---------------------------------------------------------------- maintenance

  dailyMaintenance: function () {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(60000)) return;
    try {
      ErrorHandler.trimLogs();
      ContactManager.validateAll();
      UnsubscribeManager.syncSuppressedContacts();
    } catch (e) {
      ErrorHandler.critical('EmailScheduler', 'dailyMaintenance', e);
    } finally {
      lock.releaseLock();
    }
    DashboardManager.refresh({ quick: false });
    this.sendDailySummary_();
  },

  sendDailySummary_: function () {
    try {
      var settings = Config.load();
      if (!settings.notifyEmail || EmailSender.remainingQuota() < 1) return;
      var active = CampaignManager.read().rows.filter(function (c) {
        return c['Status'] === APP.CAMPAIGN_STATUS.ACTIVE || c['Status'] === APP.CAMPAIGN_STATUS.SCHEDULED;
      });
      if (!active.length) return;
      var yesterday = Util.addDaysKey(Util.dayKey(new Date()), -1);
      var log = Db.read(APP.SHEETS.SEND_LOG).rows.filter(function (r) { return r['Timestamp'] instanceof Date && Util.dayKey(r['Timestamp']) === yesterday; });
      var count = function (re) { return log.filter(function (r) { return re.test(String(r['Result'])); }).length; };
      var lines = active.map(function (c) {
        return '• ' + c['Campaign ID'] + ' ' + c['Campaign Name'] + ': ' + c['Sent'] + '/' + c['Total Recipients'] + ' sent (' + c['Progress %'] + '%), est. finish ' + Util.fmtDate(c['Est. Finish Date']);
      });
      MailApp.sendEmail(settings.notifyEmail, '[' + APP.NAME + '] Daily report ' + yesterday,
        'Yesterday: ' + count(/^Sent/) + ' sent, ' + count(/^Failed/) + ' failed, ' + count(/^Retry/) + ' retries, ' + count(/^Skipped/) + ' skipped.\n\n' +
        'Running campaigns:\n' + lines.join('\n') + (settings.testMode ? '\n\n⚠ TEST MODE IS ON — no real contacts are being emailed.' : '') +
        '\n\nDashboard: ' + Db.ss().getUrl());
    } catch (e) {
      ErrorHandler.warn('EmailScheduler', 'sendDailySummary_', 'Daily summary not sent: ' + e.message);
    }
  }
};

/** Re-reads one campaign's Status cell straight from the sheet. */
CampaignManager.liveStatus_ = function (c) {
  var t = CampaignManager.read();
  var fresh = CampaignManager.find(t, c['Campaign ID']);
  return fresh ? String(fresh['Status']) : '';
};
