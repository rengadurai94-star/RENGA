/**
 * Configuration.gs
 * ----------------------------------------------------------------------------
 * Central configuration: sheet names, column headers, status values, default
 * settings and the Settings-sheet reader. Nothing in here sends email.
 *
 * Every business rule that the owner may want to change (daily limit, sending
 * time, sending days, ...) lives in the "Settings" sheet or on the campaign
 * row — never hard-coded in the sending logic.
 */

var APP = {
  NAME: 'Email Automation',
  VERSION: '1.0.0',
  TZ: 'Asia/Dubai',
  LABEL_PROCESSED: 'Email Automation/Processed',

  SHEETS: {
    DASHBOARD: 'Dashboard',
    CONTACTS: 'Contacts',
    CAMPAIGNS: 'Campaigns',
    CONTENT: 'Email Content',
    QUEUE: 'Campaign Queue',
    SETTINGS: 'Settings',
    SEND_LOG: 'Send Log',
    ERROR_LOG: 'Error Log',
    SUPPRESSION: 'Suppression List',
    IMPORT: 'Import',
    TESTS: 'Test Results'
  },

  HEADERS: {
    // The first 12 columns are exactly the fields requested in the brief.
    CONTACTS: [
      'Contact ID', 'Company Name', 'Contact Person', 'Email Address', 'Building Name',
      'Campaign Status', 'Email Sent Count', 'Last Email Sent Date', 'Next Scheduled Date',
      'Delivery Status', 'Unsubscribe Status', 'Error Log',
      'Permission', 'Tags', 'Select', 'Date Added', 'Source', 'Notes'
    ],
    CAMPAIGNS: [
      'Campaign ID', 'Campaign Name', 'Status', 'Content ID', 'Target',
      'Start Date', 'Send Time', 'End Date', 'Daily Limit', 'Sending Days',
      'Total Recipients', 'Sent', 'Failed', 'Pending', 'Skipped', 'Progress %',
      'Sent Today', 'Est. Finish Date', 'Created At', 'Started At', 'Completed At',
      'Last Run', 'Notes'
    ],
    CONTENT: [
      'Content ID', 'Content Name', 'Email Subject', 'Plain Text Body', 'HTML Email Content',
      'Sender Name', 'Reply-To Email', 'Email Signature', 'Format', 'Status',
      'Last Updated', 'Notes'
    ],
    QUEUE: [
      'Queue Key', 'Campaign ID', 'Contact ID', 'Email Address', 'Status', 'Attempts',
      'Queued At', 'Last Attempt At', 'Next Retry At', 'Sent At', 'Gmail Message ID',
      'Error', 'Queue Order'
    ],
    SETTINGS: ['Setting', 'Value', 'Description'],
    SEND_LOG: ['Timestamp', 'Campaign ID', 'Contact ID', 'Email Address', 'Result', 'Detail', 'Queue Key', 'Run ID'],
    ERROR_LOG: ['Timestamp', 'Severity', 'Module', 'Function', 'Message', 'Details', 'Campaign ID', 'Contact ID'],
    SUPPRESSION: ['Email or Domain', 'Reason', 'Added At', 'Source'],
    IMPORT: ['Email Address', 'Company Name', 'Contact Person', 'Building Name', 'Tags', 'Permission', 'Notes'],
    TESTS: ['Timestamp', 'Test', 'Result', 'Detail']
  },

  CAMPAIGN_STATUS: {
    DRAFT: 'Draft',
    SCHEDULED: 'Scheduled',
    ACTIVE: 'Active',
    PAUSED: 'Paused',
    STOPPED: 'Stopped',
    COMPLETED: 'Completed'
  },

  QUEUE_STATUS: {
    PENDING: 'Pending',
    SENDING: 'Sending',   // written BEFORE the Gmail call; used for crash recovery
    SENT: 'Sent',
    RETRY: 'Retry',
    FAILED: 'Failed',
    SKIPPED: 'Skipped',
    BOUNCED: 'Bounced',
    CANCELLED: 'Cancelled'
  },

  PERMISSION: {
    BUSINESS: 'Business Contact',
    OPTED_IN: 'Opted In',
    DO_NOT_CONTACT: 'Do Not Contact'
  },

  UNSUB: {
    SUBSCRIBED: 'Subscribed',
    UNSUBSCRIBED: 'Unsubscribed'
  },

  CONTENT_STATUS: { DRAFT: 'Draft', READY: 'Ready' },
  FORMAT: { HTML: 'HTML', PLAIN: 'Plain Text' }
};

