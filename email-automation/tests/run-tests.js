/**
 * Offline end-to-end tests for the Apps Script code, using gas-mock.js.
 *   node email-automation/tests/run-tests.js
 * Simulates real days/times in Dubai and checks daily limits, scheduling,
 * duplicate prevention, pause/resume, failures, retries, crash recovery,
 * unsubscribe, bounces, test mode and campaign completion.
 */
'use strict';
const assert = require('assert');
const { createEnv } = require('./gas-mock');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const plain = x => JSON.parse(JSON.stringify(x)); // values from the vm realm

// ---------------------------------------------------------------- helpers
function setupWithContacts(n, opts = {}) {
  const env = createEnv(opts);
  const g = env.g;
  g.Setup.run();
  const rows = [['Email']];
  for (let i = 1; i <= n; i++) rows.push([`contact${i}@company${i}.ae`]);
  const summary = g.ContactManager.importRows(rows, 'test');
  // Mark seeded content Ready (owner action after review)
  const c = g.EmailContentManager.get('CT-001');
  c.status = 'Ready';
  g.EmailContentManager.save(c);
  return { env, g, summary };
}

function startCampaign(g, extra = {}) {
  const id = g.CampaignManager.create(Object.assign({ name: 'Test campaign', contentId: 'CT-001', target: 'ALL', startDate: '2026-11-16', sendTime: '09:00', dailyLimit: 8, sendingDays: 'Mon,Tue,Wed,Thu,Fri' }, extra));
  g.CampaignManager.start(id);
  return id;
}

/** Runs the scheduler every `interval` minutes from `from` to `to` (Dubai local). */
function runDay(env, day, from = '07:00', to = '19:00', interval = 10) {
  env.setDubai(`${day} ${from}`);
  const end = Date.parse(`${day}T${to}:00+04:00`);
  let sent = 0;
  while (env.clock.now <= end) {
    const s = env.g.EmailScheduler.run();
    sent += s.sent || 0;
    env.advanceMinutes(interval);
  }
  return sent;
}

function queue(env, cid) { return env.sheetRows('Campaign Queue').filter(q => !cid || q['Campaign ID'] === cid); }
function sentTo(env, email) { return env.gmail.sent.filter(m => m.to === email).length; }

// ---------------------------------------------------------------- tests

test('Setup creates all sheets, settings, triggers and seeds content as Draft (unchanged)', () => {
  const env = createEnv();
  const g = env.g;
  g.Setup.run();
  Object.values(g.APP.SHEETS).forEach(n => assert.ok(env.ss.getSheetByName(n), 'missing sheet ' + n));
  assert.strictEqual(env.ss.getSheetByName('Sheet1'), null);
  assert.strictEqual(env.ss.getSpreadsheetTimeZone(), 'Asia/Dubai');
  assert.deepStrictEqual(env.triggers.map(t => t.fn).sort(), ['dailyMaintenanceTick', 'inboxTick', 'schedulerTick']);
  const hdr = g.Db.read('Contacts').headers;
  ['Contact ID', 'Company Name', 'Contact Person', 'Email Address', 'Building Name', 'Campaign Status', 'Email Sent Count',
    'Last Email Sent Date', 'Next Scheduled Date', 'Delivery Status', 'Unsubscribe Status', 'Error Log'].forEach((h, i) => assert.strictEqual(hdr[i], h));
  const c = g.EmailContentManager.get('CT-001');
  assert.strictEqual(c.status, 'Draft');
  assert.strictEqual(c.subject, g.SEED_CONTENT.subject);
  assert.strictEqual(c.plainBody, g.SEED_CONTENT.plainBody);
  assert.strictEqual(c.htmlBody, g.SEED_CONTENT.htmlBody);
  assert.strictEqual(c.signature, g.SEED_CONTENT.signature);
  // idempotent
  g.Setup.run();
  assert.strictEqual(g.EmailContentManager.list().length, 1);
  assert.strictEqual(env.triggers.length, 3);
});

