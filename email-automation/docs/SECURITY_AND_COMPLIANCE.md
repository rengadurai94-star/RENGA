# Security, Permissions & Compliance

## Where things run and who can access them

- **Code and data** live in **your** Google account. The code is in an Apps Script project bound to your Sheet, and the data is in the Sheet.
- **No third parties.** No external servers, SMTP relays, n8n, Zapier or Make are involved.
- **Triggers** run on Google's infrastructure as the account that installed them, so emails are sent from that account.
- **Sharing:** share the Sheet only with people who need it, as Editor or Viewer. Anyone with edit access can see contact data and edit the code (Extensions → Apps Script).

## OAuth permissions requested (appsscript.json)

| Scope | Why it is needed |
|---|---|
| `spreadsheets` | Read and write the database sheets, including from triggers and the web app |
| `script.container.ui` | Menu, sidebar and dialogs |
| `script.scriptapp` | Create the time-driven triggers |
| `script.send_mail` | Owner notifications and daily report (MailApp) |
| `https://mail.google.com/` | Send campaign emails (GmailApp); search the **Sent** folder to prevent duplicates; read bounce notices and "unsubscribe" replies; label processed threads |
| `userinfo.email` | Know the sending address (used in previews and the mailto unsubscribe link) |

The Gmail scope is broad because the system has to search Sent and read bounces. The code only does the following:
- searches `in:sent to:<recipient>`
- searches bounce or unsubscribe messages from the last 7–14 days
- adds the label `Email Automation/Processed`

It never deletes or forwards mail.

## Security controls in the code

- **Tamper-proof unsubscribe links:** each link carries an HMAC-SHA256 signature made with a random secret that is stored in Script Properties. It is not in the Sheet or the code. A forged link is rejected.
- **No accidental unsubscribes:** the unsubscribe page needs one click to confirm. Corporate link scanners that pre-open links cannot unsubscribe people.
- **Masked addresses:** the web app reveals only a masked address, such as `in*****@domain.ae`.
- **Locking:** `LockService` script lock means no overlapping send runs.
- **Duplicate prevention:** an idempotent queue key `CampaignID|ContactID`, plus a *Sending* state written before every Gmail call and a Sent-folder check before any retry or recovery.
- **Row-identity check:** before any write, so manual row deletions can never corrupt another record.
- **System sheets** (Queue, Logs, Dashboard) are protected with a warning against accidental edits.
- **Audit trail:** every attempt goes to the Send Log, and every error to the Error Log. Logs are trimmed to 5,000 rows.
- **Content storage:** content is stored as text in cells formatted as plain text. A leading `=`/`+` cannot become a formula.

## Sender authentication (deliverability)

| If you send from | Do this |
|---|---|
| **Google Workspace on your own domain** (recommended) | **SPF:** add a DNS TXT record `v=spf1 include:_spf.google.com ~all`, or merge `include:_spf.google.com` into your existing SPF record.<br>**DKIM:** Google Admin console → Apps → Google Workspace → Gmail → **Authenticate email** → generate the key → add the TXT record at `google._domainkey` → **Start authentication**.<br>**DMARC:** add a TXT record at `_dmarc`: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.ae`. After 2–4 weeks with clean reports, move to `p=quarantine`.<br>Check with Gmail → ⋮ → *Show original* on a test email: SPF, DKIM and DMARC should all show **PASS**. |
| **Free @gmail.com** | Google signs and authenticates automatically. You cannot add SPF/DKIM for gmail.com. Keep volumes low, which 8/day already is. |

Other deliverability practices:
- Keep the daily limit low and steady. The system already spreads sends over the morning.
- Use a Reply-To that someone reads.
- Clean bounced addresses, which happens automatically.
- Watch replies.
- Keep the unsubscribe footer ON.

## UAE compliance notes (not legal advice)

The system supports the practices normally expected under UAE rules for business email marketing:

- **Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL):** names and email addresses of individuals are personal data.
- **TDRA rules on unsolicited electronic communications:** an applicable framework you should also check.

Check with a UAE legal adviser, especially if you or your contacts are in DIFC or ADGM, which have their own data-protection laws.

| Practice | How the system supports it |
|---|---|
| Identify the sender clearly | Sender Name + signature with company name, address and phones (in your content) |
| Easy, free opt-out honoured promptly | Footer link + reply-to-unsubscribe; applied immediately and permanently (Suppression List) |
| Don't email people without permission | `Permission` column; only values in `ALLOWED_PERMISSIONS` are emailed; `Do Not Contact` blocks |
| Data minimisation & purpose limitation | Only business contact fields are stored; Notes / Source record where each contact came from |
| Accuracy | Validation, de-duplication, bounce suppression |
| Security of processing | Google account security, restricted sharing, protected system sheets |
| Records / accountability | Send Log, Error Log, Date Added, Source, unsubscribe notes with timestamp |

Recommendations:
1. Record the **source** of each list, for example "Dubai management company directory, collected 2026". Only email business addresses with a clear professional link to building management.
2. Do not use the addresses for unrelated purposes or share them.
3. Delete or anonymise contacts you no longer need.
4. Respond to access or deletion requests. Delete the row, then add the address to the Suppression List so it is never re-imported.
5. Turn on 2-Step Verification for the sending Google account.
