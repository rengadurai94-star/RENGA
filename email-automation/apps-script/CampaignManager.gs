/**
 * CampaignManager.gs
 * ----------------------------------------------------------------------------
 * Campaign lifecycle: create → (build recipient queue) → start → pause /
 * resume / stop → completed. Every campaign has its OWN rows in the
 * "Campaign Queue" sheet (key = CampaignID|ContactID), so campaigns never mix
 * their contact statuses and a contact can only ever be emailed once per
 * campaign.
 */

var CampaignManager = {

  read: function () { return Db.read(APP.SHEETS.CAMPAIGNS); },

  find: function (table, id) {
    for (var i = 0; i < table.rows.length; i++) {
      if (String(table.rows[i]['Campaign ID']) === String(id)) return table.rows[i];
    }
    return null;
  },

  getOrThrow_: function (table, id) {
    var c = this.find(table, id);
    if (!c) throw new Error('Campaign "' + id + '" not found.');
    return c;
  },

  withLock_: function (fn) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(45000)) throw new Error('The system is busy (a send run is in progress). Please try again in a minute.');
    try { return fn(); } finally { lock.releaseLock(); }
  },

  /** Validates & normalises campaign settings coming from the UI. */
  normalizeForm_: function (f, settings) {
    var out = {};
    out.name = String(f.name || '').trim();
    if (!out.name) throw new Error('Please enter a campaign name.');
    out.contentId = String(f.contentId || '').trim();
    if (!out.contentId || !EmailContentManager.get(out.contentId)) throw new Error('Please choose the email content for this campaign.');
    out.target = String(f.target || 'ALL').trim() || 'ALL';
    out.startDate = Util.parseDateKey(f.startDate) || Util.dayKey(new Date());
    out.endDate = Util.parseDateKey(f.endDate) || '';
    if (out.endDate && out.endDate < out.startDate) throw new Error('End date is before start date.');
    out.sendTime = Util.parseTime(f.sendTime) || settings.defaultSendTime;
    if (out.sendTime >= settings.windowEnd) throw new Error('Send time ' + out.sendTime + ' must be earlier than the sending window end (' + settings.windowEnd + ' in Settings).');
    var lim = parseInt(f.dailyLimit, 10);
    out.dailyLimit = lim > 0 ? lim : settings.defaultDailyLimit;
    if (out.dailyLimit > settings.globalDailyCap) throw new Error('Daily limit ' + out.dailyLimit + ' is higher than GLOBAL_DAILY_CAP (' + settings.globalDailyCap + ') in Settings.');
    var days = Util.parseDays(f.sendingDays || settings.defaultSendingDays);
    if (!days.length) throw new Error('Please choose at least one sending day.');
    out.sendingDays = days.join(',');
    return out;
  },

  create: function (form) {
    var settings = Config.load();
    var f = this.normalizeForm_(form, settings);
    // Validate the target expression now (throws on bad syntax).
    ContactManager.selectTargets(ContactManager.read(), f.target);
    return this.withLock_(function () {
      var t = CampaignManager.read();
      var id = Db.nextId(t, 'Campaign ID', 'CMP-', 3);
      Db.appendObjects(APP.SHEETS.CAMPAIGNS, [{
        'Campaign ID': id, 'Campaign Name': f.name, 'Status': APP.CAMPAIGN_STATUS.DRAFT,
        'Content ID': f.contentId, 'Target': f.target, 'Start Date': Util.keyToDate(f.startDate),
        'Send Time': f.sendTime, 'End Date': f.endDate ? Util.keyToDate(f.endDate) : '',
        'Daily Limit': f.dailyLimit, 'Sending Days': f.sendingDays,
        'Total Recipients': 0, 'Sent': 0, 'Failed': 0, 'Pending': 0, 'Skipped': 0, 'Progress %': 0,
        'Sent Today': 0, 'Created At': new Date(), 'Notes': String(form.notes || '')
      }]);
      ErrorHandler.info('CampaignManager', 'create', 'Created campaign ' + id + ' "' + f.name + '"', JSON.stringify(f), id);
      return id;
    });
  },

  /** Edits schedule settings of an existing campaign (allowed in any state). */
  updateSettings: function (id, form) {
    var settings = Config.load();
    return this.withLock_(function () {
      var t = CampaignManager.read();
      var c = CampaignManager.getOrThrow_(t, id);
      var fields = {};
      if (form.dailyLimit !== undefined && form.dailyLimit !== '') {
        var lim = parseInt(form.dailyLimit, 10);
        if (!(lim > 0)) throw new Error('Daily limit must be a positive number.');
        if (lim > settings.globalDailyCap) throw new Error('Daily limit is higher than GLOBAL_DAILY_CAP (' + settings.globalDailyCap + ').');
        fields['Daily Limit'] = lim;
      }
      if (form.sendTime) {
        var st = Util.parseTime(form.sendTime);
        if (!st) throw new Error('Invalid send time. Use HH:MM, e.g. 09:30');
        if (st >= settings.windowEnd) throw new Error('Send time must be earlier than ' + settings.windowEnd + '.');
        fields['Send Time'] = st;
      }
      if (form.sendingDays) {
        var d = Util.parseDays(form.sendingDays);
        if (!d.length) throw new Error('Invalid sending days.');
        fields['Sending Days'] = d.join(',');
      }
      if (form.startDate) {
        var sd = Util.parseDateKey(form.startDate);
        if (!sd) throw new Error('Invalid start date.');
        fields['Start Date'] = Util.keyToDate(sd);
      }
      if (form.endDate !== undefined) {
        var ed = Util.parseDateKey(form.endDate);
        fields['End Date'] = ed ? Util.keyToDate(ed) : '';
      }
      if (form.name) fields['Campaign Name'] = String(form.name).trim();
      if (form.contentId) {
        if (!EmailContentManager.get(form.contentId)) throw new Error('Content not found.');
        fields['Content ID'] = form.contentId;
      }
      if (Object.keys(fields).length) Db.update(t, c, fields);
      ErrorHandler.info('CampaignManager', 'updateSettings', 'Updated ' + id, JSON.stringify(form), id);
      return true;
    });
  },

  /**
   * Adds every eligible target contact that is not yet in this campaign's
   * queue. Caller must hold the lock. Returns {added, ineligible, duplicates}.
   */
  buildQueue_: function (c) {
    var settings = Config.load();
    var id = String(c['Campaign ID']);
    var contacts = ContactManager.read();
    var targets = ContactManager.selectTargets(contacts, c['Target']);
    var suppression = UnsubscribeManager.loadSuppression();
    var queue = Db.read(APP.SHEETS.QUEUE);
    var existingKeys = {}, existingEmails = {}, maxOrder = 0;
    queue.rows.forEach(function (q) {
      if (String(q['Campaign ID']) !== id) return;
      existingKeys[String(q['Queue Key'])] = true;
      existingEmails[ContactManager.normalizeEmail(q['Email Address'])] = true;
      maxOrder = Math.max(maxOrder, parseInt(q['Queue Order'], 10) || 0);
    });
    var res = { added: 0, ineligible: 0, duplicates: 0, reasons: {} };
    var now = new Date();
    var rows = [];
    targets.forEach(function (contact) {
      var cid = String(contact['Contact ID'] || '');
      var email = ContactManager.normalizeEmail(contact['Email Address']);
      if (!cid || !email) { res.ineligible++; res.reasons['Missing ID/email (run Validate Contacts)'] = (res.reasons['Missing ID/email (run Validate Contacts)'] || 0) + 1; return; }
      var key = id + '|' + cid;
      if (existingKeys[key] || existingEmails[email]) { res.duplicates++; return; }
      var el = ContactManager.checkEligibility(contact, email, settings, suppression);
      if (!el.ok) { res.ineligible++; res.reasons[el.reason] = (res.reasons[el.reason] || 0) + 1; return; }
      existingKeys[key] = true;
      existingEmails[email] = true;
      rows.push({
        'Queue Key': key, 'Campaign ID': id, 'Contact ID': cid, 'Email Address': email,
        'Status': APP.QUEUE_STATUS.PENDING, 'Attempts': 0, 'Queued At': now, 'Queue Order': ++maxOrder
      });
      res.added++;
    });
    Db.appendObjects(APP.SHEETS.QUEUE, rows);
    SpreadsheetApp.flush();
    return res;
  },

  /** Starts a Draft campaign (or restarts nothing — use resume for paused ones). */
  start: function (id) {
    var self = this;
    var out = this.withLock_(function () {
      var t = self.read();
      var c = self.getOrThrow_(t, id);
      var st = String(c['Status']);
      if (st === APP.CAMPAIGN_STATUS.ACTIVE || st === APP.CAMPAIGN_STATUS.SCHEDULED) throw new Error('Campaign is already running.');
      if (st === APP.CAMPAIGN_STATUS.COMPLETED || st === APP.CAMPAIGN_STATUS.STOPPED) throw new Error('Campaign is ' + st + '. Create a new campaign instead (contacts already emailed will not be emailed twice by this campaign).');
      if (st === APP.CAMPAIGN_STATUS.PAUSED) throw new Error('Campaign is paused — use Resume.');
      var content = EmailContentManager.get(c['Content ID']);
      if (!content) throw new Error('Content ' + c['Content ID'] + ' not found.');
      var problems = EmailContentManager.validate(content);
      if (problems.length) throw new Error('Fix the email content first:\n- ' + problems.join('\n- '));
      if (content.status !== APP.CONTENT_STATUS.READY) throw new Error('Content ' + content.id + ' is still a Draft. Open the Content Editor, review it and save it as "Ready".');
      var q = self.buildQueue_(c);
      var total = self.countQueue_(id).total;
      if (!total) throw new Error('No eligible contacts for target "' + c['Target'] + '". ' + JSON.stringify(q.reasons));
      var today = Util.dayKey(new Date());
      var startKey = Util.parseDateKey(c['Start Date']) || today;
      Db.update(t, c, {
        'Status': startKey > today ? APP.CAMPAIGN_STATUS.SCHEDULED : APP.CAMPAIGN_STATUS.ACTIVE,
        'Started At': new Date()
      });
      ErrorHandler.info('CampaignManager', 'start', 'Started ' + id + ' with ' + q.added + ' recipients', JSON.stringify(q), id);
      return q;
    });
    EmailScheduler.ensureTriggers();
    this.refreshStats(id);
    return out;
  },

  pause: function (id) {
    return this.setStatus_(id, [APP.CAMPAIGN_STATUS.ACTIVE, APP.CAMPAIGN_STATUS.SCHEDULED], APP.CAMPAIGN_STATUS.PAUSED);
  },

  resume: function (id) {
    var t = this.read();
    var c = this.getOrThrow_(t, id);
    if (String(c['Status']) !== APP.CAMPAIGN_STATUS.PAUSED) throw new Error('Only paused campaigns can be resumed (current status: ' + c['Status'] + ').');
    var content = EmailContentManager.get(c['Content ID']);
    var problems = content ? EmailContentManager.validate(content) : ['Content not found'];
    if (problems.length) throw new Error('Fix the email content first:\n- ' + problems.join('\n- '));
    var today = Util.dayKey(new Date());
    var startKey = Util.parseDateKey(c['Start Date']) || today;
    Db.update(t, c, { 'Status': startKey > today ? APP.CAMPAIGN_STATUS.SCHEDULED : APP.CAMPAIGN_STATUS.ACTIVE, 'Notes': String(c['Notes'] || '').replace(/^AUTO-PAUSED:.*$/, '') });
    SpreadsheetApp.flush();
    ErrorHandler.info('CampaignManager', 'resume', 'Resumed ' + id, '', id);
    EmailScheduler.ensureTriggers();
    return true;
  },

  /**
   * Permanently stops a campaign. The status is written immediately (the
   * scheduler re-checks it before every single email); pending recipients are
   * then cancelled — right away if possible, otherwise by the next scheduler run.
   */
  stop: function (id) {
    var t = this.read();
    var c = this.getOrThrow_(t, id);
    var st = String(c['Status']);
    if (st === APP.CAMPAIGN_STATUS.COMPLETED || st === APP.CAMPAIGN_STATUS.STOPPED) throw new Error('Campaign is already ' + st + '.');
    Db.update(t, c, { 'Status': APP.CAMPAIGN_STATUS.STOPPED, 'Completed At': new Date() });
    SpreadsheetApp.flush();
    var lock = LockService.getScriptLock();
    var n = 0;
    if (lock.tryLock(20000)) {
      try {
        n = this.cancelPending_(id, 'Campaign stopped by user');
        var t2 = this.read();
        this.refreshStats_(t2, this.find(t2, id));
      } finally { lock.releaseLock(); }
    }
    ErrorHandler.info('CampaignManager', 'stop', 'Stopped ' + id + ' (' + n + ' pending cancelled)', '', id);
    return n;
  },

  /** Adds contacts imported after the campaign started. */
  addNewContacts: function (id) {
    var self = this;
    return this.withLock_(function () {
      var t = self.read();
      var c = self.getOrThrow_(t, id);
      var st = String(c['Status']);
      if (st === APP.CAMPAIGN_STATUS.COMPLETED || st === APP.CAMPAIGN_STATUS.STOPPED) throw new Error('Campaign is ' + st + '.');
      var q = self.buildQueue_(c);
      self.refreshStats_(t, c);
      return q;
    });
  },

  /** Deletes a Draft campaign that was never started. */
  deleteDraft: function (id) {
    var self = this;
    return this.withLock_(function () {
      var t = self.read();
      var c = self.getOrThrow_(t, id);
      if (String(c['Status']) !== APP.CAMPAIGN_STATUS.DRAFT) throw new Error('Only Draft campaigns can be deleted. Use Stop instead.');
      t.sheet.deleteRow(c._row);
      return true;
    });
  },

  /**
   * Status changes (pause) do NOT wait for the lock: the scheduler re-reads the
   * campaign status from the sheet before every single email, so a pause takes
   * effect immediately, even in the middle of a run.
   */
  setStatus_: function (id, allowedFrom, to) {
    var t = this.read();
    var c = this.getOrThrow_(t, id);
    if (allowedFrom.indexOf(String(c['Status'])) < 0) throw new Error('Cannot change campaign from ' + c['Status'] + ' to ' + to + '.');
    Db.update(t, c, { 'Status': to });
    SpreadsheetApp.flush();
    ErrorHandler.info('CampaignManager', 'setStatus', id + ' → ' + to, '', id);
    return true;
  },

  /** Caller holds lock. Cancels Pending/Retry items of a campaign. */
  cancelPending_: function (id, reason) {
    var queue = Db.read(APP.SHEETS.QUEUE);
    var n = 0;
    queue.rows.forEach(function (q) {
      if (String(q['Campaign ID']) === String(id) &&
        (q['Status'] === APP.QUEUE_STATUS.PENDING || q['Status'] === APP.QUEUE_STATUS.RETRY)) {
        Db.update(queue, q, { 'Status': APP.QUEUE_STATUS.CANCELLED, 'Error': reason });
        n++;
      }
    });
    return n;
  },

  /** Caller holds lock. Skips Pending/Retry items for the given contact IDs (or email). */
  cancelQueueForContacts: function (idMap, reason, email) {
    var queue = Db.read(APP.SHEETS.QUEUE);
    var n = 0;
    queue.rows.forEach(function (q) {
      var match = idMap[String(q['Contact ID'])] || (email && ContactManager.normalizeEmail(q['Email Address']) === email);
      if (match && (q['Status'] === APP.QUEUE_STATUS.PENDING || q['Status'] === APP.QUEUE_STATUS.RETRY)) {
        Db.update(queue, q, { 'Status': APP.QUEUE_STATUS.SKIPPED, 'Error': reason });
        n++;
      }
    });
    return n;
  },

  /** Counts queue statuses for one campaign (optionally from an already-read queue). */
  countQueue_: function (id, queue) {
    queue = queue || Db.read(APP.SHEETS.QUEUE);
    var today = Util.dayKey(new Date());
    var s = { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0, sentToday: 0, bounced: 0, sending: 0 };
    queue.rows.forEach(function (q) {
      if (String(q['Campaign ID']) !== String(id)) return;
      s.total++;
      var st = q['Status'];
      if (st === APP.QUEUE_STATUS.SENT || st === APP.QUEUE_STATUS.BOUNCED) {
        s.sent++;
        if (st === APP.QUEUE_STATUS.BOUNCED) s.bounced++;
        if (q['Sent At'] instanceof Date && Util.dayKey(q['Sent At']) === today) s.sentToday++;
      } else if (st === APP.QUEUE_STATUS.FAILED) s.failed++;
      else if (st === APP.QUEUE_STATUS.PENDING || st === APP.QUEUE_STATUS.RETRY) s.pending++;
      else if (st === APP.QUEUE_STATUS.SENDING) { s.pending++; s.sending++; }
      else s.skipped++; // Skipped / Cancelled
    });
    s.done = s.total - s.pending;
    s.progress = s.total ? Math.round((s.done / s.total) * 1000) / 10 : 0;
    return s;
  },

  refreshStats: function (id) {
    var t = this.read();
    var c = this.find(t, id);
    if (c) this.refreshStats_(t, c);
  },

  /**
   * Updates the counters on the campaign row and completes the campaign when
   * nothing is left to send.
   */
  refreshStats_: function (t, c, queue) {
    var id = String(c['Campaign ID']);
    var s = this.countQueue_(id, queue);
    var fields = {
      'Total Recipients': s.total, 'Sent': s.sent, 'Failed': s.failed + s.bounced,
      'Pending': s.pending, 'Skipped': s.skipped, 'Progress %': s.progress, 'Sent Today': s.sentToday
    };
    var st = String(c['Status']);
    if ((st === APP.CAMPAIGN_STATUS.ACTIVE || st === APP.CAMPAIGN_STATUS.SCHEDULED || st === APP.CAMPAIGN_STATUS.PAUSED) && s.total > 0 && s.pending === 0) {
      fields['Status'] = APP.CAMPAIGN_STATUS.COMPLETED;
      fields['Completed At'] = new Date();
      fields['Est. Finish Date'] = '';
      this.notifyCompleted_(c, s);
    } else if (st === APP.CAMPAIGN_STATUS.ACTIVE || st === APP.CAMPAIGN_STATUS.SCHEDULED) {
      var est = EmailScheduler.estimateDates(c, s.pending, s.sentToday, Config.load());
      fields['Est. Finish Date'] = est.length && est[est.length - 1] ? Util.keyToDate(est[est.length - 1]) : '';
    } else {
      fields['Est. Finish Date'] = '';
    }
    Db.update(t, c, fields);
    return s;
  },

  notifyCompleted_: function (c, s) {
    try {
      var to = Config.load().notifyEmail;
      if (!to || EmailSender.remainingQuota() < 1) return;
      MailApp.sendEmail(to, '[' + APP.NAME + '] Campaign completed: ' + c['Campaign Name'],
        'Campaign ' + c['Campaign ID'] + ' "' + c['Campaign Name'] + '" has finished.\n\n' +
        'Recipients: ' + s.total + '\nSent: ' + s.sent + '\nFailed/bounced: ' + (s.failed + s.bounced) +
        '\nSkipped (unsubscribed, no permission, etc.): ' + s.skipped + '\n\nSpreadsheet: ' + Db.ss().getUrl());
    } catch (e) {
      ErrorHandler.warn('CampaignManager', 'notifyCompleted_', 'Could not send completion email: ' + e.message);
    }
  },

  /** Summary objects for the Control Panel. */
  listForUi: function () {
    var t = this.read();
    return t.rows.map(function (c) {
      return {
        id: String(c['Campaign ID']), name: String(c['Campaign Name'] || ''), status: String(c['Status'] || ''),
        contentId: String(c['Content ID'] || ''), target: String(c['Target'] || ''),
        startDate: Util.parseDateKey(c['Start Date']), endDate: Util.parseDateKey(c['End Date']),
        sendTime: Util.parseTime(c['Send Time']), dailyLimit: c['Daily Limit'], sendingDays: String(c['Sending Days'] || ''),
        total: c['Total Recipients'] || 0, sent: c['Sent'] || 0, failed: c['Failed'] || 0, pending: c['Pending'] || 0,
        skipped: c['Skipped'] || 0, progress: c['Progress %'] || 0, sentToday: c['Sent Today'] || 0,
        estFinish: Util.fmtDate(c['Est. Finish Date']), lastRun: Util.fmtDateTime(c['Last Run'])
      };
    }).reverse();
  }
};