test('Import: validates, de-duplicates, assigns IDs, keeps suppression', () => {
  const env = createEnv();
  const g = env.g;
  g.Setup.run();
  g.UnsubscribeManager.addSuppression('blocked@x.ae', 'test', 'test');
  const s = g.ContactManager.importRows([['Email', 'Company'], ['A@One.ae', 'One'], ['a@one.ae', 'dup'], ['@', ''], ['b@two.ae', 'Two'], ['blocked@x.ae', '']], 'file');
  assert.deepStrictEqual([s.added, s.duplicates, s.invalid, s.suppressed], [3, 1, 1, 1]);
  const rows = env.sheetRows('Contacts');
  assert.deepStrictEqual(plain(rows.map(r => r['Contact ID'])), ['C0001', 'C0002', 'C0003']);
  assert.strictEqual(rows[0]['Email Address'], 'a@one.ae');
  assert.strictEqual(rows[2]['Unsubscribe Status'], 'Unsubscribed');
  const again = g.ContactManager.importRows([['a@one.ae'], ['c@three.ae']], 'file2'); // header-less file
  assert.deepStrictEqual([again.added, again.duplicates], [1, 1]);
});

test('Campaign cannot start while content is Draft', () => {
  const env = createEnv();
  const g = env.g;
  g.Setup.run();
  g.ContactManager.importRows([['Email'], ['a@b.ae']], 't');
  const id = g.CampaignManager.create({ name: 'x', contentId: 'CT-001', target: 'ALL' });
  assert.throws(() => g.CampaignManager.start(id), /Draft/);
});

test('Daily limit of 8, sending days Mon–Fri, send time respected, no duplicates, completes', () => {
  const { env, g } = setupWithContacts(30);
  const id = startCampaign(g);
  // Monday before 09:00 → nothing
  env.setDubai('2026-11-16 08:50');
  assert.strictEqual(g.EmailScheduler.run().sent, 0);
  assert.strictEqual(runDay(env, '2026-11-16'), 8, 'Mon');
  assert.strictEqual(runDay(env, '2026-11-17'), 8, 'Tue');
  assert.strictEqual(runDay(env, '2026-11-18'), 8, 'Wed');
  assert.strictEqual(runDay(env, '2026-11-21'), 0, 'Sat (not a sending day)');
  assert.strictEqual(runDay(env, '2026-11-22'), 0, 'Sun');
  assert.strictEqual(runDay(env, '2026-11-19'), 6, 'Thu sends the remaining 6');
  // every contact exactly once
  for (let i = 1; i <= 30; i++) assert.strictEqual(sentTo(env, `contact${i}@company${i}.ae`), 1, 'contact ' + i);
  // first email went out at/after 09:00 Dubai
  const firstHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(env.gmail.sent[0].date));
  assert.ok(firstHour >= '09:00', 'first send at ' + firstHour);
  const c = g.CampaignManager.find(g.CampaignManager.read(), id);
  assert.strictEqual(c['Status'], 'Completed');
  assert.strictEqual(c['Sent'], 30);
  assert.ok(env.notifications.some(n => /Campaign completed/.test(n.subject)));
  // contact columns updated
  const contact = env.sheetRows('Contacts')[0];
  assert.strictEqual(contact['Email Sent Count'], 1);
  assert.strictEqual(contact['Delivery Status'], 'Sent');
  assert.ok(contact['Last Email Sent Date'] instanceof Date);
  assert.ok(/Emailed \(CMP-001\)/.test(contact['Campaign Status']));
});

test('Emails are spread out: at most MAX_EMAILS_PER_RUN per run', () => {
  const { env, g } = setupWithContacts(20);
  startCampaign(g);
  env.setDubai('2026-11-16 09:00');
  assert.strictEqual(g.EmailScheduler.run().sent, 2);
});

test('Daily limit change and send-time change take effect', () => {
  const { env, g } = setupWithContacts(40);
  const id = startCampaign(g);
  assert.strictEqual(runDay(env, '2026-11-16'), 8);
  g.CampaignManager.updateSettings(id, { dailyLimit: 3, sendTime: '14:00' });
  env.setDubai('2026-11-17 13:50');
  assert.strictEqual(g.EmailScheduler.run().sent, 0, 'before new send time');
  assert.strictEqual(runDay(env, '2026-11-17'), 3);
});

