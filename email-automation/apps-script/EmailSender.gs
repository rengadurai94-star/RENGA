/**
 * EmailSender.gs
 * ----------------------------------------------------------------------------
 * The ONLY module that talks to Gmail for sending. Sends through the Google
 * account that owns the triggers (Gmail / Google Workspace) — no external SMTP.
 */

var EmailSender = {
  /**
   * Sends a built message. Returns { messageId, threadId }. Throws on failure.
   * Uses createDraft().send() so we get the Gmail message ID for audit and
   * duplicate verification.
   */
  send: function (to, msg) {
    var options = {};
    if (msg.htmlBody) options.htmlBody = msg.htmlBody;
    if (msg.name) options.name = msg.name;
    if (msg.replyTo) options.replyTo = msg.replyTo;
    var draft = GmailApp.createDraft(to, msg.subject, msg.plainBody, options);
    var sent;
    try {
      sent = draft.send();
    } catch (e) {
      try { draft.deleteDraft(); } catch (e2) { /* ignore */ }
      throw e;
    }
    var out = { messageId: '', threadId: '' };
    try { out.messageId = sent.getId(); out.threadId = sent.getThread().getId(); } catch (e3) { /* ignore */ }
    return out;
  },

  /** Remaining Gmail recipients allowed today for this account. */
  remainingQuota: function () {
    try { return MailApp.getRemainingDailyQuota(); } catch (e) { return 0; }
  },

  /**
   * Looks in Gmail "Sent" for a message to `to` with exactly `subject` sent
   * after `since`. Returns the message ID or ''. Used before any retry and
   * after an interrupted run, so an email is never delivered twice.
   */
  findSent: function (to, subject, since) {
    try {
      var afterSec = Math.floor(((since ? since.getTime() : Date.now() - 86400000) - 10 * 60 * 1000) / 1000);
      var q = 'in:sent to:' + to + ' after:' + afterSec;
      var threads = GmailApp.search(q, 0, 25);
      var lowerTo = String(to).toLowerCase();
      for (var i = 0; i < threads.length; i++) {
        var msgs = threads[i].getMessages();
        for (var j = 0; j < msgs.length; j++) {
          var m = msgs[j];
          if (since && m.getDate().getTime() < since.getTime() - 10 * 60 * 1000) continue;
          var recips = (m.getTo() + ',' + m.getCc() + ',' + m.getBcc()).toLowerCase();
          if (recips.indexOf(lowerTo) >= 0 && m.getSubject() === subject) return m.getId();
        }
      }
    } catch (e) {
      ErrorHandler.warn('EmailSender', 'findSent', 'Could not search Sent folder: ' + e.message, to);
      throw e; // caller must treat "unknown" as "possibly sent" — never resend blindly
    }
    return '';
  }
};
