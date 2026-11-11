# Production Deployment Guide

## Go-live checklist

| ✓ | Item |
|---|---|
| ☐ | Sending account chosen (Workspace domain recommended) with 2-Step Verification on |
| ☐ | SPF / DKIM / DMARC PASS on a test email (Workspace only) — see SECURITY_AND_COMPLIANCE.md |
| ☐ | Setup / Repair run; Dashboard shows **🟢 Cloud scheduler installed** |
| ☐ | Contacts imported; **Validate contacts** run; source recorded in Notes/Source |
| ☐ | Content reviewed, test email received on desktop and phone, **Status = Ready** |
| ☐ | Reply-To address confirmed correct (`civicdesign.ainakheel@gmail.com` as supplied?) |
| ☐ | Unsubscribe web app deployed and URL saved in Settings |
| ☐ | All live acceptance tests in TESTING.md ticked |
| ☐ | **Test mode OFF** (Dashboard → System Health) |
| ☐ | Test campaign(s) stopped; test contacts deleted or tagged so they are not in "ALL" |
| ☐ | Real campaign created: Content CT-001, target ALL, limit 8, 09:00, Mon–Fri |
| ☐ | Self-tests all PASS |

## Recommended production settings (Settings sheet)

| Setting | Value | Why |
|---|---|---|
| DEFAULT_DAILY_LIMIT | 8 | As requested; change any time |
| GLOBAL_DAILY_CAP | 40 | Upper safety net across all campaigns |
| QUOTA_RESERVE | 10 | Keeps Gmail quota for your normal email |
| MAX_EMAILS_PER_RUN / SCHEDULER_INTERVAL_MINUTES | 2 / 10 | 8 emails spread over ~40 minutes from the start time |
| SECONDS_BETWEEN_EMAILS | 20 | Natural pacing inside a run |
| SENDING_WINDOW_END | 17:00 | Business hours only |
| DEFAULT_SENDING_DAYS | Mon,Tue,Wed,Thu,Fri | UAE working week |
| MIN_DAYS_BETWEEN_EMAILS | 7 | Never two emails to one person within a week, across campaigns |
| MAX_ATTEMPTS / RETRY_DELAY_MINUTES | 3 / 60 | Temporary errors retried after 1h, then 2h |

## Google limits respected

| Limit | Value | How the system handles it |
|---|---|---|
| Apps Script email recipients/day | 100 (Gmail) / 1,500 (Workspace) | Reads `MailApp.getRemainingDailyQuota()` before sending; keeps `QUOTA_RESERVE` free; on a quota error stops the run and retries later without using an attempt |
| Script runtime | 6 min per execution | Each run sends only a few emails and stops itself at 4.5 min |
| Triggers total runtime/day | 90 min (Gmail) / 6 h (Workspace) | A 10-minute tick takes a few seconds when idle (~10–15 min/day total) |
| Time-driven trigger precision | ± a few minutes | Sends start within ~10 minutes of the configured time |

## Monitoring

- **Daily report email** (06:00) while campaigns run.
- **Dashboard → System Health**: last scheduler run should be < 30 minutes old during the day.
- **Apps Script → Executions**: history of every cloud run (`schedulerTick`, `inboxTick`, `dailyMaintenanceTick`).
- **Error Log** sheet; critical errors are also emailed to you.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Nothing sent today | Check: campaign **Active**? today a sending day? after send time and before 17:00? content **Ready**? Test mode? Dashboard "Gmail Quota Left". Run **Run scheduler now** and read the message (it lists the reason per campaign). |
| Dashboard says scheduler NOT installed | Menu → System → Install / repair cloud automation |
| "Authorization required" email from Google | Open the Sheet, run any menu item and re-authorise (happens after code changes that add permissions) |
| Campaign was auto-paused | Content became invalid (e.g. subject removed). Fix content → Resume. |
| A contact shows "Retry pending" | Temporary Gmail error; it will retry automatically (after verifying it wasn't already sent). |
| Emails land in spam | Authenticate the domain (SPF/DKIM/DMARC), avoid link shorteners, keep volumes steady, ask recipients to reply. |
| Need to stop everything now | Menu → System → ⛔ EMERGENCY STOP |

## Backups & recovery

- Google Sheets keeps full **version history** (File → Version history).
- Optional: File → Make a copy monthly, or File → Download → .xlsx.
- All progress is stored in the sheets, so if a run is interrupted (Google outage, timeout, quota) the next run continues from the exact point, verifying anything that was mid-send against the Gmail Sent folder.

## Changing the code

1. Make changes in a copy of the Sheet first (File → Make a copy copies the script too; triggers must be installed in the copy via Setup).
2. Run the offline tests: `node email-automation/tests/run-tests.js`.
3. Paste/push to production, run **Setup / Repair System**, and if `WebApp.gs` changed publish a new web-app version (Manage deployments → Edit → New version).
