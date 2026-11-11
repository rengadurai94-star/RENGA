/**
 * ContactManager.gs
 * ----------------------------------------------------------------------------
 * Contact database: add, validate, import (CSV / Excel / Import sheet),
 * delete, eligibility checks and per-contact status updates.
 */

var ContactManager = {
  EMAIL_RE: /^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/,

  normalizeEmail: function (e) {
    return String(e === null || e === undefined ? '' : e)
      .replace(/^mailto:/i, '').replace(/[\s​-‍﻿<>"']/g, '').toLowerCase();
  },

  isValidEmail: function (e) {
    return this.EMAIL_RE.test(e) && e.length <= 254 && e.indexOf('..') < 0;
  },

  read: function () { return Db.read(APP.SHEETS.CONTACTS); },

  /** Map email → contact row (first occurrence). */
  indexByEmail: function (table) {
    var m = {};
    table.rows.forEach(function (r) {
      var e = ContactManager.normalizeEmail(r['Email Address']);
      if (e && !m[e]) m[e] = r;
    });
    return m;
  },

  indexById: function (table) {
    var m = {};
    table.rows.forEach(function (r) { if (r['Contact ID']) m[String(r['Contact ID'])] = r; });
    return m;
  },

  /**
   * Imports rows (array of objects using any reasonable header names, or a
   * 2-D array whose first row is a header). Skips invalid, duplicate and
   * suppressed addresses. Returns a summary.
   */
  importRows: function (input, source) {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw new Error('The system is busy (a send run is in progress). Please try again in a minute.');
    try {
      var objects = this.toObjects_(input);
      var settings = Config.load();
      var table = this.read();
      var byEmail = this.indexByEmail(table);
      var suppression = UnsubscribeManager.loadSuppression();
      var summary = { added: 0, duplicates: 0, invalid: 0, suppressed: 0, total: objects.length, invalidSamples: [] };
      var now = new Date();
      var nextNum = this.maxIdNumber_(table) + 1;
      var toAdd = [];

      objects.forEach(function (o) {
        var email = ContactManager.normalizeEmail(o.email);
        if (!email && !o.company && !o.person) return; // blank line
        if (!ContactManager.isValidEmail(email)) {
          summary.invalid++;
          if (summary.invalidSamples.length < 10) summary.invalidSamples.push(String(o.email || '(blank)'));
          return;
        }
        if (byEmail[email]) { summary.duplicates++; return; }
        var sup = UnsubscribeManager.isSuppressed(email, suppression);
        var obj = {
          'Contact ID': 'C' + ContactManager.pad_(nextNum++, 4),
          'Company Name': o.company || '',
          'Contact Person': o.person || '',
          'Email Address': email,
          'Building Name': o.building || '',
          'Campaign Status': 'Not Contacted',
          'Email Sent Count': 0,
          'Last Email Sent Date': '',
          'Next Scheduled Date': '',
          'Delivery Status': '',
          'Unsubscribe Status': sup ? APP.UNSUB.UNSUBSCRIBED : APP.UNSUB.SUBSCRIBED,
          'Error Log': '',
          'Permission': ContactManager.normalizePermission_(o.permission) || settings.defaultPermission,
          'Tags': o.tags || '',
          'Select': false,
          'Date Added': now,
          'Source': source || 'Import',
          'Notes': o.notes || ''
        };
        if (sup) summary.suppressed++;
        toAdd.push(obj);
        byEmail[email] = obj;
        summary.added++;
      });

      Db.appendObjects(APP.SHEETS.CONTACTS, toAdd);
      SpreadsheetApp.flush();
      ErrorHandler.info('ContactManager', 'importRows',
        'Imported ' + summary.added + ' contacts from ' + (source || 'import'),
        JSON.stringify(summary));
      return summary;
    } finally {
      lock.releaseLock();
    }
  },

  /** Imports everything pasted into the "Import" sheet, then clears it. */
  importFromImportSheet: function () {
    var sh = Db.sheet(APP.SHEETS.IMPORT);
    var last = sh.getLastRow();
    if (last < 2) return { added: 0, duplicates: 0, invalid: 0, suppressed: 0, total: 0, invalidSamples: [] };
    var data = sh.getRange(1, 1, last, sh.getLastColumn()).getValues();
    var summary = this.importRows(data, 'Import sheet ' + Util.fmtDate(new Date()));
    sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
    return summary;
  },

  /** Converts a 2-D array (header row first) or list of objects to canonical objects. */
  toObjects_: function (input) {
    if (!input || !input.length) return [];
    var rows = input;
    if (!Array.isArray(rows[0])) {
      // array of objects → 2-D
      var keys = Object.keys(rows[0]);
      rows = [keys].concat(input.map(function (o) { return keys.map(function (k) { return o[k]; }); }));
    }
    // Find header row: first row containing something that looks like an email header.
    var headerIdx = -1, map = null;
    for (var i = 0; i < Math.min(rows.length, 10); i++) {
      var m = this.mapHeaders_(rows[i]);
      if (m.email >= 0) { headerIdx = i; map = m; break; }
    }
    if (headerIdx < 0) {
      // No header: find the column that contains emails.
      var emailCol = 0;
      for (var c = 0; c < (rows[0] || []).length; c++) {
        if (String(rows[0][c]).indexOf('@') > 0) { emailCol = c; break; }
      }
      map = { email: emailCol, company: -1, person: -1, building: -1, tags: -1, permission: -1, notes: -1 };
      headerIdx = -1;
    }
    var out = [];
    for (var r = headerIdx + 1; r < rows.length; r++) {
      var row = rows[r] || [];
      var get = function (idx) { return idx >= 0 && row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : ''; };
      out.push({
        email: get(map.email), company: get(map.company), person: get(map.person),
        building: get(map.building), tags: get(map.tags), permission: get(map.permission), notes: get(map.notes)
      });
    }
    return out;
  },

  mapHeaders_: function (row) {
    var m = { email: -1, company: -1, person: -1, building: -1, tags: -1, permission: -1, notes: -1 };
    (row || []).forEach(function (h, i) {
      var s = String(h || '').toLowerCase().replace(/[^a-z]/g, '');
      if (!s) return;
      if (m.email < 0 && /^(email|emailaddress|emailid|mail|e?mailaddress)$/.test(s)) m.email = i;
      else if (m.company < 0 && /(company|organisation|organization|firm|managementcompany)/.test(s)) m.company = i;
      else if (m.person < 0 && /(contactperson|contactname|^name$|fullname|person|manager|owner)/.test(s)) m.person = i;
      else if (m.building < 0 && /(building|property|tower)/.test(s)) m.building = i;
      else if (m.tags < 0 && /(tag|group|segment|category)/.test(s)) m.tags = i;
      else if (m.permission < 0 && /(permission|consent)/.test(s)) m.permission = i;
      else if (m.notes < 0 && /(note|comment|remark)/.test(s)) m.notes = i;
    });
    return m;
  },

  normalizePermission_: function (p) {
    var s = String(p || '').trim().toLowerCase();
    if (!s) return '';
    if (/\b(do ?not|dnc|no|none|refused|withdrawn|unsubscribed)\b/.test(s)) return APP.PERMISSION.DO_NOT_CONTACT;
    if (/opt/.test(s)) return APP.PERMISSION.OPTED_IN;
    if (/business|b2b|legitimate|\byes\b/.test(s)) return APP.PERMISSION.BUSINESS;
    return String(p).trim();
  },

  maxIdNumber_: function (table) {
    var max = 0;
    table.rows.forEach(function (r) {
      var m = String(r['Contact ID'] || '').match(/^C(\d+)$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return max;
  },

  pad_: function (n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; },

  /** Adds a single contact (used by the Control Panel). */
  addContact: function (c) {
    var s = this.importRows([{ email: c.email, company: c.company, person: c.person, building: c.building, tags: c.tags, permission: c.permission, notes: c.notes }], 'Manual');
    if (s.invalid) throw new Error('Invalid email address: ' + c.email);
    if (s.duplicates) throw new Error('This email address already exists in Contacts.');
    return s;
  },

  /**
   * Validates the Contacts sheet: assigns missing IDs, normalises emails,
   * flags invalid / duplicate rows in the Error Log column. Safe to run anytime.
   */
  validateAll: function () {
    var table = this.read();
    var next = this.maxIdNumber_(table) + 1;
    var seenEmail = {}, seenId = {};
    var result = { fixedIds: 0, invalid: 0, duplicates: 0, total: table.rows.length };
    table.rows.forEach(function (r) {
      var fields = {};
      var id = String(r['Contact ID'] || '').trim();
      if (!id || seenId[id]) {
        id = 'C' + ContactManager.pad_(next++, 4);
        fields['Contact ID'] = id;
        result.fixedIds++;
      }
      seenId[id] = true;
      var email = ContactManager.normalizeEmail(r['Email Address']);
      if (email !== r['Email Address']) fields['Email Address'] = email;
      var problem = '';
      if (!ContactManager.isValidEmail(email)) { problem = 'Invalid email address'; result.invalid++; }
      else if (seenEmail[email]) { problem = 'Duplicate of ' + seenEmail[email] + ' (will not be emailed twice)'; result.duplicates++; }
      else seenEmail[email] = id;
      var current = String(r['Error Log'] || '');
      var isValidationNote = /^(Invalid email address|Duplicate of )/.test(current);
      if (problem && current !== problem) fields['Error Log'] = problem;
      else if (!problem && isValidationNote) fields['Error Log'] = '';
      if (!r['Permission']) fields['Permission'] = Config.load().defaultPermission;
      if (!r['Unsubscribe Status']) fields['Unsubscribe Status'] = APP.UNSUB.SUBSCRIBED;
      if (r['Email Sent Count'] === '' || r['Email Sent Count'] === null) fields['Email Sent Count'] = 0;
      if (!r['Date Added']) fields['Date Added'] = new Date();
      if (Object.keys(fields).length) Db.update(table, r, fields);
    });
    return result;
  },

  /**
   * Returns {ok:true} or {ok:false, reason, permanent}. Called right before
   * every send so last-minute changes (unsubscribe, deletion, permission) win.
   */
  checkEligibility: function (contact, expectedEmail, settings, suppression) {
    if (!contact) return { ok: false, permanent: true, reason: 'Contact deleted' };
    var email = this.normalizeEmail(contact['Email Address']);
    if (expectedEmail && email !== this.normalizeEmail(expectedEmail)) {
      return { ok: false, permanent: true, reason: 'Email address changed after the campaign was created' };
    }
    if (!this.isValidEmail(email)) return { ok: false, permanent: true, reason: 'Invalid email address' };
    if (String(contact['Unsubscribe Status'] || '').toLowerCase().indexOf('unsub') === 0) {
      return { ok: false, permanent: true, reason: 'Unsubscribed' };
    }
    if (UnsubscribeManager.isSuppressed(email, suppression)) return { ok: false, permanent: true, reason: 'On suppression list' };
    if (/bounced/i.test(String(contact['Delivery Status'] || ''))) return { ok: false, permanent: true, reason: 'Previously bounced' };
    var perm = String(contact['Permission'] || settings.defaultPermission).trim().toLowerCase();
    if (settings.allowedPermissions.indexOf(perm) < 0) {
      return { ok: false, permanent: true, reason: 'No permission (Permission = "' + (contact['Permission'] || '') + '")' };
    }
    return { ok: true };
  },

  /** Updates the contact row right after a successful send. */
  markSent: function (table, contact, campaignId, when) {
    var count = parseInt(contact['Email Sent Count'], 10) || 0;
    Db.update(table, contact, {
      'Campaign Status': 'Emailed (' + campaignId + ')',
      'Email Sent Count': count + 1,
      'Last Email Sent Date': when,
      'Next Scheduled Date': '',
      'Delivery Status': 'Sent',
      'Error Log': ''
    });
  },

  markFailed: function (table, contact, campaignId, message, permanent) {
    if (!contact) return;
    Db.update(table, contact, {
      'Delivery Status': permanent ? 'Failed' : 'Retry pending',
      'Error Log': Util.truncate(Util.fmtDateTime(new Date()) + ' [' + campaignId + '] ' + message, 300)
    });
  },

  /** Deletes contacts whose "Select" box is ticked; cancels their pending queue items. */
  deleteSelected: function () {
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) throw new Error('The system is busy. Please try again in a minute.');
    try {
      var table = this.read();
      var victims = table.rows.filter(function (r) { return r['Select'] === true; });
      if (!victims.length) return 0;
      var ids = {};
      victims.forEach(function (r) { ids[String(r['Contact ID'])] = true; });
      CampaignManager.cancelQueueForContacts(ids, 'Contact deleted');
      victims.sort(function (a, b) { return b._row - a._row; }).forEach(function (r) {
        table.sheet.deleteRow(r._row);
      });
      ErrorHandler.info('ContactManager', 'deleteSelected', 'Deleted ' + victims.length + ' contacts', Object.keys(ids).join(', '));
      return victims.length;
    } finally {
      lock.releaseLock();
    }
  },

  clearSelection: function () {
    var table = this.read();
    var c = table.col['Select'];
    if (!c || !table.rows.length) return;
    var last = table.sheet.getLastRow();
    var vals = [];
    for (var i = 2; i <= last; i++) vals.push([false]);
    table.sheet.getRange(2, c, last - 1, 1).setValues(vals);
  },

  /** Contacts matching a campaign target expression. */
  selectTargets: function (table, target) {
    var t = String(target || 'ALL').trim();
    var up = t.toUpperCase();
    if (up === 'ALL' || up === '') return table.rows.slice();
    if (up === 'SELECTED') return table.rows.filter(function (r) { return r['Select'] === true; });
    if (up.indexOf('TAG:') === 0) {
      var tag = t.slice(4).trim().toLowerCase();
      return table.rows.filter(function (r) {
        return String(r['Tags'] || '').toLowerCase().split(/[,;]/).map(function (x) { return x.trim(); }).indexOf(tag) >= 0;
      });
    }
    if (up.indexOf('IDS:') === 0) {
      var want = {};
      t.slice(4).split(/[,;\s]+/).forEach(function (x) { if (x) want[x.trim().toUpperCase()] = true; });
      return table.rows.filter(function (r) { return want[String(r['Contact ID']).toUpperCase()]; });
    }
    throw new Error('Unknown target "' + target + '". Use ALL, SELECTED, TAG:<tag> or IDS:C0001,C0002');
  },

  stats: function () {
    var t = this.read();
    var s = { total: 0, unsubscribed: 0, noPermission: 0, bounced: 0 };
    var settings = Config.load();
    t.rows.forEach(function (r) {
      if (!r['Email Address']) return;
      s.total++;
      if (String(r['Unsubscribe Status']).toLowerCase().indexOf('unsub') === 0) s.unsubscribed++;
      var perm = String(r['Permission'] || settings.defaultPermission).trim().toLowerCase();
      if (settings.allowedPermissions.indexOf(perm) < 0) s.noPermission++;
      if (/bounced/i.test(String(r['Delivery Status']))) s.bounced++;
    });
    return s;
  }
};
