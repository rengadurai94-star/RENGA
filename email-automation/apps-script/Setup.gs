/**
 * Setup.gs
 * ----------------------------------------------------------------------------
 * One-click, idempotent setup / repair: creates all sheets, headers,
 * dropdowns, formats, default settings, the unsubscribe secret, your first
 * email content (as a Draft) and the cloud triggers. Safe to run again at any
 * time — it never deletes your data.
 */

function setupSystem() {
  var ui = null;
  try { ui = SpreadsheetApp.getUi(); } catch (e) { /* run from editor */ }
  var res = Setup.run();
  if (ui) {
    ui.alert('Setup complete ✅',
      'Sheets, settings and cloud triggers are ready.\n\n' +
      (res.seeded ? 'Your email content was added as Draft "' + res.seeded + '". Review it in the Content Editor and save it as Ready.\n\n' : '') +
      'Next steps:\n1. Email Automation → Import Contacts\n2. Email Automation → Content Editor (review, preview, test)\n3. Email Automation → Open Control Panel → create & start a campaign',
      ui.ButtonSet.OK);
  }
  return res;
}

var Setup = {
  run: function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Open the Google Sheet and run Setup from the "Email Automation" menu.');
    Db._ss = ss;
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SPREADSHEET_ID', ss.getId());
    if (ss.getSpreadsheetTimeZone() !== APP.TZ) ss.setSpreadsheetTimeZone(APP.TZ);

    var S = APP.SHEETS, H = APP.HEADERS;
    var created = {};
    [
      [S.DASHBOARD, null], [S.CONTACTS, H.CONTACTS], [S.CAMPAIGNS, H.CAMPAIGNS], [S.CONTENT, H.CONTENT],
      [S.QUEUE, H.QUEUE], [S.IMPORT, H.IMPORT], [S.SUPPRESSION, H.SUPPRESSION], [S.SEND_LOG, H.SEND_LOG],
      [S.ERROR_LOG, H.ERROR_LOG], [S.SETTINGS, H.SETTINGS], [S.TESTS, H.TESTS]
    ].forEach(function (d, i) {
      created[d[0]] = Setup.ensureSheet_(ss, d[0], d[1], i);
    });

    this.formatContacts_(ss.getSheetByName(S.CONTACTS));
    this.formatCampaigns_(ss.getSheetByName(S.CAMPAIGNS));
    this.formatContent_(ss.getSheetByName(S.CONTENT));
    this.formatQueue_(ss.getSheetByName(S.QUEUE));
    this.formatSimple_(ss.getSheetByName(S.IMPORT), [260, 220, 180, 200, 140, 150, 220]);
    this.formatSimple_(ss.getSheetByName(S.SUPPRESSION), [260, 220, 150, 160]);
    this.formatSimple_(ss.getSheetByName(S.SEND_LOG), [150, 90, 80, 240, 110, 360, 160, 150]);
    this.formatSimple_(ss.getSheetByName(S.ERROR_LOG), [150, 80, 150, 150, 380, 300, 90, 90]);
    this.formatSimple_(ss.getSheetByName(S.TESTS), [150, 300, 80, 500]);
    this.ensureSettings_(ss.getSheetByName(S.SETTINGS));
    this.protectSystemSheets_(ss);

    Config.invalidate();
    UnsubscribeManager.secret_();
    var seeded = this.seedContent_();

    if (created[S.DASHBOARD] || !ss.getSheetByName(S.DASHBOARD).getRange('B2').getValue()) DashboardManager.buildLayout();
    var def = ss.getSheetByName('Sheet1');
    if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);

    EmailScheduler.installTriggers();
    DashboardManager.refresh();
    ss.setActiveSheet(ss.getSheetByName(S.DASHBOARD));
    ErrorHandler.info('Setup', 'run', 'Setup / repair completed (v' + APP.VERSION + ')');
    return { ok: true, seeded: seeded };
  },

  /** Creates the sheet if missing and appends any missing header columns. */
  ensureSheet_: function (ss, name, headers, index) {
    var sh = ss.getSheetByName(name);
    var isNew = false;
    if (!sh) { sh = ss.insertSheet(name, Math.min(index, ss.getSheets().length)); isNew = true; }
    if (!headers) return isNew;
    var lastCol = sh.getLastColumn();
    var existing = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); }) : [];
    if (!existing.filter(String).length) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    } else {
      var missing = headers.filter(function (h) { return existing.indexOf(h) < 0; });
      if (missing.length) sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    }
    var n = sh.getLastColumn();
    sh.getRange(1, 1, 1, n).setFontWeight('bold').setBackground('#13315c').setFontColor('#ffffff').setVerticalAlignment('middle').setWrap(true);
    sh.setFrozenRows(1);
    sh.setRowHeight(1, 34);
    return isNew;
  },

  colOf_: function (sh, header) {
    var hdr = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function (h) { return String(h).trim(); });
    return hdr.indexOf(header) + 1;
  },

  rule_: function (list) {
    return SpreadsheetApp.newDataValidation().requireValueInList(list, true).setAllowInvalid(false).build();
  },

  formatContacts_: function (sh) {
    var rows = Math.max(sh.getMaxRows() - 1, 999);
    if (sh.getMaxRows() < 1000) sh.insertRowsAfter(sh.getMaxRows(), 1000 - sh.getMaxRows());
    var c = function (h) { return Setup.colOf_(sh, h); };
    sh.getRange(2, c('Select'), rows, 1).insertCheckboxes();
    sh.getRange(2, c('Permission'), rows, 1).setDataValidation(this.rule_([APP.PERMISSION.BUSINESS, APP.PERMISSION.OPTED_IN, APP.PERMISSION.DO_NOT_CONTACT]));
    sh.getRange(2, c('Unsubscribe Status'), rows, 1).setDataValidation(this.rule_([APP.UNSUB.SUBSCRIBED, APP.UNSUB.UNSUBSCRIBED]));
    sh.getRange(2, c('Last Email Sent Date'), rows, 1).setNumberFormat('dd mmm yyyy hh:mm');
    sh.getRange(2, c('Next Scheduled Date'), rows, 1).setNumberFormat('ddd dd mmm yyyy');
    sh.getRange(2, c('Date Added'), rows, 1).setNumberFormat('dd mmm yyyy');
    sh.getRange(2, c('Email Address'), rows, 1).setNumberFormat('@');
    var widths = { 'Contact ID': 80, 'Company Name': 200, 'Contact Person': 150, 'Email Address': 250, 'Building Name': 170, 'Campaign Status': 150, 'Email Sent Count': 80, 'Last Email Sent Date': 140, 'Next Scheduled Date': 140, 'Delivery Status': 110, 'Unsubscribe Status': 120, 'Error Log': 260, 'Permission': 140, 'Tags': 120, 'Select': 60, 'Date Added': 100, 'Source': 160, 'Notes': 220 };
    Object.keys(widths).forEach(function (h) { if (c(h) > 0) sh.setColumnWidth(c(h), widths[h]); });
    var rules = [];
    var col = function (h) { return sh.getRange(2, c(h), rows, 1); };
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(APP.UNSUB.UNSUBSCRIBED).setBackground('#fce8e6').setFontColor('#c5221f').setRanges([col('Unsubscribe Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Sent').setBackground('#e6f4ea').setFontColor('#1e8e3e').setRanges([col('Delivery Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Bounced').setBackground('#fce8e6').setFontColor('#c5221f').setRanges([col('Delivery Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Failed').setBackground('#fce8e6').setFontColor('#c5221f').setRanges([col('Delivery Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextContains('Retry').setBackground('#fef7e0').setFontColor('#e37400').setRanges([col('Delivery Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(APP.PERMISSION.DO_NOT_CONTACT).setBackground('#fce8e6').setRanges([col('Permission')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Queued').setFontColor('#1a73e8').setRanges([col('Campaign Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextStartsWith('Emailed').setFontColor('#1e8e3e').setRanges([col('Campaign Status')]).build());
    rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=LEN($L2)>0').setFontColor('#c5221f').setRanges([col('Error Log')]).build());
    sh.setConditionalFormatRules(rules);
  },

  formatCampaigns_: function (sh) {
    var rows = Math.max(sh.getMaxRows() - 1, 199);
    var c = function (h) { return Setup.colOf_(sh, h); };
    var S = APP.CAMPAIGN_STATUS;
    sh.getRange(2, c('Status'), rows, 1).setDataValidation(this.rule_([S.DRAFT, S.SCHEDULED, S.ACTIVE, S.PAUSED, S.STOPPED, S.COMPLETED]));
    sh.getRange(2, c('Send Time'), rows, 1).setNumberFormat('@');
    ['Start Date', 'End Date', 'Est. Finish Date'].forEach(function (h) { sh.getRange(2, c(h), rows, 1).setNumberFormat('ddd dd mmm yyyy'); });
    ['Created At', 'Started At', 'Completed At', 'Last Run'].forEach(function (h) { sh.getRange(2, c(h), rows, 1).setNumberFormat('dd mmm yyyy hh:mm'); });
    sh.getRange(2, c('Progress %'), rows, 1).setNumberFormat('0.0"%"');
    sh.setColumnWidth(c('Campaign Name'), 220);
    sh.setColumnWidth(c('Notes'), 260);
    var range = sh.getRange(2, c('Status'), rows, 1);
    var mk = function (t, bg, fg) { return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setFontColor(fg).setRanges([range]).build(); };
    sh.setConditionalFormatRules([
      mk(S.ACTIVE, '#e6f4ea', '#1e8e3e'), mk(S.SCHEDULED, '#e8f0fe', '#1a73e8'), mk(S.PAUSED, '#fef7e0', '#e37400'),
      mk(S.STOPPED, '#fce8e6', '#c5221f'), mk(S.COMPLETED, '#f1f3f4', '#5f6368'), mk(S.DRAFT, '#ffffff', '#5f6368')
    ]);
  },

  formatContent_: function (sh) {
    var rows = Math.max(sh.getMaxRows() - 1, 99);
    var c = function (h) { return Setup.colOf_(sh, h); };
    ['Email Subject', 'Plain Text Body', 'HTML Email Content', 'Sender Name', 'Reply-To Email', 'Email Signature', 'Notes'].forEach(function (h) {
      sh.getRange(2, c(h), rows, 1).setNumberFormat('@').setVerticalAlignment('top');
    });
    sh.getRange(2, c('Format'), rows, 1).setDataValidation(this.rule_([APP.FORMAT.HTML, APP.FORMAT.PLAIN]));
    sh.getRange(2, c('Status'), rows, 1).setDataValidation(this.rule_([APP.CONTENT_STATUS.DRAFT, APP.CONTENT_STATUS.READY]));
    sh.getRange(2, c('Last Updated'), rows, 1).setNumberFormat('dd mmm yyyy hh:mm');
    sh.getRange(2, 1, rows, sh.getLastColumn()).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    var w = { 'Content ID': 80, 'Content Name': 200, 'Email Subject': 300, 'Plain Text Body': 320, 'HTML Email Content': 320, 'Sender Name': 180, 'Reply-To Email': 220, 'Email Signature': 220, 'Format': 90, 'Status': 80 };
    Object.keys(w).forEach(function (h) { if (c(h) > 0) sh.setColumnWidth(c(h), w[h]); });
  },

  formatQueue_: function (sh) {
    var rows = Math.max(sh.getMaxRows() - 1, 999);
    var c = function (h) { return Setup.colOf_(sh, h); };
    ['Queued At', 'Last Attempt At', 'Next Retry At', 'Sent At'].forEach(function (h) { sh.getRange(2, c(h), rows, 1).setNumberFormat('dd mmm yyyy hh:mm'); });
    sh.setColumnWidth(c('Queue Key'), 150);
    sh.setColumnWidth(c('Email Address'), 240);
    sh.setColumnWidth(c('Error'), 300);
    var range = sh.getRange(2, c('Status'), rows, 1);
    var Q = APP.QUEUE_STATUS;
    var mk = function (t, bg, fg) { return SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setFontColor(fg).setRanges([range]).build(); };
    sh.setConditionalFormatRules([
      mk(Q.SENT, '#e6f4ea', '#1e8e3e'), mk(Q.PENDING, '#e8f0fe', '#1a73e8'), mk(Q.SENDING, '#fef7e0', '#e37400'),
      mk(Q.RETRY, '#fef7e0', '#e37400'), mk(Q.FAILED, '#fce8e6', '#c5221f'), mk(Q.BOUNCED, '#fce8e6', '#c5221f'),
      mk(Q.SKIPPED, '#f1f3f4', '#5f6368'), mk(Q.CANCELLED, '#f1f3f4', '#5f6368')
    ]);
  },

  formatSimple_: function (sh, widths) {
    widths.forEach(function (w, i) { if (i < sh.getMaxColumns()) sh.setColumnWidth(i + 1, w); });
  },

  ensureSettings_: function (sh) {
    var last = sh.getLastRow();
    var keys = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]).trim(); }) : [];
    var add = DEFAULT_SETTINGS.filter(function (d) { return keys.indexOf(d[0]) < 0; });
    if (add.length) sh.getRange(Math.max(last, 1) + 1, 1, add.length, 3).setValues(add);
    var n = sh.getLastRow();
    sh.getRange(2, 2, Math.max(n - 1, 1), 1).setNumberFormat('@').setHorizontalAlignment('left');
    // Re-write values as text so times like 09:00 are never converted to dates.
    var vals = sh.getRange(2, 2, n - 1, 1).getValues().map(function (r) { return [r[0] instanceof Date ? Util.parseTime(r[0]) : String(r[0])]; });
    sh.getRange(2, 2, n - 1, 1).setValues(vals);
    sh.setColumnWidth(1, 260); sh.setColumnWidth(2, 260); sh.setColumnWidth(3, 620);
    sh.getRange(2, 1, n - 1, 1).setFontWeight('bold');
    sh.getRange(2, 3, n - 1, 1).setFontColor('#5f6368').setWrap(true);
  },

  /** Warning-only protection: the owner can still edit, but gets a warning first. */
  protectSystemSheets_: function (ss) {
    [APP.SHEETS.QUEUE, APP.SHEETS.SEND_LOG, APP.SHEETS.ERROR_LOG, APP.SHEETS.DASHBOARD].forEach(function (name) {
      var sh = ss.getSheetByName(name);
      if (!sh) return;
      var existing = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
      if (!existing.length) sh.protect().setDescription('Managed automatically by Email Automation').setWarningOnly(true);
    });
  },

  /**
   * Adds the owner's first email content (exactly as supplied) as a DRAFT,
   * only if the Email Content sheet is empty. The owner reviews, previews,
   * sends a test and then saves it as Ready.
   */
  seedContent_: function () {
    var t = EmailContentManager.read();
    if (t.rows.length) return '';
    var c = SEED_CONTENT;
    return EmailContentManager.save({
      name: c.name, subject: c.subject, plainBody: c.plainBody, htmlBody: c.htmlBody,
      senderName: c.senderName, replyTo: c.replyTo, signature: c.signature,
      format: APP.FORMAT.HTML, status: APP.CONTENT_STATUS.DRAFT,
      notes: 'Content supplied by the owner. Review, preview, send a test, then set Status = Ready.'
    });
  }
};

/**
 * The owner's email, exactly as supplied. Only change: the
 * "[Click Here ...] (:https://...)" text was turned into a real clickable
 * link in the HTML version (and "text: URL" in the plain-text version).
 */
var SEED_CONTENT = {
  name: 'Dubai Municipality 20+ Year Building Safety Certification',
  subject: 'Action Required: Dubai Municipality 20+ Year Building Safety Certification',
  senderName: 'Civic Design Architects & Engineers',
  replyTo: 'civicdesign.ainakheel@gmail.com',
  plainBody: [
    'Dear Property Manager,',
    '',
    'Has your building completed 20 years or more? If you\'ve received an official notice from the Dubai Municipality, Civic Design Architects & Engineers is here to make your certification process effortless.',
    '',
    'With more than 35 years plus of experience in Dubai, we handle everything from mandatory inspections and \'Build in Dubai\' report submissions to repair supervision and final certificate issuance.',
    '',
    'Save time and avoid municipal delays. Share your building details with us in seconds:',
    '',
    '👉 Click Here to Submit Property Details: https://forms.cloud.microsoft/r/rDGK2cpA0W?origin=lprLink',
    '',
    'Let our more than 35 years plus experience take care of your building!'
  ].join('\n'),
  htmlBody: [
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222222;">',
    '<p>Dear Property Manager,</p>',
    '<p>Has your building completed 20 years or more? If you\'ve received an official notice from the Dubai Municipality, Civic Design Architects &amp; Engineers is here to make your certification process effortless.</p>',
    '<p>With more than 35 years plus of experience in Dubai, we handle everything from mandatory inspections and \'Build in Dubai\' report submissions to repair supervision and final certificate issuance.</p>',
    '<p>Save time and avoid municipal delays. Share your building details with us in seconds:</p>',
    '<p>👉 <a href="https://forms.cloud.microsoft/r/rDGK2cpA0W?origin=lprLink" style="color:#1a5fb4;font-weight:bold;">Click Here to Submit Property Details</a></p>',
    '<p>Let our more than 35 years plus experience take care of your building!</p>',
    '</div>'
  ].join('\n'),
  signature: [
    'Civic Design Architects & Engineers',
    '📍 Admin Office #01, Al Nakheel Center, Deira, Dubai, U.A.E',
    '📞 +971 52 851 5940',
    '💬 +971 56 366 0229',
    '✉️ civicdesign.ainakheel@gmail.com'
  ].join('\n')
};
