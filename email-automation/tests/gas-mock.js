/**
 * Minimal in-memory simulation of the Google Apps Script services used by the
 * system (SpreadsheetApp, GmailApp, MailApp, LockService, PropertiesService,
 * ScriptApp, Utilities, Session) with a controllable clock. Used only for
 * offline testing — it is NOT deployed to Google.
 */
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createEnv(opts = {}) {
  const clock = { now: Date.parse(opts.start || '2026-11-16T04:00:00Z') }; // Mon 08:00 Dubai
  const RealDate = Date;
  class FakeDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(clock.now); else super(...a); }
    static now() { return clock.now; }
  }
  FakeDate.UTC = RealDate.UTC;
  FakeDate.parse = RealDate.parse;

  // ------------------------------------------------------------- chainable no-op
  const noop = () => new Proxy(function () {}, {
    get: (t, p) => (p === 'build' ? () => ({}) : (...args) => noop()),
    apply: () => noop()
  });

  // ------------------------------------------------------------- Sheets
  function a1ToRC(a1) {
    const m = a1.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/);
    const col = s => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
    const r1 = +m[2], c1 = col(m[1]);
    const r2 = m[3] ? +m[4] : r1, c2 = m[3] ? col(m[3]) : c1;
    return [r1, c1, r2 - r1 + 1, c2 - c1 + 1];
  }

  class Range {
    constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr: nr || 1, nc: nc || 1 }); }
    getValues() {
      const out = [];
      for (let i = 0; i < this.nr; i++) {
        const row = [];
        for (let j = 0; j < this.nc; j++) row.push(this.sheet._get(this.r + i, this.c + j));
        out.push(row);
      }
      return out;
    }
    getValue() { return this.sheet._get(this.r, this.c); }
    setValues(v) {
      if (v.length !== this.nr || v[0].length !== this.nc) throw new Error(`setValues size mismatch ${v.length}x${v[0].length} vs ${this.nr}x${this.nc}`);
      v.forEach((row, i) => row.forEach((x, j) => this.sheet._set(this.r + i, this.c + j, x)));
      return this;
    }
    setValue(x) { this.sheet._set(this.r, this.c, x); return this; }
    setFormulas(f) { return this.setValues(f); }
    clearContent() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet._set(this.r + i, this.c + j, ''); return this; }
    insertCheckboxes() { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) if (this.sheet._get(this.r + i, this.c + j) === '') this.sheet._set(this.r + i, this.c + j, false); return this; }
    getRow() { return this.r; }
  }
  // all formatting methods are no-ops returning the range
  ['setFontWeight', 'setBackground', 'setFontColor', 'setVerticalAlignment', 'setWrap', 'setNumberFormat', 'setDataValidation',
    'setHorizontalAlignment', 'setFontSize', 'setFontStyle', 'setFontFamily', 'setBorder', 'merge', 'setWrapStrategy'].forEach(m => {
    Range.prototype[m] = function () { return this; };
  });

  class Sheet {
    constructor(ss, name) { this.ss = ss; this.name = name; this.data = []; this.maxRows = 1000; this.maxCols = 26; this.protections = []; }
    _get(r, c) { const row = this.data[r - 1]; const v = row ? row[c - 1] : undefined; return v === undefined ? '' : v; }
    _set(r, c, v) {
      if (typeof v === 'string' && v.charAt(0) === "'") v = v.slice(1);
      while (this.data.length < r) this.data.push([]);
      const row = this.data[r - 1];
      while (row.length < c) row.push('');
      row[c - 1] = v;
      if (r > this.maxRows) this.maxRows = r;
      if (c > this.maxCols) this.maxCols = c;
    }
    getName() { return this.name; }
    getLastRow() {
      for (let r = this.data.length; r >= 1; r--) if ((this.data[r - 1] || []).some(v => v !== '' && v !== undefined && v !== null)) return r;
      return 0;
    }
    getLastColumn() {
      let m = 0;
      this.data.forEach(row => { for (let c = row.length; c >= 1; c--) if (row[c - 1] !== '' && row[c - 1] !== undefined) { m = Math.max(m, c); break; } });
      return m;
    }
    getMaxRows() { return this.maxRows; }
    getMaxColumns() { return this.maxCols; }
    insertRowsAfter(after, n) { this.maxRows += n; }
    getRange(a, b, c, d) { if (typeof a === 'string') { const [r, cc, nr, nc] = a1ToRC(a); return new Range(this, r, cc, nr, nc); } return new Range(this, a, b, c, d); }
    appendRow(arr) { const r = this.getLastRow() + 1; arr.forEach((v, i) => this._set(r, i + 1, v)); return this; }
    deleteRow(r) { this.data.splice(r - 1, 1); }
    deleteRows(r, n) { this.data.splice(r - 1, n); }
    clear() { this.data = []; return this; }
    protect() { const p = noop(); this.protections.push(p); return p; }
    getProtections() { return this.protections; }
    getActiveRange() { return new Range(this, 1, 1); }
  }
  ['setFrozenRows', 'setColumnWidth', 'setRowHeight', 'setConditionalFormatRules', 'setHiddenGridlines'].forEach(m => {
    Sheet.prototype[m] = function () { return this; };
  });

  class Spreadsheet {
    constructor() { this.sheets = [new Sheet(this, 'Sheet1')]; this.tz = 'Etc/GMT'; this.active = this.sheets[0]; }
    getSheetByName(n) { return this.sheets.find(s => s.name === n) || null; }
    insertSheet(n, idx) { const s = new Sheet(this, n); this.sheets.splice(idx === undefined ? this.sheets.length : idx, 0, s); return s; }
    getSheets() { return this.sheets.slice(); }
    deleteSheet(s) { this.sheets = this.sheets.filter(x => x !== s); }
    getId() { return 'SPREADSHEET_ID_TEST'; }
    getUrl() { return 'https://docs.google.com/spreadsheets/d/TEST'; }
    getSpreadsheetTimeZone() { return this.tz; }
    setSpreadsheetTimeZone(t) { this.tz = t; }
    setActiveSheet(s) { this.active = s; return s; }
    getActiveSheet() { return this.active; }
  }
  const ss = new Spreadsheet();

  const SpreadsheetApp = {
    getActiveSpreadsheet: () => ss,
    openById: () => ss,
    flush: () => { env.stats.flushes++; },
    getUi: () => { throw new Error('No UI in tests'); },
    newDataValidation: () => noop(),
    newConditionalFormatRule: () => noop(),
    BorderStyle: { SOLID_THICK: 'SOLID_THICK' },
    WrapStrategy: { CLIP: 'CLIP' },
    ProtectionType: { SHEET: 'SHEET' }
  };

  // ------------------------------------------------------------- Gmail
  const gmail = {
    sent: [],          // {id, to, subject, plainBody, options, date}
    inbox: [],         // threads: {messages:[{from, subject, body, headers}], labels:[]}
    behavior: () => 'ok', // (to, subject) => 'ok' | 'throw:<msg>' | 'sent-then-throw:<msg>'
    quota: 100,
    dailyQuota: 100,   // resets every (UTC) day like Gmail's rolling quota
    quotaDay: ''
  };
  function quotaNow() {
    const d = new Date(clock.now).toISOString().slice(0, 10);
    if (d !== gmail.quotaDay) { gmail.quotaDay = d; gmail.quota = gmail.dailyQuota; }
    return gmail.quota;
  }
  let msgSeq = 0;
  function makeMessage(m) {
    return {
      getId: () => m.id, getThread: () => ({ getId: () => 'T' + m.id }), getDate: () => new FakeDate(m.date),
      getTo: () => m.to, getCc: () => '', getBcc: () => '', getSubject: () => m.subject,
      getFrom: () => m.from || 'owner@example.com', getPlainBody: () => m.body || m.plainBody || '',
      getHeader: h => (m.headers || {})[h] || ''
    };
  }
  const GmailApp = {
    createDraft(to, subject, body, options) {
      return {
        send() {
          const b = gmail.behavior(to, subject);
          if (b.startsWith('throw:')) throw new Error(b.slice(6));
          if (quotaNow() <= 0) throw new Error('Service invoked too many times for one day: email.');
          const m = { id: 'M' + (++msgSeq), to, subject, plainBody: body, options, date: clock.now };
          gmail.sent.push(m);
          gmail.quota--;
          if (b.startsWith('sent-then-throw:')) throw new Error(b.slice(16));
          return makeMessage(m);
        },
        deleteDraft() {}
      };
    },
    search(q) {
      const sentM = q.match(/in:sent to:(\S+) after:(\d+)/);
      if (sentM) {
        const after = +sentM[2] * 1000;
        return gmail.sent.filter(m => m.to.toLowerCase() === sentM[1].toLowerCase() && m.date >= after)
          .map(m => ({ getMessages: () => [makeMessage(m)] }));
      }
      const isBounce = /mailer-daemon/.test(q);
      return gmail.inbox.filter(t => !t.labels.includes('Email Automation/Processed') && (!!t.bounce === isBounce))
        .map(t => ({ getMessages: () => t.messages.map(makeMessage), addLabel: () => t.labels.push('Email Automation/Processed') }));
    },
    getUserLabelByName: () => null,
    createLabel: n => ({ name: n })
  };
  const notifications = [];
  const MailApp = {
    getRemainingDailyQuota: () => quotaNow(),
    sendEmail: (to, subject, body) => { notifications.push({ to, subject, body }); quotaNow(); gmail.quota--; }
  };

  // ------------------------------------------------------------- misc services
  const props = {};
  const PropertiesService = { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); } }) };
  const lock = { held: false, external: false };
  const LockService = {
    getScriptLock: () => ({
      tryLock: () => { if (lock.held || lock.external) return false; lock.held = true; return true; },
      waitLock: () => { if (lock.held || lock.external) throw new Error('lock timeout'); lock.held = true; },
      releaseLock: () => { lock.held = false; }
    })
  };
  const triggers = [];
  const ScriptApp = {
    getProjectTriggers: () => triggers.slice(),
    deleteTrigger: t => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
    newTrigger: fn => {
      const t = { fn, getHandlerFunction: () => fn };
      const chain = new Proxy({}, { get: (o, p) => (p === 'create' ? () => { triggers.push(t); return t; } : () => chain) });
      return chain;
    },
    getService: () => ({ getUrl: () => 'https://script.google.com/macros/s/TEST/exec' })
  };

  function parts(d, tz) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hourCycle: 'h23' });
    const o = {}; f.formatToParts(d).forEach(p => { o[p.type] = p.value; });
    return o;
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const Utilities = {
    formatDate(d, tz, pattern) {
      const p = parts(d, tz);
      return pattern.replace(/yyyy|yy|MMM|MM|dd|HH|mm|ss|EEE/g, t => ({
        yyyy: p.year, yy: p.year.slice(2), MMM: MONTHS[+p.month - 1], MM: p.month, dd: p.day, HH: p.hour, mm: p.minute, ss: p.second, EEE: p.weekday
      }[t]));
    },
    computeHmacSha256Signature(value, key) { return Array.from(crypto.createHmac('sha256', key).update(value, 'utf8').digest()).map(b => (b > 127 ? b - 256 : b)); },
    base64EncodeWebSafe(x) { const buf = typeof x === 'string' ? Buffer.from(x, 'utf8') : Buffer.from(x.map(b => (b + 256) % 256)); return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); },
    base64DecodeWebSafe(s) { return Array.from(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')).map(b => (b > 127 ? b - 256 : b)); },
    newBlob(bytes) { return { getDataAsString: () => Buffer.from(bytes.map(b => (b + 256) % 256)).toString('utf8') }; },
    getUuid: () => crypto.randomUUID(),
    sleep: ms => { clock.now += ms; },
    parseCsv: t => t.trim().split(/\r?\n/).map(l => l.split(','))
  };
  const Session = { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) };

  const context = {
    Date: FakeDate, Math, JSON, Object, Array, String, Number, RegExp, Error, parseInt, parseFloat, isNaN, encodeURIComponent, decodeURIComponent, Intl,
    console: { log: () => {} },
    SpreadsheetApp, GmailApp, MailApp, PropertiesService, LockService, ScriptApp, Utilities, Session,
    HtmlService: { XFrameOptionsMode: { DEFAULT: 'DEFAULT' } }
  };
  vm.createContext(context);
  const dir = path.join(__dirname, '..', 'apps-script');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.gs')).sort();
  const code = files.map(f => `// ---- ${f}\n` + fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  vm.runInContext(code + '\n;this.__exports = { APP, Config, Db, Util, ContactManager, CampaignManager, EmailContentManager, EmailScheduler, EmailSender, DashboardManager, ErrorHandler, UnsubscribeManager, Setup, SelfTests, SEED_CONTENT, webConfirmUnsubscribe, uiSaveSettings, uiCampaignAction, uiImportRows };', context, { filename: 'apps-script-bundle.js' });

  const env = {
    g: context.__exports, ss, gmail, notifications, props, lock, triggers, clock, FakeDate, stats: { flushes: 0 },
    /** Sets the clock to a Dubai local time, e.g. setDubai('2026-11-16 09:00'). */
    setDubai(s) { clock.now = RealDate.parse(s.replace(' ', 'T') + ':00+04:00'); },
    advanceMinutes(n) { clock.now += n * 60000; },
    sheetRows(name) { return env.g.Db.read(name).rows; }
  };
  return env;
}

module.exports = { createEnv };
