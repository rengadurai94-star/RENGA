/**
 * Menu.gs
 * ----------------------------------------------------------------------------
 * Spreadsheet menu + the server functions called by the HTML interface
 * (Control Panel sidebar, Content Editor and Import dialogs).
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Email Automation')
    .addItem('🧭 Open Control Panel', 'menuOpenPanel')
    .addItem('✏️ Content Editor (subject, body, signature)', 'menuOpenEditor')
    .addItem('📥 Import Contacts (CSV / Excel file)', 'menuOpenImport')
    .addSeparator()
    .addSubMenu(ui.createMenu('👥 Contacts')
      .addItem('Import rows pasted in the "Import" sheet', 'menuImportSheet')
      .addItem('Validate contacts & assign missing IDs', 'menuValidateContacts')
      .addItem('Delete ticked contacts (Select column)', 'menuDeleteSelected')
      .addItem('Untick all', 'menuClearSelection'))
    .addSubMenu(ui.createMenu('📣 Campaign (select its row in "Campaigns")')
      .addItem('▶️ Start', 'menuStartCampaign')
      .addItem('⏸️ Pause', 'menuPauseCampaign')
      .addItem('⏯️ Resume', 'menuResumeCampaign')
      .addItem('⛔ Stop permanently', 'menuStopCampaign')
      .addItem('➕ Add newly imported contacts', 'menuAddNewContacts'))
    .addSeparator()
    .addItem('🔄 Refresh Dashboard', 'menuRefreshDashboard')
    .addItem('▶️ Run scheduler now', 'menuRunNow')
    .addItem('📬 Check inbox now (bounces / unsubscribe replies)', 'menuProcessInbox')
    .addSeparator()
    .addSubMenu(ui.createMenu('⚙️ System')
      .addItem('Setup / Repair System', 'setupSystem')
      .addItem('Install / repair cloud automation', 'menuInstallTriggers')
      .addItem('⛔ EMERGENCY STOP (remove all automation)', 'menuRemoveTriggers')
      .addItem('Run self-tests (sends nothing)', 'runSelfTests')
      .addItem('About', 'menuAbout'))
    .addToUi();
}

// ---------------------------------------------------------------- menu handlers

function menuOpenPanel() {
  var html = HtmlService.createTemplateFromFile('ControlPanel').evaluate().setTitle('Email Automation');
  SpreadsheetApp.getUi().showSidebar(html);
}

function menuOpenEditor(contentId) {
  var t = HtmlService.createTemplateFromFile('ContentEditor');
  t.initialId = typeof contentId === 'string' ? contentId : '';
  SpreadsheetApp.getUi().showModalDialog(t.evaluate().setWidth(1000).setHeight(720), 'Email Content Editor');
}

function menuOpenImport() {
  var html = HtmlService.createTemplateFromFile('ImportDialog').evaluate().setWidth(620).setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import Contacts');
}

function menuImportSheet() {
  ErrorHandler.safeUi('Import', function () {
    var s = ContactManager.importFromImportSheet();
    SpreadsheetApp.getUi().alert('Import finished', importSummaryText_(s), SpreadsheetApp.getUi().ButtonSet.OK);
    DashboardManager.refresh();
  });
}

function menuValidateContacts() {
  ErrorHandler.safeUi('Validate contacts', function () {
    var r = ContactManager.validateAll();
    SpreadsheetApp.getUi().alert('Contacts checked',
      r.total + ' contacts checked.\nIDs assigned: ' + r.fixedIds + '\nInvalid emails: ' + r.invalid + '\nDuplicates: ' + r.duplicates +
      '\n\nProblems are written in the "Error Log" column. Invalid and duplicate rows are never emailed twice.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function menuDeleteSelected() {
  ErrorHandler.safeUi('Delete contacts', function () {
    var ui = SpreadsheetApp.getUi();
    if (ui.alert('Delete ticked contacts?', 'All contacts with a tick in the "Select" column will be deleted and removed from pending campaigns. This cannot be undone.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    var n = ContactManager.deleteSelected();
    ui.alert(n + ' contact(s) deleted.');
  });
}

function menuClearSelection() { ErrorHandler.safeUi('Untick', function () { ContactManager.clearSelection(); }); }

function selectedCampaignId_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getActiveSheet();
  if (sh.getName() === APP.SHEETS.CAMPAIGNS && sh.getActiveRange().getRow() > 1) {
    var id = sh.getRange(sh.getActiveRange().getRow(), 1).getValue();
    if (id) return String(id);
  }
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Which campaign?', 'Enter the Campaign ID (e.g. CMP-001):', ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return '';
  return r.getResponseText().trim().toUpperCase();
}

function campaignMenuAction_(label, fn) {
  ErrorHandler.safeUi(label, function () {
    var id = selectedCampaignId_();
    if (!id) return;
    var msg = fn(id);
    DashboardManager.refresh();
    SpreadsheetApp.getUi().alert(label, msg, SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function menuStartCampaign() {
  campaignMenuAction_('Start campaign', function (id) {
    var q = CampaignManager.start(id);
    return id + ' started with ' + q.added + ' recipients.' + (q.ineligible ? '\n' + q.ineligible + ' contacts excluded: ' + JSON.stringify(q.reasons) : '');
  });
}
function menuPauseCampaign() { campaignMenuAction_('Pause campaign', function (id) { CampaignManager.pause(id); return id + ' paused. No more emails will be sent until you resume.'; }); }
function menuResumeCampaign() { campaignMenuAction_('Resume campaign', function (id) { CampaignManager.resume(id); return id + ' resumed.'; }); }
function menuStopCampaign() {
  campaignMenuAction_('Stop campaign', function (id) {
    var ui = SpreadsheetApp.getUi();
    if (ui.alert('Stop ' + id + ' permanently?', 'Remaining recipients will be cancelled. Use Pause if you want to continue later.', ui.ButtonSet.YES_NO) !== ui.Button.YES) return 'Not stopped.';
    var n = CampaignManager.stop(id);
    return id + ' stopped. ' + n + ' pending recipients cancelled.';
  });
}
function menuAddNewContacts() { campaignMenuAction_('Add contacts', function (id) { var q = CampaignManager.addNewContacts(id); return q.added + ' new recipient(s) added to ' + id + '.'; }); }

function menuRefreshDashboard() { ErrorHandler.safeUi('Refresh', function () { DashboardManager.refresh(); }); }

function menuRunNow() {
  ErrorHandler.safeUi('Run scheduler', function () {
    var s = EmailScheduler.run();
    var lines = Object.keys(s.campaigns || {}).map(function (k) { return k + ': ' + s.campaigns[k]; });
    SpreadsheetApp.getUi().alert('Scheduler run finished',
      s.skipped === 'locked' ? 'Another run is in progress — try again in a minute.' :
        'Sent: ' + s.sent + '\nRetry scheduled: ' + s.retry + '\nFailed: ' + s.failed + '\nSkipped: ' + s.skipped +
        '\nRecovered: ' + s.recovered + '\n\n' + (lines.join('\n') || 'No running campaigns.'), SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function menuProcessInbox() {
  ErrorHandler.safeUi('Check inbox', function () {
    var r = UnsubscribeManager.processInbox();
    SpreadsheetApp.getUi().alert('Inbox checked', 'Bounces found: ' + r.bounces + '\nUnsubscribe replies: ' + r.unsubscribes, SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function menuInstallTriggers() {
  ErrorHandler.safeUi('Install automation', function () {
    var n = EmailScheduler.installTriggers();
    SpreadsheetApp.getUi().alert('Cloud automation installed', 'The scheduler now runs every ' + n + ' minutes on Google\'s servers — your computer can be switched off.', SpreadsheetApp.getUi().ButtonSet.OK);
  });
}

function menuRemoveTriggers() {
  ErrorHandler.safeUi('Emergency stop', function () {
    var ui = SpreadsheetApp.getUi();
    if (ui.alert('Emergency stop?', 'This removes ALL automation. No emails will be sent until you choose "Install / repair cloud automation".', ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
    var n = EmailScheduler.removeTriggers();
    ui.alert(n + ' trigger(s) removed. Automation is OFF.');
  });
}

function menuAbout() {
  SpreadsheetApp.getUi().alert(APP.NAME + ' v' + APP.VERSION,
    'Runs entirely on Google Apps Script + Gmail + Google Sheets.\nTime zone: ' + APP.TZ + '\nSending account: ' + Util.ownerEmail(),
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function importSummaryText_(s) {
  return 'Rows read: ' + s.total + '\nAdded: ' + s.added + '\nAlready in list (skipped): ' + s.duplicates +
    '\nInvalid emails (skipped): ' + s.invalid + (s.invalidSamples && s.invalidSamples.length ? ' e.g. ' + s.invalidSamples.join(', ') : '') +
    '\nOn suppression list (added as Unsubscribed): ' + s.suppressed;
}

function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }

// ---------------------------------------------------------------- UI server API (google.script.run)

function uiGetPanelData() {
  var settings = Config.load(true);
  var queue = Db.read(APP.SHEETS.QUEUE);
  var campaigns = CampaignManager.read();
  var contacts = ContactManager.read();
  var m = DashboardManager.metrics(contacts, queue, campaigns, settings);
  var h = DashboardManager.health(settings);
  var tags = {};
  contacts.rows.forEach(function (r) { String(r['Tags'] || '').split(/[,;]/).forEach(function (t) { t = t.trim(); if (t) tags[t] = (tags[t] || 0) + 1; }); });
  var selected = contacts.rows.filter(function (r) { return r['Select'] === true; }).length;
  return {
    metrics: m,
    health: { triggersOk: h.triggersOk, lastRun: Util.fmtDateTime(h.lastRun), schedulerHealthy: h.schedulerHealthy, errors24: h.errors24, testMode: h.testMode, webAppConfigured: h.webAppConfigured },
    campaigns: CampaignManager.listForUi(),
    contents: EmailContentManager.list(),
    settings: Config.raw(),
    defaults: { dailyLimit: settings.defaultDailyLimit, sendTime: settings.defaultSendTime, sendingDays: settings.defaultSendingDays, today: Util.dayKey(new Date()), windowEnd: settings.windowEnd },
    tags: tags, selected: selected,
    owner: Util.ownerEmail(), sheetUrl: Db.ss().getUrl(), tz: APP.TZ, now: Util.fmtDateTime(new Date())
  };
}

function uiCreateCampaign(form) { return CampaignManager.create(form); }
function uiUpdateCampaign(id, form) { return CampaignManager.updateSettings(id, form); }
function uiDeleteDraft(id) { return CampaignManager.deleteDraft(id); }

function uiCampaignAction(id, action) {
  var r;
  switch (action) {
    case 'start':
      var s = CampaignManager.start(id);
      r = 'Started with ' + s.added + ' recipients.' + (s.ineligible ? ' ' + s.ineligible + ' excluded (' + Object.keys(s.reasons).map(function (k) { return k + ': ' + s.reasons[k]; }).join(', ') + ').' : '');
      break;
    case 'pause': CampaignManager.pause(id); r = 'Paused.'; break;
    case 'resume': CampaignManager.resume(id); r = 'Resumed.'; break;
    case 'stop': r = 'Stopped. ' + CampaignManager.stop(id) + ' pending recipients cancelled.'; break;
    case 'addContacts': var q = CampaignManager.addNewContacts(id); r = q.added + ' new recipient(s) added.'; break;
    default: throw new Error('Unknown action ' + action);
  }
  DashboardManager.refresh();
  return r;
}

function uiGetContent(id) { return id ? EmailContentManager.get(id) : null; }
function uiListContent() { return EmailContentManager.list(); }
function uiSaveContent(obj) { return EmailContentManager.save(obj); }
function uiPreviewHtml(id) { return EmailContentManager.previewPage(id); }
function uiSendTest(id, to) { return EmailContentManager.sendTest(id, to); }
function uiOpenEditor(id) { menuOpenEditor(id || ''); }
function uiOpenImport() { menuOpenImport(); }

function uiImportRows(rows, fileName) {
  if (!rows || !rows.length) throw new Error('The file is empty.');
  if (rows.length > 20000) throw new Error('File too large (max 20,000 rows per import).');
  var s = ContactManager.importRows(rows, 'File: ' + String(fileName || '').slice(0, 80));
  DashboardManager.refresh();
  return importSummaryText_(s);
}

function uiImportCsvText(text, fileName) {
  var rows = Utilities.parseCsv(String(text || '').replace(/^﻿/, ''));
  return uiImportRows(rows, fileName);
}

function uiAddContact(c) { ContactManager.addContact(c); DashboardManager.refresh(); return 'Contact added.'; }

var UI_EDITABLE_SETTINGS = ['DEFAULT_DAILY_LIMIT', 'GLOBAL_DAILY_CAP', 'QUOTA_RESERVE', 'DEFAULT_SEND_TIME', 'SENDING_WINDOW_END',
  'DEFAULT_SENDING_DAYS', 'MAX_EMAILS_PER_RUN', 'SECONDS_BETWEEN_EMAILS', 'SCHEDULER_INTERVAL_MINUTES', 'MAX_ATTEMPTS',
  'RETRY_DELAY_MINUTES', 'MIN_DAYS_BETWEEN_EMAILS', 'ADD_UNSUBSCRIBE_FOOTER', 'UNSUBSCRIBE_FOOTER_TEXT', 'UNSUBSCRIBE_LINK_TEXT',
  'UNSUBSCRIBE_WEB_APP_URL', 'PROCESS_INBOX', 'TEST_MODE', 'TEST_RECIPIENT', 'NOTIFY_EMAIL', 'ALLOWED_PERMISSIONS', 'DEFAULT_PERMISSION_ON_IMPORT'];

function uiSaveSettings(obj) {
  var before = Config.load(true).intervalMinutes;
  Object.keys(obj || {}).forEach(function (k) {
    if (UI_EDITABLE_SETTINGS.indexOf(k) < 0) return;
    var v = obj[k];
    if (k === 'DEFAULT_SEND_TIME' || k === 'SENDING_WINDOW_END') {
      v = Util.parseTime(v);
      if (!v) throw new Error(k + ': use HH:MM, e.g. 09:00');
    }
    if (k === 'UNSUBSCRIBE_WEB_APP_URL' && v && !/^https:\/\/script\.google\.com\//.test(String(v).trim())) {
      throw new Error('The unsubscribe URL must be your Apps Script web-app URL (https://script.google.com/macros/s/.../exec).');
    }
    Config.set(k, String(v));
  });
  var after = Config.load(true);
  if (after.intervalMinutes !== before) EmailScheduler.installTriggers();
  DashboardManager.refresh();
  return 'Settings saved.';
}

function uiRunNow() { return EmailScheduler.run(); }
function uiProcessInbox() { return UnsubscribeManager.processInbox(); }
function uiRefreshDashboard() { DashboardManager.refresh(); return true; }
function uiValidateContacts() { return ContactManager.validateAll(); }
function uiWebAppUrl() { try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; } }