test('Pause stops sending immediately; resume continues; stop cancels the rest', () => {
  const { env, g } = setupWithContacts(30);
  const id = startCampaign(g);
  env.setDubai('2026-11-16 09:00');
  g.EmailScheduler.run();
  g.CampaignManager.pause(id);
  assert.strictEqual(runDay(env, '2026-11-16', '09:10'), 0, 'paused');
  g.CampaignManager.resume(id);
  assert.strictEqual(runDay(env, '2026-11-17'), 8, 'resumed');
  const n = g.CampaignManager.stop(id);
  assert.strictEqual(n, 30 - 2 - 8);
  assert.strictEqual(runDay(env, '2026-11-18'), 0, 'stopped');
  assert.strictEqual(queue(env, id).filter(q => q.Status === 'Cancelled').length, n);
});

test('Permanent failure → Failed (no retry); temporary failure → retried later and sent once', () => {
  const { env, g } = setupWithContacts(10);
  const id = startCampaign(g);
  let tempFails = 0;
  env.gmail.behavior = (to) => {
    if (to === 'contact1@company1.ae') return 'throw:Invalid email: contact1@company1.ae';
    if (to === 'contact2@company2.ae' && tempFails < 1) { tempFails++; return 'throw:Service unavailable. Try again later.'; }
    return 'ok';
  };
  runDay(env, '2026-11-16');
  runDay(env, '2026-11-17');
  const q = queue(env, id);
  assert.strictEqual(q.find(x => x['Email Address'] === 'contact1@company1.ae').Status, 'Failed');
  const q2 = q.find(x => x['Email Address'] === 'contact2@company2.ae');
  assert.strictEqual(q2.Status, 'Sent');
  assert.strictEqual(q2.Attempts, 2);
  assert.strictEqual(sentTo(env, 'contact2@company2.ae'), 1);
  assert.strictEqual(sentTo(env, 'contact1@company1.ae'), 0);
  const c1 = env.sheetRows('Contacts')[0];
  assert.strictEqual(c1['Delivery Status'], 'Failed');
  assert.ok(String(c1['Error Log']).includes('Invalid email'));
});

test('Error AFTER Gmail actually sent → verified in Sent folder, never sent twice', () => {
  const { env, g } = setupWithContacts(5);
  const id = startCampaign(g);
  let once = false;
  env.gmail.behavior = (to) => {
    if (to === 'contact1@company1.ae' && !once) { once = true; return 'sent-then-throw:Exception: Request timed out'; }
    return 'ok';
  };
  runDay(env, '2026-11-16');
  runDay(env, '2026-11-17');
  assert.strictEqual(sentTo(env, 'contact1@company1.ae'), 1);
  const item = queue(env, id).find(x => x['Email Address'] === 'contact1@company1.ae');
  assert.strictEqual(item.Status, 'Sent');
  assert.ok(/Confirmed in Gmail Sent/.test(item.Error));
});

test('Crash recovery: items left in "Sending" are resolved via the Sent folder', () => {
  const { env, g } = setupWithContacts(4);
  const id = startCampaign(g);
  env.setDubai('2026-11-16 09:00');
  const q = g.Db.read('Campaign Queue');
  const [a, b] = q.rows;
  const lastAttempt = new env.FakeDate(env.clock.now - 10 * 60000);
  // a: the execution died right AFTER Gmail sent it
  g.Db.update(q, a, { Status: 'Sending', Attempts: 1, 'Last Attempt At': lastAttempt, Error: 'In flight → ' + a['Email Address'] });
  env.gmail.sent.push({ id: 'Mx', to: a['Email Address'], subject: g.SEED_CONTENT.subject, date: lastAttempt.getTime() });
  // b: the execution died BEFORE Gmail sent it
  g.Db.update(q, b, { Status: 'Sending', Attempts: 1, 'Last Attempt At': lastAttempt, Error: 'In flight → ' + b['Email Address'] });
  runDay(env, '2026-11-16', '09:00');
  assert.strictEqual(sentTo(env, a['Email Address']), 1, 'a not re-sent');
  assert.strictEqual(sentTo(env, b['Email Address']), 1, 'b sent exactly once');
  const after = queue(env, id);
  assert.ok(after.every(x => x.Status === 'Sent'), JSON.stringify(after.map(x => x.Status)));
  assert.ok(/Recovered after interruption/.test(after.find(x => x['Queue Key'] === a['Queue Key']).Error));
});