/**
 * Default settings. Written to the Settings sheet on first setup; afterwards
 * the Settings sheet is the source of truth and can be edited by the owner.
 * [key, defaultValue, description]
 */
var DEFAULT_SETTINGS = [
  ['DEFAULT_DAILY_LIMIT', 8, 'Default emails per day for NEW campaigns (each campaign also has its own Daily Limit column).'],
  ['GLOBAL_DAILY_CAP', 40, 'Maximum emails per day across ALL campaigns combined (safety cap).'],
  ['QUOTA_RESERVE', 10, 'Gmail daily quota kept free for your normal / test emails. The system never uses it.'],
  ['DEFAULT_SEND_TIME', '09:00', 'Default sending start time for new campaigns (24h, Dubai time).'],
  ['SENDING_WINDOW_END', '17:00', 'No campaign emails are sent after this time (24h, Dubai time).'],
  ['DEFAULT_SENDING_DAYS', 'Mon,Tue,Wed,Thu,Fri', 'Default sending days for new campaigns.'],
  ['MAX_EMAILS_PER_RUN', 2, 'Emails sent per scheduler run (runs every SCHEDULER_INTERVAL_MINUTES). Spreads sending out naturally.'],
  ['SECONDS_BETWEEN_EMAILS', 20, 'Pause between two emails inside the same run.'],
  ['SCHEDULER_INTERVAL_MINUTES', 10, 'How often the cloud scheduler wakes up (1, 5, 10, 15 or 30). Re-install triggers after changing.'],
  ['MAX_ATTEMPTS', 3, 'Maximum send attempts for temporary failures before marking Failed.'],
  ['RETRY_DELAY_MINUTES', 60, 'Wait time before retrying a temporary failure (doubles each attempt).'],
  ['MIN_DAYS_BETWEEN_EMAILS', 7, 'Never email the same contact again within this many days (across campaigns).'],
  ['ALLOWED_PERMISSIONS', 'Business Contact, Opted In', 'Only contacts whose Permission is in this list are emailed.'],
  ['DEFAULT_PERMISSION_ON_IMPORT', 'Business Contact', 'Permission value given to imported contacts when the file has none.'],
  ['ADD_UNSUBSCRIBE_FOOTER', 'Yes', 'Append an unsubscribe footer BELOW your content (recommended for compliance). Your content is never changed.'],
  ['UNSUBSCRIBE_FOOTER_TEXT', 'If you would prefer not to receive further emails from us, {{UNSUBSCRIBE_LINK}} or simply reply with "Unsubscribe".', 'Footer text. {{UNSUBSCRIBE_LINK}} becomes the unsubscribe link.'],
  ['UNSUBSCRIBE_LINK_TEXT', 'click here to unsubscribe', 'Text of the unsubscribe link.'],
  ['UNSUBSCRIBE_WEB_APP_URL', '', 'Web-app URL for one-click unsubscribe (see setup guide). If empty, a "reply to unsubscribe" email link is used.'],
  ['PROCESS_INBOX', 'Yes', 'Automatically detect bounces and "unsubscribe" replies in this Gmail inbox.'],
  ['TEST_MODE', 'No', 'Yes = every campaign email is redirected to TEST_RECIPIENT instead of the real contact.'],
  ['TEST_RECIPIENT', '', 'Address for test emails (empty = the Google account running the system).'],
  ['NOTIFY_EMAIL', '', 'Where to send campaign-completed and critical-error notifications (empty = the Google account running the system).'],
  ['TIME_ZONE', 'Asia/Dubai', 'Read-only. All dates and times use Dubai time.']
];

