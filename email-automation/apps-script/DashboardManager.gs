/**
 * DashboardManager.gs
 * ----------------------------------------------------------------------------
 * Builds the "Dashboard" sheet and keeps the derived contact columns
 * (Campaign Status, Email Sent Count, Last Email Sent Date, Next Scheduled
 * Date, Delivery Status) in sync with the Campaign Queue.
 */

var DashboardManager = {
  COLORS: { navy: '#0b2545', teal: '#13315c', accent: '#1f7a8c', light: '#eef4f8', border: '#d0dbe5', good: '#1e8e3e', warn: '#e37400', bad: '#c5221f', grey: '#5f6368' },
  STATUS_ICON: { 'Active': '🟢 Active', 'Scheduled': '🕒 Scheduled', 'Paused': '⏸️ Paused', 'Stopped': '⛔ Stopped', 'Completed': '✅ Completed', 'Draft': '📝 Draft' },

  refresh: function (opts) {
    opts = opts || {};
    try {
      var settings = Config.load();
      var queue = Db.read(APP.SHEETS.QUEUE);
      var campaigns = CampaignManager.read();
      var contacts = ContactManager.read();
      var est = this.syncContacts_(contacts, queue, campaigns, settings);
      this.render_(contacts, queue, campaigns, settings, est);
      PropertiesService.getScriptProperties().setProperty('LAST_DASHBOARD_REFRESH', String(Date.now()));
    } catch (e) {
      ErrorHandler.error('DashboardManager', 'refresh', e);
    }
  },

  /** Recomputes derived contact columns from the queue (batched column writes). */
  syncContacts_: function (contacts, queue, campaigns, settings) {
    var now = new Date();
    var statusById = {};
    campaigns.rows.forEach(function (c) { statusById[String(c['Campaign ID'])] = c; });

    // Next scheduled dates for pending items of running campaigns.
    var nextDate = {};
    campaigns.rows.forEach(function (c) {
      var st = String(c['Status']);
      if (st !== APP.CAMPAIGN_STATUS.ACTIVE && st !== APP.CAMPAIGN_STATUS.SCHEDULED) return;
      var cid = String(c['Campaign ID']);
      var stats = CampaignManager.countQueue_(cid, queue);
      var pend = queue.rows.filter(function (q) {
        return String(q['Campaign ID']) === cid && (q['Status'] === APP.QUEUE_STATUS.PENDING || q['Status'] === APP.QUEUE_STATUS.RETRY || q['Status'] === APP.QUEUE_STATUS.SENDING);
      }).sort(function (a, b) { return (parseInt(a['Queue Order'], 10) || 0) - (parseInt(b['Queue Order'], 10) || 0); });
      var dates = EmailScheduler.estimateDates(c, pend.length, stats.sentToday, settings, now);
      pend.forEach(function (q, i) {
        var k = String(q['Contact ID']);
        if (dates[i] && (!nextDate[k] || dates[i] < nextDate[k])) nextDate[k] = dates[i];
      });
    });

    // Aggregate queue per contact.
    var agg = {};
    queue.rows.forEach(function (q) {
      var k = String(q['Contact ID']);
      var a = agg[k] || (agg[k] = { sent: 0, last: null, lastCampaign: '', pendingIn: '', pausedIn: '', latestStatus: '', latestAt: 0 });
      var st = q['Status'];
      var isTest = /^TEST MODE/.test(String(q['Error'] || ''));
      if ((st === APP.QUEUE_STATUS.SENT || st === APP.QUEUE_STATUS.BOUNCED) && !isTest) {
        a.sent++;
        if (q['Sent At'] instanceof Date && (!a.last || q['Sent At'] > a.last)) { a.last = q['Sent At']; a.lastCampaign = String(q['Campaign ID']); }
      }
      var cst = statusById[String(q['Campaign ID'])] ? String(statusById[String(q['Campaign ID'])]['Status']) : '';
      if (st === APP.QUEUE_STATUS.PENDING || st === APP.QUEUE_STATUS.RETRY || st === APP.QUEUE_STATUS.SENDING) {
        if (cst === APP.CAMPAIGN_STATUS.ACTIVE || cst === APP.CAMPAIGN_STATUS.SCHEDULED) a.pendingIn = String(q['Campaign ID']);
        else if (cst === APP.CAMPAIGN_STATUS.PAUSED) a.pausedIn = String(q['Campaign ID']);
      }
      var t = Math.max(q['Last Attempt At'] instanceof Date ? q['Last Attempt At'].getTime() : 0, q['Sent At'] instanceof Date ? q['Sent At'].getTime() : 0);
      if (t >= a.latestAt && !isTest) { a.latestAt = t; a.latestStatus = st; }
    });

    var sh = contacts.sheet;
    var last = sh.getLastRow();
    if (last < 2) return nextDate;
    var cols = ['Campaign Status', 'Email Sent Count', 'Last Email Sent Date', 'Next Scheduled Date', 'Delivery Status'];
    var colData = {};
    cols.forEach(function (h) {
      if (contacts.col[h]) colData[h] = { values: sh.getRange(2, contacts.col[h], last - 1, 1).getValues(), changed: false };
    });
    var set = function (h, rowIdx, v) {
      var cd = colData[h];
      if (!cd) return;
      var cur = cd.values[rowIdx][0];
      var same = (cur instanceof Date && v instanceof Date) ? cur.getTime() === v.getTime() : String(cur) === String(v);
      if (!same) { cd.values[rowIdx][0] = v; cd.changed = true; }
    };

    contacts.rows.forEach(function (r) {
      var idx = r._row - 2;
      var id = String(r['Contact ID'] || '');
      var a = agg[id];
      var unsub = String(r['Unsubscribe Status']).toLowerCase().indexOf('unsub') === 0;
      var nd = !unsub && nextDate[id] ? Util.keyToDate(nextDate[id]) : '';
      set('Next Scheduled Date', idx, nd);
      if (!a) {
        if (unsub) set('Campaign Status', idx, 'Unsubscribed');
        else if (!r['Campaign Status']) set('Campaign Status', idx, 'Not Contacted');
        return;
      }
      set('Email Sent Count', idx, a.sent);
      if (a.last) set('Last Email Sent Date', idx, a.last);
      var cs = unsub ? 'Unsubscribed'
        : a.pendingIn ? 'Queued (' + a.pendingIn + ')'
          : a.pausedIn ? 'Paused (' + a.pausedIn + ')'
            : a.last ? 'Emailed (' + a.lastCampaign + ')' : 'Not Contacted';
      set('Campaign Status', idx, cs);
      var ds = { 'Sent': 'Sent', 'Bounced': 'Bounced', 'Failed': 'Failed', 'Retry': 'Retry pending' }[a.latestStatus];
      if (ds) set('Delivery Status', idx, ds);
    });

    Object.keys(colData).forEach(function (h) {
      if (colData[h].changed) sh.getRange(2, contacts.col[h], last - 1, 1).setValues(colData[h].values);
    });
    return nextDate;
  },

  /** Collects all numbers shown on the dashboard (also used by the Control Panel). */
  metrics: function (contacts, queue, campaigns, settings) {
    var today = Util.dayKey(new Date());
    var m = {
      totalContacts: 0, unsubscribed: 0, noPermission: 0, bounced: 0,
      totalSent: 0, pending: 0, failed: 0, sentToday: 0,
      active: 0, scheduled: 0, paused: 0, completed: 0, draft: 0, stopped: 0,
      activeTotal: 0, activeDone: 0
    };
    contacts.rows.forEach(function (r) {
      if (!r['Email Address']) return;
      m.totalContacts++;
      if (String(r['Unsubscribe Status']).toLowerCase().indexOf('unsub') === 0) m.unsubscribed++;
      var perm = String(r['Permission'] || settings.defaultPermission).trim().toLowerCase();
      if (settings.allowedPermissions.indexOf(perm) < 0) m.noPermission++;
    });
    var running = {};
    campaigns.rows.forEach(function (c) {
      var st = String(c['Status']);
      if (st === APP.CAMPAIGN_STATUS.ACTIVE) m.active++;
      else if (st === APP.CAMPAIGN_STATUS.SCHEDULED) m.scheduled++;
      else if (st === APP.CAMPAIGN_STATUS.PAUSED) m.paused++;
      else if (st === APP.CAMPAIGN_STATUS.COMPLETED) m.completed++;
      else if (st === APP.CAMPAIGN_STATUS.STOPPED) m.stopped++;
      else m.draft++;
      if (st === APP.CAMPAIGN_STATUS.ACTIVE || st === APP.CAMPAIGN_STATUS.SCHEDULED || st === APP.CAMPAIGN_STATUS.PAUSED) running[String(c['Campaign ID'])] = true;
    });
    queue.rows.forEach(function (q) {
      var st = q['Status'];
      var isTest = /^TEST MODE/.test(String(q['Error'] || ''));
      if (st === APP.QUEUE_STATUS.SENT || st === APP.QUEUE_STATUS.BOUNCED) {
        if (!isTest) m.totalSent++;
        if (q['Sent At'] instanceof Date && Util.dayKey(q['Sent At']) === today) m.sentToday++;
        if (st === APP.QUEUE_STATUS.BOUNCED) m.bounced++;
      }
      if (st === APP.QUEUE_STATUS.FAILED || st === APP.QUEUE_STATUS.BOUNCED) m.failed++;
      var isPending = st === APP.QUEUE_STATUS.PENDING || st === APP.QUEUE_STATUS.RETRY || st === APP.QUEUE_STATUS.SENDING;
      if (isPending && running[String(q['Campaign ID'])]) m.pending++;
      if (running[String(q['Campaign ID'])]) { m.activeTotal++; if (!isPending) m.activeDone++; }
    });
    m.completionPct = m.activeTotal ? Math.round(m.activeDone / m.activeTotal * 1000) / 10 : (m.completed ? 100 : 0);
    m.quotaLeft = EmailSender.remainingQuota();
    m.globalCap = settings.globalDailyCap;
    return m;
  },

  health: function (settings) {
    var props = PropertiesService.getScriptProperties();
    var lastRun = Number(props.getProperty('LAST_SCHEDULER_RUN') || 0);
    var lastInbox = Number(props.getProperty('LAST_INBOX_RUN') || 0);
    var trig = EmailScheduler.triggerStatus();
    var staleMs = settings.intervalMinutes * 3 * 60000;
    var errors24 = 0;
    try {
      var since = Date.now() - 86400000;
      Db.read(APP.SHEETS.ERROR_LOG).rows.forEach(function (r) {
        if (r['Severity'] === 'ERROR' && r['Timestamp'] instanceof Date && r['Timestamp'].getTime() > since) errors24++;
      });
    } catch (e) { /* ignore */ }
    return {
      triggersOk: trig.scheduler && trig.inbox && trig.maintenance,
      triggers: trig,
      lastRun: lastRun ? new Date(lastRun) : null,
      schedulerHealthy: !!lastRun && Date.now() - lastRun < staleMs,
      lastInbox: lastInbox ? new Date(lastInbox) : null,
      errors24: errors24,
      testMode: settings.testMode,
      webAppConfigured: !!settings.unsubWebAppUrl
    };
  },

  render_: function (contacts, queue, campaigns, settings) {
    var sh = Db.sheet(APP.SHEETS.DASHBOARD);
    var m = this.metrics(contacts, queue, campaigns, settings);
    var h = this.health(settings);
    var C = this.COLORS;

    sh.getRange('B2').setValue('📧 Email Campaign Dashboard');
    sh.getRange('B3').setValue('Last refreshed: ' + Util.fmtDateTime(new Date()) + ' (Dubai time) · refreshes automatically every ' + settings.intervalMinutes + ' minutes');

    var tiles = [
      ['Total Contacts', m.totalContacts], ['Total Emails Sent', m.totalSent], ['Pending Emails', m.pending],
      ['Failed / Bounced', m.failed], ['Unsubscribed', m.unsubscribed],
      ['Active Campaigns', m.active + m.scheduled], ['Completed Campaigns', m.completed],
      ['Sent Today', m.sentToday + ' / ' + m.globalCap], ['Completion (running)', m.completionPct + '%'],
      ['Gmail Quota Left Today', m.quotaLeft]
    ];
    var labels1 = [], values1 = [], labels2 = [], values2 = [];
    tiles.forEach(function (t, i) {
      (i < 5 ? labels1 : labels2).push(t[0]);
      (i < 5 ? values1 : values2).push(t[1]);
    });
    sh.getRange(5, 2, 1, 5).setValues([labels1]);
    sh.getRange(6, 2, 1, 5).setValues([values1]);
    sh.getRange(8, 2, 1, 5).setValues([labels2]);
    sh.getRange(9, 2, 1, 5).setValues([values2]);
    sh.getRange('E6').setFontColor(m.failed ? C.bad : C.navy);
    sh.getRange('C9').setFontColor(m.sentToday >= m.globalCap ? C.warn : C.navy);

    // ---- campaigns table ---------------------------------------------------
    var startRow = 12;
    var maxRows = 40;
    sh.getRange(startRow, 2, maxRows + 20, 12).clearContent().setBackground(null).setFontColor(null).setFontWeight('normal');
    sh.getRange(startRow, 2).setValue('Campaigns').setFontWeight('bold').setFontSize(13).setFontColor(C.navy);
    var head = ['Campaign', 'Name', 'Status', 'Progress', 'Done %', 'Sent', 'Pending', 'Failed', 'Skipped', 'Today / Limit', 'Send Time · Days', 'Est. Finish'];
    sh.getRange(startRow + 1, 2, 1, head.length).setValues([head]).setFontWeight('bold').setBackground(C.teal).setFontColor('#ffffff');
    var rows = campaigns.rows.slice().reverse().slice(0, maxRows).map(function (c) {
      var s = CampaignManager.countQueue_(String(c['Campaign ID']), queue);
      return [
        String(c['Campaign ID']), String(c['Campaign Name'] || ''),
        DashboardManager.STATUS_ICON[String(c['Status'])] || String(c['Status']),
        DashboardManager.bar_(s.progress), s.progress / 100, s.sent, s.pending, s.failed + s.bounced, s.skipped,
        s.sentToday + ' / ' + (c['Daily Limit'] || settings.defaultDailyLimit),
        (Util.parseTime(c['Send Time']) || settings.defaultSendTime) + ' · ' + String(c['Sending Days'] || settings.defaultSendingDays),
        c['Est. Finish Date'] instanceof Date ? Util.fmtDate(c['Est. Finish Date']) : (String(c['Status']) === 'Completed' ? Util.fmtDate(c['Completed At']) : '')
      ];
    });
    if (rows.length) {
      var r0 = startRow + 2;
      sh.getRange(r0, 2, rows.length, head.length).setValues(rows);
      sh.getRange(r0, 5, rows.length, 1).setFontColor(C.accent).setFontFamily('Courier New');
      sh.getRange(r0, 6, rows.length, 1).setNumberFormat('0.0%');
      for (var i = 0; i < rows.length; i++) {
        sh.getRange(r0 + i, 2, 1, head.length).setBackground(i % 2 ? '#ffffff' : C.light);
        var st = rows[i][2];
        var color = /Active/.test(st) ? C.good : /Paused|Scheduled/.test(st) ? C.warn : /Stopped/.test(st) ? C.bad : C.grey;
        sh.getRange(r0 + i, 4).setFontColor(color).setFontWeight('bold');
      }
    } else {
      sh.getRange(startRow + 2, 2).setValue('No campaigns yet — open the Control Panel (Email Automation menu) and create one.');
    }

    // ---- system health -----------------------------------------------------
    var hr = startRow + Math.max(rows.length, 1) + 4;
    sh.getRange(hr, 2).setValue('System Health').setFontWeight('bold').setFontSize(13).setFontColor(C.navy);
    var health = [
      ['Cloud scheduler', h.triggersOk ? '🟢 Installed (runs every ' + settings.intervalMinutes + ' min on Google servers)' : '🔴 NOT installed — menu: Email Automation → System → Install automation'],
      ['Last scheduler run', h.lastRun ? Util.fmtDateTime(h.lastRun) + (h.schedulerHealthy ? '  🟢' : '  🟠 (older than expected)') : '—'],
      ['Inbox check (bounces / unsubscribe replies)', h.lastInbox ? Util.fmtDateTime(h.lastInbox) : (settings.processInbox ? 'Not run yet' : 'Disabled in Settings')],
      ['Errors in last 24h', h.errors24 ? '🔴 ' + h.errors24 + ' (see Error Log sheet)' : '🟢 None'],
      ['Test mode', h.testMode ? '🟠 ON — emails go to ' + settings.testRecipient + ' only' : '🟢 OFF (live sending)'],
      ['Unsubscribe page', h.webAppConfigured ? '🟢 One-click web page configured' : '🟠 Using reply-to-unsubscribe (deploy the web app for one-click links)'],
      ['Limits', 'Global cap ' + settings.globalDailyCap + '/day · reserve ' + settings.quotaReserve + ' · max ' + settings.maxPerRun + ' per run · window until ' + settings.windowEnd],
      ['Contacts without permission', m.noPermission ? m.noPermission + ' (never emailed)' : '0']
    ];
    sh.getRange(hr + 1, 2, health.length, 2).setValues(health);
    sh.getRange(hr + 1, 2, health.length, 1).setFontWeight('bold').setFontColor(C.grey);
  },

  /** Text progress bar (works in every spreadsheet locale). */
  bar_: function (pct) {
    var n = Math.max(0, Math.min(20, Math.round((pct || 0) / 5)));
    return new Array(n + 1).join('█') + new Array(21 - n).join('░');
  },

  /** One-time layout & styling of the Dashboard sheet (called by Setup). */
  buildLayout: function () {
    var sh = Db.sheet(APP.SHEETS.DASHBOARD);
    var C = this.COLORS;
    sh.clear();
    sh.setHiddenGridlines(true);
    sh.setColumnWidth(1, 24);
    for (var c = 2; c <= 13; c++) sh.setColumnWidth(c, 150);
    sh.setColumnWidth(3, 220);
    sh.getRange('B2:M2').merge().setFontSize(20).setFontWeight('bold').setFontColor(C.navy);
    sh.getRange('B3:M3').merge().setFontColor(C.grey).setFontStyle('italic');
    [[5, 6], [8, 9]].forEach(function (p) {
      sh.getRange(p[0], 2, 1, 5).setBackground(C.navy).setFontColor('#ffffff').setFontWeight('bold').setFontSize(10)
        .setHorizontalAlignment('center').setBorder(true, true, false, true, true, false, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_THICK);
      sh.getRange(p[1], 2, 1, 5).setBackground(C.light).setFontColor(C.navy).setFontWeight('bold').setFontSize(22)
        .setHorizontalAlignment('center').setVerticalAlignment('middle')
        .setBorder(false, true, true, true, true, false, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_THICK);
      sh.setRowHeight(p[1], 52);
    });
    sh.setFrozenRows(0);
  }
};
