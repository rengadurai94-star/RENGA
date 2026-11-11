/**
 * ErrorHandler.gs
 * ----------------------------------------------------------------------------
 * Central logging, error classification, owner notifications and a safe
 * wrapper for menu / UI actions.
 */

var ErrorHandler = {
  MAX_LOG_ROWS: 5000,

  log: function (severity, module, fn, message, details, campaignId, contactId) {
    try {
      var sh = Db.ss().getSheetByName(APP.SHEETS.ERROR_LOG);
      var row = [new Date(), severity, module || '', fn || '', Util.truncate(message, 500),
        Util.truncate(details || '', 2000), campaignId || '', contactId || ''];
      if (sh) sh.appendRow(row);
    } catch (e) {
      // Never let logging break the caller.
    }
    try { console.log('[' + severity + '] ' + module + '.' + fn + ': ' + message + (details ? ' | ' + details : '')); } catch (e2) {}
  },

  info: function (module, fn, message, details, campaignId, contactId) {
    this.log('INFO', module, fn, message, details, campaignId, contactId);
  },

  warn: function (module, fn, message, details, campaignId, contactId) {
    this.log('WARNING', module, fn, message, details, campaignId, contactId);
  },

  error: function (module, fn, err, campaignId, contactId) {
    var msg = err && err.message ? err.message : String(err);
    var stack = err && err.stack ? String(err.stack) : '';
    this.log('ERROR', module, fn, msg, stack, campaignId, contactId);
  },

  /** Critical errors are logged AND emailed to the owner (max once per hour per type). */
  critical: function (module, fn, err) {
    this.error(module, fn, err);
    try {
      var props = PropertiesService.getScriptProperties();
      var key = 'LAST_CRITICAL_' + module + '_' + fn;
      var last = Number(props.getProperty(key) || 0);
      if (Date.now() - last < 3600 * 1000) return;
      props.setProperty(key, String(Date.now()));
      var to = Config.load().notifyEmail;
      if (to && MailApp.getRemainingDailyQuota() > 0) {
        MailApp.sendEmail(to, '[' + APP.NAME + '] Critical error in ' + module + '.' + fn,
          'The email automation system reported an error:\n\n' + (err && err.message ? err.message : err) +
          '\n\nSpreadsheet: ' + Db.ss().getUrl() + '\n\nSee the "Error Log" sheet for details.');
      }
    } catch (e) { /* ignore */ }
  },

  /**
   * Classifies a Gmail send error.
   * temporary = worth retrying later; quotaExhausted = stop the whole run.
   */
  classifySendError: function (err) {
    var msg = String(err && err.message ? err.message : err);
    var quota = /too many times|daily limit|quota|limit exceeded|rate ?limit/i.test(msg);
    var permanent = !quota && /invalid (email|argument|recipient|to)|recipient address rejected|no recipient|malformed|limit on recipients/i.test(msg);
    // Unknown errors are treated as temporary: they are retried, and every
    // retry first checks the Gmail "Sent" folder so nothing is sent twice.
    return { message: msg, temporary: !permanent, permanent: permanent, quotaExhausted: quota };
  },

  /** Runs a UI action; shows a friendly alert on error. */
  safeUi: function (label, fn) {
    try {
      return fn();
    } catch (e) {
      this.error('UI', label, e);
      try { SpreadsheetApp.getUi().alert(label + ' failed', String(e && e.message ? e.message : e), SpreadsheetApp.getUi().ButtonSet.OK); } catch (e2) {}
      return null;
    }
  },

  /** Keeps log sheets from growing without limit. */
  trimLogs: function () {
    [APP.SHEETS.ERROR_LOG, APP.SHEETS.SEND_LOG].forEach(function (name) {
      var sh = Db.ss().getSheetByName(name);
      if (!sh) return;
      var extra = sh.getLastRow() - 1 - ErrorHandler.MAX_LOG_ROWS;
      if (extra > 0) sh.deleteRows(2, extra);
    });
  }
};
