# Cloud Email Automation for Civic Design Architects & Engineers

A cloud-based email campaign system built only on Google:
**Google Sheets** (database + dashboard), **Google Apps Script** (automation engine, time-driven triggers on Google Cloud) and **Gmail / Google Workspace** (delivery).
It runs on Google's servers on a schedule, so your computer can be switched off.

> Your email content is never generated or rewritten. The system sends your subject and body exactly as you paste them. It adds only your signature and an unsubscribe footer below them, and you can turn the footer off.

## Your regular tasks

1. **Upload email addresses.** Menu: Email Automation → Import Contacts (CSV / Excel).
2. **Paste your subject and content.** Menu: Content Editor → Preview → Send test → Status **Ready**.
3. **Set the sending schedule.** Control Panel → **New**: daily limit, time, days and dates.
4. **Start the campaign.**

The system handles everything else on its own: picking the next eligible contacts each day, respecting limits and duplicates, retries, bounces, unsubscribes, recovery and the dashboard.

## What's in this folder

| Path | What it is |
|---|---|
| `apps-script/` | The complete Google Apps Script project (copy into the Sheet's Apps Script editor, or push with `clasp`) |
| `apps-script/Configuration.gs` | Sheet layout, statuses, default settings, shared helpers |
| `apps-script/ContactManager.gs` | Contacts: import (CSV/Excel/paste), validate, de-duplicate, eligibility |
| `apps-script/CampaignManager.gs` | Create / start / pause / resume / stop campaigns, per-campaign recipient queue |
| `apps-script/EmailContentManager.gs` | Stores your content verbatim; preview; test email |
| `apps-script/EmailScheduler.gs` | The cloud engine (time-driven triggers, locking, limits, recovery) |
| `apps-script/EmailSender.gs` | Gmail sending and Sent-folder verification |
| `apps-script/DashboardManager.gs` | Dashboard sheet and derived contact columns |
| `apps-script/ErrorHandler.gs` | Logging, error classification, owner alerts |
| `apps-script/UnsubscribeManager.gs` | Signed unsubscribe links, suppression list, bounce and reply processing |
| `apps-script/Database.gs`, `Setup.gs`, `Menu.gs`, `WebApp.gs`, `SelfTests.gs` | Data layer, one-click setup, menu and UI API, unsubscribe page, self-tests |
| `apps-script/*.html` | Control Panel sidebar, Content Editor, Import dialog, unsubscribe page |
| `templates/` | Database template (.xlsx), contact import template (.csv), your email content (.html/.txt) |
| `docs/` | Setup & deployment, user guide, testing, security & compliance, production guide |
| `tests/` | Offline simulator of Google services and 25 end-to-end tests (`node email-automation/tests/run-tests.js`) |

## Documentation

1. [Setup & Deployment](docs/SETUP_AND_DEPLOYMENT.md): about 20 minutes, one time
2. [User Guide](docs/USER_GUIDE.md): day-to-day use for a non-technical owner
3. [Testing](docs/TESTING.md): the pre-production test plan, with checkboxes
4. [Security, Permissions & Compliance](docs/SECURITY_AND_COMPLIANCE.md): scopes, sender authentication (SPF/DKIM/DMARC), UAE notes
5. [Production Deployment Guide](docs/PRODUCTION_GUIDE.md): go-live checklist, monitoring, troubleshooting

## How it works (one paragraph)

Every campaign gets its own rows in the **Campaign Queue** sheet, one per contact, keyed `CampaignID|ContactID`. Every 10 minutes a time-driven trigger runs `schedulerTick()` on Google's servers. It takes a script lock so two runs never overlap, then picks the next eligible recipients. Several limits apply at once:

- the campaign's daily limit (default 8, not hard-coded)
- the global daily cap
- your Gmail quota minus a reserve
- the per-run maximum, which spreads the 8 emails over the morning

Before each email the system checks again that the campaign is still running and the contact hasn't unsubscribed, bounced, or lost permission. It writes `Sending` to the sheet **before** calling Gmail and `Sent` right after. If a run is interrupted, or a send has to be retried, the system first looks in Gmail's **Sent** folder, so an email is never delivered twice.