var Config = (function () {
  var cache = null;

  function defaultsMap_() {
    var m = {};
    DEFAULT_SETTINGS.forEach(function (r) { m[r[0]] = r[1]; });
    return m;
  }

  /** Loads settings from the Settings sheet, falling back to defaults. */
  function load(forceReload) {
    if (cache && !forceReload) return cache;
    var values = defaultsMap_();
    var sh = Db.ss().getSheetByName(APP.SHEETS.SETTINGS);
    if (sh && sh.getLastRow() > 1) {
      var data = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
      data.forEach(function (r) {
        var k = String(r[0] || '').trim();
        if (k && Object.prototype.hasOwnProperty.call(values, k) && r[1] !== '' && r[1] !== null) {
          values[k] = r[1];
        } else if (k && Object.prototype.hasOwnProperty.call(values, k) && typeof values[k] === 'string') {
          values[k] = String(r[1] === null ? '' : r[1]);
        }
      });
    }
    cache = normalize_(values);
    return cache;
  }

  function normalize_(v) {
    var s = {};
    s.defaultDailyLimit = posInt_(v.DEFAULT_DAILY_LIMIT, 8);
    s.globalDailyCap = posInt_(v.GLOBAL_DAILY_CAP, 40);
    s.quotaReserve = nonNegInt_(v.QUOTA_RESERVE, 10);
    s.defaultSendTime = Util.parseTime(v.DEFAULT_SEND_TIME) || '09:00';
    s.windowEnd = Util.parseTime(v.SENDING_WINDOW_END) || '17:00';
    s.defaultSendingDays = Util.parseDays(v.DEFAULT_SENDING_DAYS).join(',') || 'Mon,Tue,Wed,Thu,Fri';
    s.maxPerRun = Math.min(posInt_(v.MAX_EMAILS_PER_RUN, 2), 20);
    s.secondsBetween = Math.min(nonNegInt_(v.SECONDS_BETWEEN_EMAILS, 20), 60);
    var iv = posInt_(v.SCHEDULER_INTERVAL_MINUTES, 10);
    s.intervalMinutes = [1, 5, 10, 15, 30].indexOf(iv) >= 0 ? iv : 10;
    s.maxAttempts = Math.min(posInt_(v.MAX_ATTEMPTS, 3), 10);
    s.retryDelayMinutes = posInt_(v.RETRY_DELAY_MINUTES, 60);
    s.minDaysBetween = nonNegInt_(v.MIN_DAYS_BETWEEN_EMAILS, 7);
    s.allowedPermissions = String(v.ALLOWED_PERMISSIONS || '').split(',')
      .map(function (x) { return x.trim().toLowerCase(); }).filter(String);
    s.defaultPermission = String(v.DEFAULT_PERMISSION_ON_IMPORT || APP.PERMISSION.BUSINESS).trim();
    s.addUnsubFooter = Util.yes(v.ADD_UNSUBSCRIBE_FOOTER);
    s.unsubFooterText = String(v.UNSUBSCRIBE_FOOTER_TEXT || '');
    s.unsubLinkText = String(v.UNSUBSCRIBE_LINK_TEXT || 'unsubscribe');
    s.unsubWebAppUrl = String(v.UNSUBSCRIBE_WEB_APP_URL || '').trim();
    s.processInbox = Util.yes(v.PROCESS_INBOX);
    s.testMode = Util.yes(v.TEST_MODE);
    s.testRecipient = String(v.TEST_RECIPIENT || '').trim() || Util.ownerEmail();
    s.notifyEmail = String(v.NOTIFY_EMAIL || '').trim() || Util.ownerEmail();
    return s;
  }

  function posInt_(x, d) { var n = parseInt(x, 10); return n > 0 ? n : d; }
  function nonNegInt_(x, d) { var n = parseInt(x, 10); return n >= 0 ? n : d; }

  /** Writes one setting to the sheet (used by the Control Panel). */
  function set(key, value) {
    var sh = Db.sheet(APP.SHEETS.SETTINGS);
    var last = sh.getLastRow();
    var keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
    for (var i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim() === key) {
        sh.getRange(i + 2, 2).setValue(value);
        cache = null;
        return;
      }
    }
    var desc = '';
    DEFAULT_SETTINGS.forEach(function (r) { if (r[0] === key) desc = r[2]; });
    sh.appendRow([key, value, desc]);
    cache = null;
  }

  /** Raw key/value pairs for the UI. */
  function raw() {
    var out = defaultsMap_();
    var sh = Db.ss().getSheetByName(APP.SHEETS.SETTINGS);
    if (sh && sh.getLastRow() > 1) {
      sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) {
        var k = String(r[0] || '').trim();
        if (k) out[k] = r[1] instanceof Date ? Util.parseTime(r[1]) : r[1];
      });
    }
    return out;
  }

  function invalidate() { cache = null; }

  return { load: load, set: set, raw: raw, invalidate: invalidate };
})();

