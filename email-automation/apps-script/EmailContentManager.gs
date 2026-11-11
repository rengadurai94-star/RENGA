/**
 * EmailContentManager.gs
 * ----------------------------------------------------------------------------
 * Stores YOUR email content exactly as you write it. This module never
 * generates, rewrites or "improves" content. The only things ever added are:
 *   1. your own Email Signature (if you filled one in), and
 *   2. the unsubscribe footer BELOW everything (can be switched off in Settings).
 *
 * Optional merge fields (only replaced if YOU type them in your content):
 *   {{Company Name}} {{Contact Person}} {{Building Name}} {{Email Address}}
 *   {{Contact Person|Property Manager}}  ← value after "|" is used when empty
 */

var EmailContentManager = {
  MAX_CELL: 49000,

  read: function () { return Db.read(APP.SHEETS.CONTENT); },

  list: function () {
    return this.read().rows.map(function (r) {
      return {
        id: String(r['Content ID']), name: String(r['Content Name'] || ''),
        subject: String(r['Email Subject'] || ''), status: String(r['Status'] || APP.CONTENT_STATUS.DRAFT),
        format: String(r['Format'] || APP.FORMAT.HTML), updated: Util.fmtDateTime(r['Last Updated'])
      };
    });
  },

  get: function (id) {
    var t = this.read();
    for (var i = 0; i < t.rows.length; i++) {
      if (String(t.rows[i]['Content ID']) === String(id)) return this.toObj_(t.rows[i]);
    }
    return null;
  },

  toObj_: function (r) {
    var s = function (v) { return v === null || v === undefined ? '' : String(v); };
    return {
      id: s(r['Content ID']), name: s(r['Content Name']), subject: s(r['Email Subject']),
      plainBody: s(r['Plain Text Body']), htmlBody: s(r['HTML Email Content']),
      senderName: s(r['Sender Name']), replyTo: s(r['Reply-To Email']).trim(),
      signature: s(r['Email Signature']), format: s(r['Format']) || APP.FORMAT.HTML,
      status: s(r['Status']) || APP.CONTENT_STATUS.DRAFT, notes: s(r['Notes']),
      updated: Util.fmtDateTime(r['Last Updated'])
    };
  },

  /** Returns a list of problems; empty list = content can be used. */
  validate: function (c) {
    var p = [];
    if (!c.subject || !String(c.subject).trim()) p.push('Email Subject is empty.');
    if (/[\r\n]/.test(c.subject || '')) p.push('Email Subject must be a single line.');
    var fmt = c.format === APP.FORMAT.PLAIN ? APP.FORMAT.PLAIN : APP.FORMAT.HTML;
    if (fmt === APP.FORMAT.HTML && !String(c.htmlBody || '').trim() && !String(c.plainBody || '').trim()) p.push('Email body is empty (fill HTML Email Content or Plain Text Body).');
    if (fmt === APP.FORMAT.PLAIN && !String(c.plainBody || '').trim()) p.push('Plain Text Body is empty.');
    if (c.replyTo && !ContactManager.isValidEmail(ContactManager.normalizeEmail(c.replyTo))) p.push('Reply-To Email is not a valid address.');
    ['subject', 'plainBody', 'htmlBody', 'signature'].forEach(function (k) {
      if (String(c[k] || '').length > EmailContentManager.MAX_CELL) p.push(k + ' is too long for a Google Sheets cell (max ' + EmailContentManager.MAX_CELL + ' characters).');
    });
    return p;
  },

  /** Creates or updates content. Text is stored byte-for-byte as given. */
  save: function (c) {
    var problems = this.validate(c);
    if (c.status === APP.CONTENT_STATUS.READY && problems.length) {
      throw new Error('Cannot mark as Ready:\n- ' + problems.join('\n- '));
    }
    var t = this.read();
    var row = null;
    if (c.id) t.rows.forEach(function (r) { if (String(r['Content ID']) === String(c.id)) row = r; });
    var fields = {
      'Content Name': this.cell_(c.name || c.subject || 'Untitled'),
      'Email Subject': this.cell_(c.subject || ''),
      'Plain Text Body': this.cell_(c.plainBody || ''),
      'HTML Email Content': this.cell_(c.htmlBody || ''),
      'Sender Name': this.cell_(c.senderName || ''),
      'Reply-To Email': this.cell_(c.replyTo || ''),
      'Email Signature': this.cell_(c.signature || ''),
      'Format': c.format === APP.FORMAT.PLAIN ? APP.FORMAT.PLAIN : APP.FORMAT.HTML,
      'Status': c.status === APP.CONTENT_STATUS.READY ? APP.CONTENT_STATUS.READY : APP.CONTENT_STATUS.DRAFT,
      'Last Updated': new Date(),
      'Notes': this.cell_(c.notes || '')
    };
    if (row) {
      Db.update(t, row, fields);
      return String(row['Content ID']);
    }
    var id = Db.nextId(t, 'Content ID', 'CT-', 3);
    fields['Content ID'] = id;
    Db.appendObjects(APP.SHEETS.CONTENT, [fields]);
    return id;
  },

  /** Leading "=" or "+" would turn text into a formula; an apostrophe keeps it literal (not stored). */
  cell_: function (v) {
    var s = String(v);
    return /^[=+]/.test(s) ? "'" + s : s;
  },

  /**
   * Builds the final email for one contact.
   * Returns { subject, plainBody, htmlBody (or ''), name, replyTo }.
   */
  build: function (content, contact, opts) {
    opts = opts || {};
    var settings = opts.settings || Config.load();
    var c = content;
    var isHtml = c.format !== APP.FORMAT.PLAIN;
    var merge = function (text, html) { return EmailContentManager.merge_(text, contact, html); };

    var subject = merge(c.subject, false);

    // ---- plain-text version -------------------------------------------------
    var plainMain = c.plainBody ? merge(c.plainBody, false) : this.htmlToText_(merge(c.htmlBody, true));
    var sigPlain = c.signature ? (this.looksHtml_(c.signature) ? this.htmlToText_(c.signature) : c.signature) : '';
    var plain = plainMain;
    if (sigPlain) plain += '\n\n' + sigPlain;

    // ---- footer -------------------------------------------------------------
    var unsubUrl = opts.unsubscribeUrl || '';
    var footerPlain = '', footerHtml = '';
    if (settings.addUnsubFooter && unsubUrl) {
      var text = settings.unsubFooterText || 'To unsubscribe, {{UNSUBSCRIBE_LINK}}.';
      if (text.indexOf('{{UNSUBSCRIBE_LINK}}') < 0) text += ' {{UNSUBSCRIBE_LINK}}';
      footerPlain = text.replace('{{UNSUBSCRIBE_LINK}}', settings.unsubLinkText + ': ' + unsubUrl);
      footerHtml = Util.escapeHtml(text).replace('{{UNSUBSCRIBE_LINK}}',
        '<a href="' + Util.escapeHtml(unsubUrl) + '" style="color:#888888;">' + Util.escapeHtml(settings.unsubLinkText) + '</a>');
      plain += '\n\n--\n' + footerPlain;
    }

    // ---- HTML version -------------------------------------------------------
    var html = '';
    if (isHtml) {
      var main = c.htmlBody ? merge(c.htmlBody, true) : this.plainToHtml_(merge(c.plainBody, false));
      var extra = '';
      if (c.signature) {
        extra += '<div class="ea-signature" style="margin-top:16px;">' +
          (this.looksHtml_(c.signature) ? c.signature : this.plainToHtml_(c.signature)) + '</div>';
      }
      if (footerHtml) {
        extra += '<div class="ea-footer" style="margin-top:28px;padding-top:10px;border-top:1px solid #e5e5e5;' +
          'font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#888888;">' + footerHtml + '</div>';
      }
      html = this.insertBeforeBodyEnd_(main, extra);
    }

    return {
      subject: subject,
      plainBody: plain,
      htmlBody: html,
      name: c.senderName || '',
      replyTo: c.replyTo ? ContactManager.normalizeEmail(c.replyTo) : ''
    };
  },

  merge_: function (text, contact, html) {
    text = String(text || '');
    if (text.indexOf('{{') < 0) return text;
    var fields = ['Company Name', 'Contact Person', 'Building Name', 'Email Address'];
    return text.replace(/\{\{\s*([A-Za-z ]+?)\s*(?:\|([^}]*))?\}\}/g, function (all, name, fallback) {
      var key = null;
      fields.forEach(function (f) { if (f.toLowerCase() === name.toLowerCase()) key = f; });
      if (!key) return all; // not a merge field → leave untouched
      var v = contact && contact[key] ? String(contact[key]) : (fallback || '');
      return html ? Util.escapeHtml(v) : v;
    });
  },

  looksHtml_: function (s) { return /<\/?[a-z][\s\S]*>/i.test(String(s || '')); },

  plainToHtml_: function (s) {
    var esc = Util.escapeHtml(s || '');
    esc = esc.replace(/(https?:\/\/[^\s<)]+)/g, '<a href="$1">$1</a>');
    return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#222222;">' +
      esc.replace(/\r\n|\r|\n/g, '<br>') + '</div>';
  },

  htmlToText_: function (html) {
    var s = String(html || '');
    s = s.replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, '');
    s = s.replace(/<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, function (all, href, text) {
      var t = text.replace(/<[^>]+>/g, '').trim();
      return href.indexOf('mailto:') === 0 || t === href ? t : t + ' (' + href + ')';
    });
    s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li|tr|table)>/gi, '\n').replace(/<li[^>]*>/gi, '• ');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  },

  insertBeforeBodyEnd_: function (html, extra) {
    if (!extra) return html;
    var idx = html.search(/<\/body\s*>/i);
    return idx >= 0 ? html.slice(0, idx) + extra + html.slice(idx) : html + extra;
  },

  /** Full HTML page used by the Preview dialog. */
  previewPage: function (contentId) {
    var c = this.get(contentId);
    if (!c) throw new Error('Content ' + contentId + ' not found.');
    var sample = { 'Company Name': 'Sample Company LLC', 'Contact Person': '', 'Building Name': 'Sample Tower', 'Email Address': 'sample@example.com' };
    var settings = Config.load();
    var msg = this.build(c, sample, { settings: settings, unsubscribeUrl: UnsubscribeManager.buildUrl('sample@example.com', 'PREVIEW') });
    var problems = this.validate(c);
    var head = '<div style="font-family:Arial,sans-serif;font-size:13px;background:#f4f6f8;border:1px solid #dde3ea;border-radius:8px;padding:12px 14px;margin-bottom:14px;">' +
      '<div><b>From:</b> ' + Util.escapeHtml((c.senderName ? c.senderName + ' ' : '') + '<' + Util.ownerEmail() + '>') + '</div>' +
      '<div><b>Reply-To:</b> ' + Util.escapeHtml(msg.replyTo || '(same as sender)') + '</div>' +
      '<div><b>Subject:</b> ' + Util.escapeHtml(msg.subject) + '</div>' +
      '<div><b>Format:</b> ' + Util.escapeHtml(c.format) + ' &nbsp; <b>Status:</b> ' + Util.escapeHtml(c.status) + '</div>' +
      (problems.length ? '<div style="color:#b00020;margin-top:6px;"><b>Fix before use:</b> ' + Util.escapeHtml(problems.join(' ')) + '</div>' : '') +
      '</div>';
    var body = msg.htmlBody
      ? '<div style="border:1px solid #e3e3e3;border-radius:8px;padding:16px;">' + msg.htmlBody + '</div>'
      : '<pre style="white-space:pre-wrap;font-family:Arial,sans-serif;font-size:14px;border:1px solid #e3e3e3;border-radius:8px;padding:16px;">' + Util.escapeHtml(msg.plainBody) + '</pre>';
    var plainView = msg.htmlBody ? '<details style="margin-top:14px;font-family:Arial,sans-serif;font-size:13px;"><summary>Plain-text version (shown by email apps that do not display HTML)</summary><pre style="white-space:pre-wrap;">' + Util.escapeHtml(msg.plainBody) + '</pre></details>' : '';
    return head + body + plainView;
  },

  /** Sends one test email of the content to the given address (default: you). */
  sendTest: function (contentId, to) {
    var c = this.get(contentId);
    if (!c) throw new Error('Content ' + contentId + ' not found.');
    var problems = this.validate(c);
    if (problems.length) throw new Error(problems.join('\n'));
    to = ContactManager.normalizeEmail(to || Util.ownerEmail());
    if (!ContactManager.isValidEmail(to)) throw new Error('Invalid test address: ' + to);
    var sample = { 'Company Name': '', 'Contact Person': '', 'Building Name': '', 'Email Address': to };
    var msg = this.build(c, sample, { unsubscribeUrl: UnsubscribeManager.buildUrl(to, 'TEST') });
    msg.subject = '[TEST] ' + msg.subject;
    EmailSender.send(to, msg);
    ErrorHandler.info('EmailContentManager', 'sendTest', 'Test email sent to ' + to, contentId);
    return to;
  }
};
