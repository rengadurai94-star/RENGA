/**
 * UnsubscribeManager.gs
 * ----------------------------------------------------------------------------
 * Unsubscribe links (signed, tamper-proof), the suppression list, and
 * automatic processing of bounces and "unsubscribe" replies in Gmail.
 */

var UnsubscribeManager = {

  secret_: function () {
    var props = PropertiesService.getScriptProperties();
    var s = props.getProperty('UNSUB_SECRET');
    if (!s) {
      s = Utilities.getUuid() + Utilities.getUuid();
      props.setProperty('UNSUB_SECRET', s);
    }
    return s;
  },

  b64url_: function (bytesOrString) {
    return Utilities.base64EncodeWebSafe(bytesOrString).replace(/=+$/, '');
  },

  fromB64url_: function (s) {
    var pad = s.length % 4 === 0 ? '' : new Array(5 - (s.length % 4)).join('=');
    return Utilities.newBlob(Utilities.base64DecodeWebSafe(s + pad)).getDataAsString();
  },

  token: function (email) {
    var sig = Utilities.computeHmacSha256Signature(ContactManager.normalizeEmail(email), this.secret_());
    return this.b64url_(sig).slice(0, 24);
  },

  /** Unsubscribe URL for an email footer. */
  buildUrl: function (email, campaignId) {
    var settings = Config.load();
    email = ContactManager.normalizeEmail(email);
    if (settings.unsubWebAppUrl) {
      var sep = settings.unsubWebAppUrl.indexOf('?') >= 0 ? '&' : '?';
      return settings.unsubWebAppUrl + sep + 'a=unsubscribe&e=' + encodeURIComponent(this.b64url_(email)) +
        '&c=' + encodeURIComponent(campaignId || '') + '&t=' + encodeURIComponent(this.token(email));
    }
    var owner = Util.ownerEmail();
    if (!owner) return '';
    return 'mailto:' + owner + '?subject=' + encodeURIComponent('Unsubscribe') +
      '&body=' + encodeURIComponent('Please unsubscribe ' + email + ' from future emails.');
  },

  /** Returns the email address if the link is genuine, otherwise null. */
  verify: function (e64, token) {
    try {
      var email = ContactManager.normalizeEmail(this.fromB64url_(String(e64 || '')));
      if (!ContactManager.isValidEmail(email)) return null;
      return this.token(email) === String(token || '') ? email : null;
    } catch (e) {
      return null;
    }
  },

  // ---------------------------------------------------------------- suppression

  loadSuppression: function () {
    var out = { emails: {}, domains: {} };
    var sh = Db.ss().getSheetByName(APP.SHEETS.SUPPRESSION);
    if (!sh || sh.getLastRow() < 2) return out;
    sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues().forEach(function (r) {
      var v = String(r[0] || '').trim().toLowerCase();
      if (!v) return;
      if (v.charAt(0) === '@') out.domains[v.slice(1)] = true;
      else if (v.indexOf('@') < 0) out.domains[v] = true;
      else out.emails[v] = true;
    });
    return out;
  },

  isSuppressed: function (email, sup) {
    sup = sup || this.loadSuppression();
    email = ContactManager.normalizeEmail(email);
    if (sup.emails[email]) return true;
    var dom = email.split('@')[1] || '';
    return !!sup.domains[dom];
  },

  addSuppression: function (emailOrDomain, reason, source) {
    var v = String(emailOrDomain || '').trim().toLowerCase();
    if (!v) return false;
    var sup = this.loadSuppression();
    if (sup.emails[v] || sup.domains[v.replace(/^@/, '')]) return false;
    Db.sheet(APP.SHEETS.SUPPRESSION).appendRow([v, reason || '', new Date(), source || '']);
    return true;
  },

  // ---------------------------------------------------------------- unsubscribe

  /**
   * Unsubscribes an address everywhere: suppression list, contact row(s), and
   * all pending campaign queue items. Safe to call from the web app while a
   * send run is in progress — the suppression row is written first and is
   * checked immediately before every single send.
   */
  unsubscribe: function (email, source, campaignId) {
    email = ContactManager.normalizeEmail(email);
    if (!ContactManager.isValidEmail(email)) return false;
    this.addSuppression(email, 'Unsubscribed' + (campaignId ? ' (' + campaignId + ')' : ''), source || 'Unsubscribe');
    SpreadsheetApp.flush();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) {
      ErrorHandler.info('UnsubscribeManager', 'unsubscribe', 'Suppressed ' + email + '; contact row will be synced on next dashboard refresh.', source);
      return true;
    }
    try {
      this.applyUnsubscribe_(email, source);
    } finally {
      lock.releaseLock();
    }
    ErrorHandler.info('UnsubscribeManager', 'unsubscribe', 'Unsubscribed ' + email, source, campaignId);
    return true;
  },

  /** Internal: caller must hold the script lock. */
  applyUnsubscribe_: function (email, source) {
    var table = ContactManager.read();
    var ids = {};
    table.rows.forEach(function (r) {
      if (ContactManager.normalizeEmail(r['Email Address']) === email) {
        ids[String(r['Contact ID'])] = true;
        if (String(r['Unsubscribe Status']).toLowerCase().indexOf('unsub') !== 0) {
          Db.update(table, r, {
            'Unsubscribe Status': APP.UNSUB.UNSUBSCRIBED,
            'Campaign Status': 'Unsubscribed',
            'Next Scheduled Date': '',
            'Notes': Util.truncate(String(r['Notes'] || '') + (r['Notes'] ? ' | ' : '') + 'Unsubscribed ' + Util.fmtDateTime(new Date()) + ' via ' + (source || 'link'), 500)
          });
        }
      }
    });
    CampaignManager.cancelQueueForContacts(ids, 'Unsubscribed', email);
  },

  /** Makes Contacts reflect the Suppression List (e.g. after a web-app unsubscribe without the lock). Caller holds lock. */
  syncSuppressedContacts: function () {
    var sup = this.loadSuppression();
    var table = ContactManager.read();
    var ids = {};
    table.rows.forEach(function (r) {
      var e = ContactManager.normalizeEmail(r['Email Address']);
      if (e && UnsubscribeManager.isSuppressed(e, sup) && String(r['Unsubscribe Status']).toLowerCase().indexOf('unsub') !== 0) {
        Db.update(table, r, { 'Unsubscribe Status': APP.UNSUB.UNSUBSCRIBED, 'Campaign Status': 'Suppressed', 'Next Scheduled Date': '' });
        ids[String(r['Contact ID'])] = true;
      }
    });
    if (Object.keys(ids).length) CampaignManager.cancelQueueForContacts(ids, 'Suppressed');
  },

  // ---------------------------------------------------------------- inbox processing

  /**
   * Scans Gmail for (1) bounce notifications and (2) replies asking to
   * unsubscribe. Processed threads get a label so they are handled once.
   * Runs from an hourly trigger.
   */
  processInbox: function () {
    var settings = Config.load(true);
    if (!settings.processInbox) return { bounces: 0, unsubscribes: 0 };
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(60000)) return { bounces: 0, unsubscribes: 0, skipped: 'busy' };
    var result = { bounces: 0, unsubscribes: 0 };
    try {
      var label = GmailApp.getUserLabelByName(APP.LABEL_PROCESSED) || GmailApp.createLabel(APP.LABEL_PROCESSED);
      var queue = Db.read(APP.SHEETS.QUEUE);
      var sentEmails = {};
      queue.rows.forEach(function (q) {
        if (q['Status'] === APP.QUEUE_STATUS.SENT) sentEmails[ContactManager.normalizeEmail(q['Email Address'])] = q;
      });
      var owner = Util.ownerEmail().toLowerCase();
      var notLabelled = ' -label:"' + APP.LABEL_PROCESSED + '"';

      // (1) Bounces
      var bq = 'newer_than:7d' + notLabelled + ' (from:mailer-daemon OR from:postmaster OR subject:"Delivery Status Notification (Failure)" OR subject:Undeliverable OR subject:"Undelivered Mail" OR subject:"Mail delivery failed" OR subject:"Returned mail")';
      GmailApp.search(bq, 0, 50).forEach(function (thread) {
        thread.getMessages().forEach(function (m) {
          var subj = String(m.getSubject() || '');
          if (/delay|delayed|will retry|warning/i.test(subj)) return; // soft / temporary
          var failed = [];
          try {
            var hdr = m.getHeader('X-Failed-Recipients');
            if (hdr) failed = hdr.split(/[,\s]+/);
          } catch (e) { /* header API not available */ }
          if (!failed.length) {
            var body = String(m.getPlainBody() || '').slice(0, 4000);
            failed = body.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g) || [];
          }
          failed.map(ContactManager.normalizeEmail).forEach(function (addr) {
            if (!addr || addr === owner || !sentEmails[addr]) return;
            if (UnsubscribeManager.markBounced_(addr, subj)) result.bounces++;
          });
        });
        thread.addLabel(label);
      });

      // (2) Unsubscribe replies
      var uq = 'in:inbox newer_than:14d' + notLabelled + ' (unsubscribe OR "remove me" OR "opt out" OR "opt-out" OR "stop sending" OR "do not email" OR "don\'t email")';
      GmailApp.search(uq, 0, 50).forEach(function (thread) {
        thread.getMessages().forEach(function (m) {
          var from = (String(m.getFrom()).match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/) || [''])[0].toLowerCase();
          if (!from || from === owner) return;
          var subj = String(m.getSubject() || '');
          var firstLines = String(m.getPlainBody() || '').split(/\r?\n/).filter(function (l) { return l.trim() && l.trim().charAt(0) !== '>'; }).slice(0, 5).join(' ');
          var asks = /\b(unsubscribe|remove me|opt[ -]?out|stop sending|do not (email|contact)|don't (email|contact))\b/i;
          if (!(asks.test(subj) || asks.test(firstLines))) return;
          // The sender is unsubscribed. If the reply came from the footer's mailto link
          // ("Please unsubscribe x@y ...") the named address is unsubscribed too
          // (erring on the side of NOT emailing someone).
          var named = (String(m.getPlainBody() || '').match(/unsubscribe\s+([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})/i) || [])[1];
          var targets = [from];
          named = ContactManager.normalizeEmail(named);
          if (named && named !== from && named !== owner && ContactManager.isValidEmail(named)) targets.push(named);
          targets.forEach(function (addr) {
            UnsubscribeManager.addSuppression(addr, 'Unsubscribe reply', 'Gmail reply');
            UnsubscribeManager.applyUnsubscribe_(addr, 'Reply email');
            result.unsubscribes++;
          });
        });
        thread.addLabel(label);
      });

      if (result.bounces || result.unsubscribes) {
        ErrorHandler.info('UnsubscribeManager', 'processInbox', 'Processed inbox: ' + result.bounces + ' bounces, ' + result.unsubscribes + ' unsubscribe replies');
      }
      PropertiesService.getScriptProperties().setProperty('LAST_INBOX_RUN', String(Date.now()));
    } catch (e) {
      ErrorHandler.error('UnsubscribeManager', 'processInbox', e);
    } finally {
      lock.releaseLock();
    }
    return result;
  },

  /** Caller holds lock. Marks the latest sent queue item(s) + contact as bounced and suppresses the address. */
  markBounced_: function (email, detail) {
    var queue = Db.read(APP.SHEETS.QUEUE);
    var changed = false;
    queue.rows.forEach(function (q) {
      if (q['Status'] === APP.QUEUE_STATUS.SENT && ContactManager.normalizeEmail(q['Email Address']) === email) {
        Db.update(queue, q, { 'Status': APP.QUEUE_STATUS.BOUNCED, 'Error': Util.truncate('Bounce: ' + detail, 300) });
        changed = true;
      }
    });
    if (!changed) return false;
    this.addSuppression(email, 'Hard bounce', 'Bounce notification');
    var contacts = ContactManager.read();
    contacts.rows.forEach(function (r) {
      if (ContactManager.normalizeEmail(r['Email Address']) === email) {
        Db.update(contacts, r, { 'Delivery Status': 'Bounced', 'Error Log': Util.truncate('Bounced ' + Util.fmtDateTime(new Date()) + ': ' + detail, 300) });
      }
    });
    ErrorHandler.warn('UnsubscribeManager', 'markBounced_', 'Bounce detected for ' + email, detail);
    return true;
  }
};
