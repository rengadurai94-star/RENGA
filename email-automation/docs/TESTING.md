# Testing Documentation

There are three layers of testing. None of them emails a real contact until you choose to go live.

| Layer | Where | Sends email? |
|---|---|---|
| A. Offline simulation (25 automated scenarios) | Any computer with Node.js: `node email-automation/tests/run-tests.js` | No (simulated Gmail) |
| B. Built-in self-tests | Sheet menu → ⚙️ System → Run self-tests | No |
| C. Live acceptance tests | Your Google Sheet, using **Test Mode** and a **test** tag | Only to your own addresses |

## A. Offline simulation (already run on the delivered code)

`tests/gas-mock.js` simulates Sheets, Gmail, MailApp, locks, triggers, properties and a controllable Dubai clock. `tests/run-tests.js` runs the real Apps Script files against it.

Result of the delivered version: **25 passed, 0 failed**.

| Requirement | Scenario that verifies it |
|---|---|
| Single delivery | Content is delivered exactly as written, plus signature and unsubscribe footer |
| Bulk delivery | 351 contacts at 8/day finish in 44 sending days, each emailed exactly once, never on Sat/Sun |
| Daily limits | Exactly 8 per day; a limit changed to 3 applies the next day; global cap and Gmail quota reserve |
| Scheduling accuracy | Nothing before 09:00; send-time change; Mon–Fri only; future start date; end date |
| Duplicate prevention | No duplicate queue rows; same contact never twice per campaign; 7-day gap across campaigns |
| Pause / resume / stop | Pause takes effect immediately; resume continues; stop cancels the rest |
| Failed email handling | Invalid address → *Failed* without retry; temporary error → *Retry*, then sent once |
| Error after Gmail actually sent | Verified in the Sent folder, never sent twice |
| Recovery after interruption | Items left in *Sending* are resolved through the Sent folder: re-sent only if they were really not sent |
| Overlapping runs | The script lock blocks a second concurrent run |
| Unsubscribe | Signed link (forged token rejected); pending emails skipped; excluded from future campaigns; reply "unsubscribe" processed |
| Bounces | Mailer-daemon notice → *Bounced* + suppressed |
| Permission | "Do Not Contact" and suppressed domains are never queued |
| Test mode | All mail is redirected to the test address and contact counters are untouched |
| Data integrity | A row deleted by hand mid-run never causes a write into another contact's row |

We also checked that the tests catch real bugs. With the Sent-folder check deliberately disabled, the "never sent twice" scenario fails as expected.

## B. Built-in self-tests

Menu **⚙️ System → Run self-tests**. The checks are:
- sheets and columns
- time zone
- triggers
- Gmail quota readable
- settings consistency
- parsing
- email validation
- tamper-proof unsubscribe token
- content sent verbatim
- error classification
- schedule estimate
- no duplicate queue rows
- nobody emailed twice in a campaign
- unsubscribed contacts with nothing pending
- content marked Ready
- unsubscribe web app configured

Results are written to the **Test Results** sheet.

## C. Live acceptance tests (do these once before production)

Preparation:
1. Add 3–5 of **your own** addresses as contacts with tag `test`. Gmail "plus" addresses work, for example `you+t1@gmail.com`, `you+t2@gmail.com`. Add one colleague's address on another provider, such as Outlook or Yahoo, to check spam placement.
2. Control Panel → Settings: **Test mode ON** for tests C2–C5, then **OFF** for C6–C10, still targeting only `TAG:test`.

| # | Test | Steps | Expected result | ✓ |
|---|---|---|---|---|
| C1 | Single email | Content Editor → Send test email | Arrives with the correct subject, sender name, reply-to, link and signature; not in spam | ☐ |
| C2 | Bulk / daily limit | New campaign → Send to: tag `test`, daily limit 2, start time = now → Create & start, wait 30 min | Exactly 2 emails today (to the test address); Dashboard "Sent Today" = 2 | ☐ |
| C3 | Scheduling | Edit the campaign: start time 30 min from now | Nothing is sent before that time; sending starts within 10 min after it | ☐ |
| C4 | Pause / resume | Pause → wait 20 min → Resume | Nothing sent while paused; continues after resume | ☐ |
| C5 | Duplicate prevention | Menu → Run scheduler now, several times in a row | Never more than the limit; each test address appears once in the Campaign Queue as *Sent* | ☐ |
| C6 | Real delivery | Test mode OFF; new campaign for tag `test` | Each test address receives exactly one email | ☐ |
| C7 | Failed email | Add contact `nobody@invalid-domain-xyz.ae` with tag `test`, then + New contacts | Bounce notice arrives; within about 1 h the contact shows *Bounced* and is on the Suppression List | ☐ |
| C8 | Unsubscribe link | Click the footer link in a received test email → confirm | Page says "unsubscribed"; contact shows *Unsubscribed* | ☐ |
| C9 | Unsubscribe reply | Reply "Unsubscribe" from another test address | Within about 1 h: *Unsubscribed* | ☐ |
| C10 | Laptop switched off | Start a small test campaign for tomorrow 09:00, shut the computer down | Next day: Send Log shows sends at about 09:00; Apps Script → **Executions** shows `schedulerTick` runs | ☐ |
| C11 | Recovery | While a test campaign runs, use ⛔ Emergency stop, wait, then Install / repair cloud automation | Sending continues where it left off; no duplicates | ☐ |
| C12 | Self-tests | ⚙️ System → Run self-tests | All PASS | ☐ |

When every row is ticked, stop the test campaign. Then switch Test Mode OFF, check the Dashboard says *Test mode OFF*, and create the real campaign.
