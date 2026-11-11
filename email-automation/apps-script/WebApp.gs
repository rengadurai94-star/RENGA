/**
 * WebApp.gs
 * ----------------------------------------------------------------------------
 * Public unsubscribe page. Deploy once as a Web App
 *   (Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone)
 * and paste the /exec URL into Settings → UNSUBSCRIBE_WEB_APP_URL.
 *
 * The link in each email is signed with a secret HMAC token, so nobody can
 * unsubscribe someone else by editing the URL. The page asks for one click to
 * confirm, so corporate link-scanners that "pre-open" links cannot
 * unsubscribe people by accident.
 */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var t = HtmlService.createTemplateFromFile('Unsubscribe');
  t.state = 'invalid';
  t.e = ''; t.t = ''; t.c = ''; t.masked = '';
  if (p.a === 'unsubscribe' && p.e && p.t) {
    var email = UnsubscribeManager.verify(p.e, p.t);
    if (email) {
      t.state = 'confirm';
      t.e = p.e; t.t = p.t; t.c = String(p.c || '').replace(/[^A-Za-z0-9\-]/g, '').slice(0, 20);
      t.masked = maskEmail_(email);
    }
  }
  return t.evaluate()
    .setTitle('Email preferences')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Called from the unsubscribe page button. */
function webConfirmUnsubscribe(e64, token, campaignId) {
  var email = UnsubscribeManager.verify(e64, token);
  if (!email) throw new Error('This unsubscribe link is not valid.');
  UnsubscribeManager.unsubscribe(email, 'Web unsubscribe page', String(campaignId || '').slice(0, 20));
  return maskEmail_(email);
}

function maskEmail_(email) {
  var parts = String(email).split('@');
  var name = parts[0];
  var shown = name.length <= 2 ? name.charAt(0) + '*' : name.slice(0, 2) + new Array(Math.min(name.length - 1, 6)).join('*');
  return shown + '@' + (parts[1] || '');
}
