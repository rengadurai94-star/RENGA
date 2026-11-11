/**
 * SelfTests.gs
 * ----------------------------------------------------------------------------
 * Built-in health & logic checks. They NEVER send email and never change your
 * contacts or campaigns. Results go to the "Test Results" sheet.
 * Menu: Email Automation → System → Run self-tests.
 */

function runSelfTests() {
  var results = SelfTests.runAll();
  var failed = results.filter(function (r) { return r.result !== 'PASS'; });
  try {
    SpreadsheetApp.getUi().alert('Self-tests finished',
      (results.length - failed.length) + ' passed, ' + failed.length + ' failed.' +
      (failed.length ? '\n\n' + failed.map(function (f) { return '✗ ' + f.test + ': ' + f.detail; }).join('\n') : '\n\nAll good ✅') +
      '\n\nDetails: "Test Results" sheet.', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) { /* run from editor */ }
  return results;
}

var SelfTests = {
  runAll: function () {
    var out = [];
    var t = function (name, fn) {
      try {
        var detail = fn();
        out.push({ test: name, result: 'PASS', detail: detail || '' });
      } catch (e) {
        out.push({ test: name, result: 'FAIL', detail: e.message });
      }
    };
    var eq = function (a, b, label) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((label || '') + ' expected ' + JSON.stringify(b) + ' got ' + JSON.stringify(a)); };
    var ok = function (c, msg) { if (!c) throw new Error(msg); };
    var settings = Config.load(true);

    t('All sheets present', function () {
      Object.keys(APP.SHEETS).forEach(function (k) { Db.sheet(APP.SHEETS[k]); });
      return Object.keys(APP.SHEETS).length + ' sheets';
    });
    t('Required contact fields present', function () {
      var hdr = Db.read(APP.SHEETS.CONTACTS).headers;
      APP.HEADERS.CONTACTS.forEach(function (h) { ok(hdr.indexOf(h) >= 0, 'Missing column ' + h); });
    });
    t('Spreadsheet time zone is Asia/Dubai', function () { eq(Db.ss().getSpreadsheetTimeZone(), APP.TZ); });
    t('Cloud triggers installed', function () {
      var s = EmailScheduler.triggerStatus();
      ok(s.scheduler && s.inbox && s.maintenance, 'Missing: ' + JSON.stringify(s) + ' → menu System → Install / repair cloud automation');
    });
    t('Gmail quota readable', function () { var q = EmailSender.remainingQuota(); ok(q >= 0, 'quota unavailable'); return q + ' recipients left today'; });
    t('Settings valid', function () {
      ok(settings.defaultSendTime < settings.windowEnd, 'DEFAULT_SEND_TIME must be before SENDING_WINDOW_END');
      ok(settings.globalDailyCap >= settings.defaultDailyLimit, 'GLOBAL_DAILY_CAP lower than DEFAULT_DAILY_LIMIT');
      ok(settings.allowedPermissions.length > 0, 'ALLOWED_PERMISSIONS empty');
      return 'limit ' + settings.defaultDailyLimit + '/day, cap ' + settings.globalDailyCap + ', ' + settings.defaultSendTime + '–' + settings.windowEnd + ', ' + settings.defaultSendingDays;
    });
    t('Time parsing', function () {
      eq(Util.parseTime('9'), '09:00'); eq(Util.parseTime('9:30'), '09:30'); eq(Util.parseTime('2:15 pm'), '14:15'); eq(Util.parseTime('25:00'), '');
    });
    t('Day parsing', function () {
      eq(Util.parseDays('Mon-Fri'), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']); eq(Util.parseDays('sat, sun'), ['Sat', 'Sun']);
    });
    t('Email validation', function () {
      ok(ContactManager.isValidEmail('info@company.ae'), 'valid rejected');
      ok(!ContactManager.isValidEmail('@'), '"@" accepted');
      ok(!ContactManager.isValidEmail('a@b'), 'no TLD accepted');
      eq(ContactManager.normalizeEmail('  TALIB@GMAIL.COM '), 'talib@gmail.com');
    });
    t('Unsubscribe token is tamper-proof', function () {
      var tok = UnsubscribeManager.token('a@b.com');
      var e64 = UnsubscribeManager.b64url_('a@b.com');
      eq(UnsubscribeManager.verify(e64, tok), 'a@b.com');
      ok(UnsubscribeManager.verify(UnsubscribeManager.b64url_('x@b.com'), tok) === null, 'forged link accepted');
    });
    t('Content is sent exactly as written', function () {
      var html = '<p>Hello <b>World</b> 👉 <a href="https://x.y/z?a=1&b=2">Link</a></p>';
      var plain = 'Hello World\n\nLine 2 — “quotes” & 👉 emoji';
      var msg = EmailContentManager.build({ subject: 'Subj ✓', htmlBody: html, plainBody: plain, signature: 'Sig\nLine', format: 'HTML' }, {}, { settings: settings, unsubscribeUrl: 'https://example.com/u' });
      ok(msg.htmlBody.indexOf(html) === 0, 'HTML body altered');
      ok(msg.plainBody.indexOf(plain) === 0, 'Plain body altered');
      eq(msg.subject, 'Subj ✓');
    });
    t('Error classification', function () {
      ok(ErrorHandler.classifySendError(new Error('Invalid email: foo')).permanent, 'invalid not permanent');
      ok(ErrorHandler.classifySendError(new Error('Service invoked too many times for one day: email.')).quotaExhausted, 'quota not detected');
      ok(ErrorHandler.classifySendError(new Error('Service unavailable')).temporary, 'temporary not detected');
    });
    t('Schedule estimate respects daily limit & days', function () {
      var c = { 'Daily Limit': 8, 'Start Date': '2030-01-07', 'Sending Days': 'Mon,Tue,Wed,Thu,Fri', 'Send Time': '09:00' };
      var d = EmailScheduler.estimateDates(c, 20, 0, settings, new Date('2030-01-01T05:00:00Z'));
      eq([d[0], d[7], d[8], d[16], d[19]], ['2030-01-07', '2030-01-07', '2030-01-08', '2030-01-09', '2030-01-09']);
    });
    t('No duplicate queue entries', function () {
      var q = Db.read(APP.SHEETS.QUEUE);
      var keys = {}, emails = {}, dup = [];
      q.rows.forEach(function (r) {
        var k = r['Queue Key'], e = String(r['Campaign ID']) + '|' + ContactManager.normalizeEmail(r['Email Address']);
        if (keys[k] || emails[e]) dup.push(k);
        keys[k] = true; emails[e] = true;
      });
      ok(!dup.length, 'Duplicates: ' + dup.slice(0, 10).join(', '));
      return q.rows.length + ' queue rows checked';
    });
    t('Nobody emailed twice in the same campaign', function () {
      var q = Db.read(APP.SHEETS.QUEUE), seen = {}, dup = [];
      q.rows.forEach(function (r) {
        if (r['Status'] !== APP.QUEUE_STATUS.SENT && r['Status'] !== APP.QUEUE_STATUS.BOUNCED) return;
        var k = r['Campaign ID'] + '|' + ContactManager.normalizeEmail(r['Email Address']);
        if (seen[k]) dup.push(k); seen[k] = true;
      });
      ok(!dup.length, dup.join(', '));
    });
    t('Unsubscribed contacts have nothing pending', function () {
      var c = ContactManager.read(), unsub = {};
      c.rows.forEach(function (r) { if (String(r['Unsubscribe Status']).indexOf('Unsub') === 0) unsub[String(r['Contact ID'])] = true; });
      var bad = Db.read(APP.SHEETS.QUEUE).rows.filter(function (q) { return unsub[String(q['Contact ID'])] && (q['Status'] === 'Pending' || q['Status'] === 'Retry'); });
      ok(!bad.length, bad.length + ' pending items for unsubscribed contacts (they will be skipped at send time; run the scheduler to clean up)');
    });
    t('Content ready for sending', function () {
      var list = EmailContentManager.list();
      ok(list.length, 'No content yet');
      var ready = list.filter(function (c) { return c.status === 'Ready'; });
      ok(ready.length, 'No content is marked Ready yet (open the Content Editor)');
      ready.forEach(function (c) { var p = EmailContentManager.validate(EmailContentManager.get(c.id)); ok(!p.length, c.id + ': ' + p.join(' ')); });
      return ready.length + ' ready';
    });
    t('Unsubscribe web app', function () {
      if (!settings.unsubWebAppUrl) throw new Error('Not configured — emails use reply-to-unsubscribe. Recommended: deploy the web app (setup guide step 6).');
      return settings.unsubWebAppUrl;
    });

    var sh = Db.sheet(APP.SHEETS.TESTS);
    var now = new Date();
    var rows = out.map(function (r) { return [now, r.test, r.result, Util.truncate(r.detail, 500)]; });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
    return out;
  }
};