test('Overlapping executions are prevented by the lock', () => {
  const { env, g } = setupWithContacts(5);
  startCampaign(g);
  env.setDubai('2026-11-16 09:00');
  env.lock.external = true;
  assert.strictEqual(g.EmailScheduler.run().skipped, 'locked');
  assert.strictEqual(env.gmail.sent.length, 0);
  env.lock.external = false;
  assert.strictEqual(g.EmailScheduler.run().sent, 2);
});

test('Unsubscribe link: signed, tamper-proof, stops all future sends', () => {
  const { env, g } = setupWithContacts(10);
  g.Config.set('UNSUBSCRIBE_WEB_APP_URL', 'https://script.google.com/macros/s/TEST/exec');
  const id = startCampaign(g);
  runDay(env, '2026-11-16');
  const first = env.gmail.sent[0];
  const m = first.options.htmlBody.match(/href="([^"]*a=unsubscribe[^"]*)"/);
  assert.ok(m, 'unsubscribe link in email');
  const url = new URL(m[1].replace(/&amp;/g, '&'));
  assert.throws(() => g.webConfirmUnsubscribe(url.searchParams.get('e'), 'forged-token', id));
  g.webConfirmUnsubscribe(url.searchParams.get('e'), url.searchParams.get('t'), id);
  const who = g.ContactManager.normalizeEmail(Buffer.from(url.searchParams.get('e').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  assert.strictEqual(who, first.to);
  const contact = env.sheetRows('Contacts').find(r => r['Email Address'] === who);
  assert.strictEqual(contact['Unsubscribe Status'], 'Unsubscribed');
  // unsubscribe a contact that is still pending
  g.UnsubscribeManager.unsubscribe('contact10@company10.ae', 'test', id);
  runDay(env, '2026-11-17');
  assert.strictEqual(sentTo(env, 'contact10@company10.ae'), 0);
  assert.strictEqual(queue(env, id).find(q => q['Email Address'] === 'contact10@company10.ae').Status, 'Skipped');
  // a later campaign never includes unsubscribed people
  const id2 = g.CampaignManager.create({ name: 'Second', contentId: 'CT-001', target: 'ALL' });
  g.CampaignManager.start(id2);
  assert.ok(!queue(env, id2).some(q => q['Email Address'] === who || q['Email Address'] === 'contact10@company10.ae'));
});

test('Unsubscribe reply and bounce notifications are processed from Gmail', () => {
  const { env, g } = setupWithContacts(10);
  const id = startCampaign(g);
  runDay(env, '2026-11-16');
  env.gmail.inbox.push({ labels: [], messages: [{ from: 'Someone <contact1@company1.ae>', subject: 'Re: Action Required', body: 'Please unsubscribe me.\n\n> quoted' }] });
  env.gmail.inbox.push({ labels: [], bounce: true, messages: [{ from: 'Mail Delivery Subsystem <mailer-daemon@googlemail.com>', subject: 'Delivery Status Notification (Failure)', body: "Address not found. Your message wasn't delivered to contact2@company2.ae", headers: { 'X-Failed-Recipients': 'contact2@company2.ae' } }] });
  const r = g.UnsubscribeManager.processInbox();
  assert.deepStrictEqual([r.bounces, r.unsubscribes], [1, 1]);
  const rows = env.sheetRows('Contacts');
  assert.strictEqual(rows[0]['Unsubscribe Status'], 'Unsubscribed');
  assert.strictEqual(rows[1]['Delivery Status'], 'Bounced');
  assert.strictEqual(queue(env, id).find(q => q['Email Address'] === 'contact2@company2.ae').Status, 'Bounced');
  // processed once only
  const r2 = g.UnsubscribeManager.processInbox();
  assert.deepStrictEqual([r2.bounces, r2.unsubscribes], [0, 0]);
});

test('Multiple campaigns keep separate statuses; same contact not emailed twice within MIN_DAYS', () => {
  const { env, g } = setupWithContacts(6);
  const a = startCampaign(g, { name: 'A', dailyLimit: 6 });
  runDay(env, '2026-11-16'); // all 6 get campaign A
  const b = startCampaign(g, { name: 'B', dailyLimit: 6, startDate: '2026-11-16' });
  assert.strictEqual(runDay(env, '2026-11-17'), 0, 'within 7 days → deferred');
  assert.strictEqual(queue(env, b).filter(q => q.Status === 'Pending').length, 6);
  assert.strictEqual(queue(env, a).filter(q => q.Status === 'Sent').length, 6);
  assert.strictEqual(runDay(env, '2026-11-23'), 6, 'after 7 days campaign B sends');
  for (let i = 1; i <= 6; i++) assert.strictEqual(sentTo(env, `contact${i}@company${i}.ae`), 2);
  // re-building the queue never duplicates
  assert.throws(() => g.CampaignManager.addNewContacts(b), /Completed/);
});

test('Adding new contacts to a running campaign; no duplicate queue rows', () => {
  const { env, g } = setupWithContacts(5);
  const id = startCampaign(g);
  g.ContactManager.importRows([['Email'], ['new1@x.ae'], ['contact1@company1.ae']], 'later');
  const r1 = g.CampaignManager.addNewContacts(id);
  const r2 = g.CampaignManager.addNewContacts(id);
  assert.deepStrictEqual([r1.added, r2.added], [1, 0]);
  assert.strictEqual(queue(env, id).length, 6);
});

test('Permission & suppression: "Do Not Contact" contacts are never queued or sent', () => {
  const env = createEnv();
  const g = env.g;
  g.Setup.run();
  g.ContactManager.importRows([['Email', 'Permission'], ['ok@x.ae', ''], ['no@x.ae', 'Do Not Contact']], 't');
  g.UnsubscribeManager.addSuppression('@blocked.ae', 'domain', 'test');
  g.ContactManager.importRows([['Email'], ['someone@blocked.ae']], 't');
  const c = g.EmailContentManager.get('CT-001'); c.status = 'Ready'; g.EmailContentManager.save(c);
  const id = startCampaign(g);
  runDay(env, '2026-11-16');
  assert.deepStrictEqual(env.gmail.sent.map(m => m.to), ['ok@x.ae']);
  assert.strictEqual(queue(env, id).length, 1);
});

test('Gmail quota and global daily cap are respected', () => {
  const { env, g } = setupWithContacts(50);
  startCampaign(g, { dailyLimit: 30 });
  env.gmail.dailyQuota = 15; env.gmail.quota = 15; // reserve is 10 → only 5 may be used
  assert.strictEqual(runDay(env, '2026-11-16'), 5);
  env.gmail.dailyQuota = 100;
  g.Config.set('GLOBAL_DAILY_CAP', '12');
  assert.strictEqual(runDay(env, '2026-11-17'), 12);
});

test('Test mode redirects every email to the test address and leaves contacts untouched', () => {
  const { env, g } = setupWithContacts(3);
  g.Config.set('TEST_MODE', 'Yes');
  g.Config.set('TEST_RECIPIENT', 'tester@example.com');
  startCampaign(g);
  runDay(env, '2026-11-16');
  assert.strictEqual(env.gmail.sent.length, 3);
  assert.ok(env.gmail.sent.every(m => m.to === 'tester@example.com' && /^\[TEST for contact\d@/.test(m.subject)));
  assert.ok(env.sheetRows('Contacts').every(r => r['Email Sent Count'] === 0));
});

test('Email content is delivered exactly as written + signature + unsubscribe footer', () => {
  const { env, g } = setupWithContacts(1);
  startCampaign(g);
  runDay(env, '2026-11-16');
  const m = env.gmail.sent[0];
  const S = g.SEED_CONTENT;
  assert.strictEqual(m.subject, S.subject);
  assert.ok(m.options.htmlBody.startsWith(S.htmlBody), 'HTML body verbatim');
  assert.ok(m.plainBody.startsWith(S.plainBody), 'plain body verbatim');
  assert.ok(m.plainBody.includes(S.signature), 'signature');
  assert.ok(m.options.htmlBody.includes('Civic Design Architects &amp; Engineers<br>📍 Admin Office #01'), 'signature html');
  assert.ok(/unsubscribe/i.test(m.plainBody.split('--').pop()), 'footer');
  assert.strictEqual(m.options.name, S.senderName);
  assert.strictEqual(m.options.replyTo, S.replyTo);
});

test('End date: campaign completes and remaining recipients are not sent', () => {
  const { env, g } = setupWithContacts(20);
  const id = startCampaign(g, { endDate: '2026-11-17' });
  runDay(env, '2026-11-16');
  runDay(env, '2026-11-17');
  runDay(env, '2026-11-18');
  assert.strictEqual(env.gmail.sent.length, 16);
  const c = g.CampaignManager.find(g.CampaignManager.read(), id);
  assert.strictEqual(c.Status, 'Completed');
  assert.strictEqual(queue(env, id).filter(q => q.Status === 'Cancelled').length, 4);
});

test('Scheduled start date in the future: nothing sent before, then auto-activates', () => {
  const { env, g } = setupWithContacts(5);
  const id = startCampaign(g, { startDate: '2026-11-18' });
  assert.strictEqual(g.CampaignManager.find(g.CampaignManager.read(), id).Status, 'Scheduled');
  assert.strictEqual(runDay(env, '2026-11-16'), 0);
  assert.strictEqual(runDay(env, '2026-11-18'), 5);
});

test('Dashboard + Next Scheduled Date + estimated finish are computed', () => {
  const { env, g } = setupWithContacts(20);
  const id = startCampaign(g);
  runDay(env, '2026-11-16');
  g.DashboardManager.refresh();
  const dash = env.ss.getSheetByName('Dashboard');
  assert.strictEqual(dash.getRange('B6').getValue(), 20); // total contacts
  assert.strictEqual(dash.getRange('C6').getValue(), 8);  // total sent
  assert.strictEqual(dash.getRange('D6').getValue(), 12); // pending
  const contacts = env.sheetRows('Contacts');
  const pendingOne = contacts.find(r => r['Email Address'] === 'contact9@company9.ae');
  assert.ok(pendingOne['Next Scheduled Date'] instanceof Date);
  assert.strictEqual(g.Util.dayKey(pendingOne['Next Scheduled Date']), '2026-11-17');
  const last = contacts.find(r => r['Email Address'] === 'contact20@company20.ae');
  assert.strictEqual(g.Util.dayKey(last['Next Scheduled Date']), '2026-11-18');
  const c = g.CampaignManager.find(g.CampaignManager.read(), id);
  assert.strictEqual(g.Util.dayKey(c['Est. Finish Date']), '2026-11-18');
});

test('Rows deleted by hand mid-run never cause writes to the wrong contact', () => {
  const { env, g } = setupWithContacts(3);
  const t = g.ContactManager.read();
  const third = t.rows[2];
  env.ss.getSheetByName('Contacts').deleteRow(2); // user deletes C0001 by hand
  g.Db.update(t, third, { Notes: 'hello' });
  const rows = env.sheetRows('Contacts');
  assert.strictEqual(rows.find(r => r['Contact ID'] === 'C0003').Notes, 'hello');
  assert.strictEqual(rows.find(r => r['Contact ID'] === 'C0002').Notes, '');
});

test('Built-in self-tests pass (except optional web-app check)', () => {
  const { g } = setupWithContacts(3);
  const res = g.SelfTests.runAll();
  const failed = res.filter(r => r.result !== 'PASS' && r.test !== 'Unsubscribe web app');
  assert.deepStrictEqual(plain(failed), []);
});

test('Full scale: 351 contacts at 8/day finish in 44 sending days, each emailed once', () => {
  const { env, g } = setupWithContacts(351);
  const id = startCampaign(g);
  let day = '2026-11-16', guard = 0;
  while (g.CampaignManager.find(g.CampaignManager.read(), id).Status !== 'Completed' && guard++ < 120) {
    runDay(env, day, '08:55', '10:00', 10);
    day = g.Util.addDaysKey(day, 1);
  }
  assert.strictEqual(env.gmail.sent.length, 351);
  assert.strictEqual(new Set(env.gmail.sent.map(m => m.to)).size, 351);
  const perDay = {};
  env.gmail.sent.forEach(m => { const k = g.Util.dayKey(new Date(m.date)); perDay[k] = (perDay[k] || 0) + 1; });
  assert.ok(Object.values(perDay).every(n => n <= 8));
  assert.strictEqual(Object.keys(perDay).length, 44);
  assert.ok(Object.keys(perDay).every(k => !['Sat', 'Sun'].includes(g.Util.weekdayOfKey(k))));
});

// ---------------------------------------------------------------- runner
(async () => {
  let pass = 0, fail = 0;
  for (const t of tests) {
    try { await t.fn(); pass++; console.log('  ✔ ' + t.name); }
    catch (e) { fail++; console.log('  ✘ ' + t.name + '\n      ' + (e.stack || e).split('\n').slice(0, 4).join('\n      ')); }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