/** Small generic helpers shared by all modules. */
var Util = {
  DAY_NAMES: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],

  yes: function (v) {
    if (v === true) return true;
    var s = String(v || '').trim().toLowerCase();
    return s === 'yes' || s === 'y' || s === 'true' || s === 'on' || s === '1';
  },

  ownerEmail: function () {
    try { return Session.getEffectiveUser().getEmail() || ''; } catch (e) { return ''; }
  },

  /** yyyy-MM-dd in Dubai time. */
  dayKey: function (d) {
    return Utilities.formatDate(d || new Date(), APP.TZ, 'yyyy-MM-dd');
  },

  /** HH:mm in Dubai time. */
  hhmm: function (d) {
    return Utilities.formatDate(d || new Date(), APP.TZ, 'HH:mm');
  },

  /** 3-letter weekday name in Dubai time. */
  weekday: function (d) {
    return Utilities.formatDate(d || new Date(), APP.TZ, 'EEE');
  },

  fmtDateTime: function (d) {
    return d instanceof Date ? Utilities.formatDate(d, APP.TZ, 'dd MMM yyyy HH:mm') : '';
  },

  fmtDate: function (d) {
    return d instanceof Date ? Utilities.formatDate(d, APP.TZ, 'dd MMM yyyy') : '';
  },

  /** Accepts "9:00", "09:00", "9", 0.375 or a Sheets time Date → "HH:mm" or ''. */
  parseTime: function (v) {
    if (v === null || v === undefined || v === '') return '';
    if (v instanceof Date) return Utilities.formatDate(v, APP.TZ, 'HH:mm');
    if (typeof v === 'number' && v >= 0 && v < 1) {
      var mins = Math.round(v * 24 * 60);
      return Util.pad2(Math.floor(mins / 60)) + ':' + Util.pad2(mins % 60);
    }
    var m = String(v).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (!m) return '';
    var h = parseInt(m[1], 10), mi = parseInt(m[2] || '0', 10);
    if (m[3]) {
      var pm = m[3].toLowerCase() === 'pm';
      if (h === 12) h = pm ? 12 : 0; else if (pm) h += 12;
    }
    if (h > 23 || mi > 59) return '';
    return Util.pad2(h) + ':' + Util.pad2(mi);
  },

  /** "Mon,Tue" / "Monday-Friday" / "Mon-Fri" → ['Mon','Tue',...] */
  parseDays: function (v) {
    var s = String(v || '').trim();
    if (!s) return [];
    if (/^(daily|every ?day|all)$/i.test(s)) return Util.DAY_NAMES.slice();
    var out = [];
    s.split(/[,;\s]+/).forEach(function (part) {
      if (!part) return;
      var range = part.split('-');
      var a = Util.dayIndex_(range[0]);
      if (a < 0) return;
      if (range.length === 2) {
        var b = Util.dayIndex_(range[1]);
        if (b < 0) return;
        for (var i = a; ; i = (i + 1) % 7) {
          if (out.indexOf(Util.DAY_NAMES[i]) < 0) out.push(Util.DAY_NAMES[i]);
          if (i === b) break;
        }
      } else if (out.indexOf(Util.DAY_NAMES[a]) < 0) {
        out.push(Util.DAY_NAMES[a]);
      }
    });
    return out;
  },

  dayIndex_: function (name) {
    var n = String(name || '').trim().slice(0, 3).toLowerCase();
    for (var i = 0; i < 7; i++) if (Util.DAY_NAMES[i].toLowerCase() === n) return i;
    return -1;
  },

  pad2: function (n) { return (n < 10 ? '0' : '') + n; },

  /** Parses a date cell / string ("2026-11-15", "15/11/2026") → yyyy-MM-dd or ''. */
  parseDateKey: function (v) {
    if (v === null || v === undefined || v === '') return '';
    if (v instanceof Date) return Util.dayKey(v);
    var s = String(v).trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) return m[1] + '-' + Util.pad2(+m[2]) + '-' + Util.pad2(+m[3]);
    if ((m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/))) return m[3] + '-' + Util.pad2(+m[2]) + '-' + Util.pad2(+m[1]);
    return '';
  },

  /** Adds days to a yyyy-MM-dd key and returns a new key. */
  addDaysKey: function (key, n) {
    var p = key.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n, 12));
    return d.getUTCFullYear() + '-' + Util.pad2(d.getUTCMonth() + 1) + '-' + Util.pad2(d.getUTCDate());
  },

  /** Weekday of a yyyy-MM-dd key. */
  weekdayOfKey: function (key) {
    var p = key.split('-');
    return Util.DAY_NAMES[new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).getUTCDay()];
  },

  /** yyyy-MM-dd (Dubai) → Date at noon Dubai time (for writing to sheets). */
  keyToDate: function (key) {
    var p = key.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 8)); // 12:00 Dubai = 08:00 UTC
  },

  escapeHtml: function (s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  truncate: function (s, n) {
    s = String(s === null || s === undefined ? '' : s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  },

  newRunId: function () {
    return Utilities.formatDate(new Date(), APP.TZ, 'yyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 9000 + 1000);
  }
};
