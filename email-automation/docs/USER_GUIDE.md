# User Guide (day-to-day)

Everything starts from the **📧 Email Automation** menu in the Google Sheet. The **🧭 Control Panel** (a sidebar) has five tabs:

| Tab | Use it to |
|---|---|
| **Overview** | See live numbers, warnings and quick actions |
| **Campaigns** | See every campaign with a progress bar: **Start / Pause / Resume / Stop / + New contacts**, change daily limit, time, days and dates |
| **New** | Create a campaign |
| **Contacts** | Import a file or add one contact |
| **Settings** | Change sending limits and times, test mode, unsubscribe options |

## 1. Upload email addresses

- **From a file:** menu **📥 Import Contacts**. Accepts `.xlsx`, `.xls` and `.csv`. Recognised column names include Email, Company, Contact Person / Name, Building, Tags, Permission and Notes. A file with only emails also works.
- **By pasting:** paste into the **Import** sheet (columns: Email Address, Company Name, Contact Person, Building Name, Tags, Permission, Notes), then menu **Contacts → Import rows pasted in the "Import" sheet**.
- **Edit** contacts directly in the **Contacts** sheet.
- **Delete** contacts: tick **Select** on their rows, then menu **Contacts → Delete ticked contacts**. They are removed from pending campaigns too.
- **Never email someone:** set **Permission** to `Do Not Contact`, or add the address (or `@domain.com`) to the **Suppression List** sheet.

Contacts get Permission **Business Contact** by default. Only contacts whose Permission is listed in `ALLOWED_PERMISSIONS` (Settings sheet) are emailed.

## 2. Paste your subject and content

Open menu **✏️ Content Editor**:

- **Email Subject**, **Sender Name**, **Reply-To Email**
- **HTML Email Content:** paste HTML, for example from an email designer or from Gmail → ⋮ → "Show original". Images must be hosted online (`<img src="https://…">`).
- **Plain Text Body:** the text version, shown by email apps that don't display HTML. If you only fill this and choose Format **HTML**, it is shown with your line breaks.
- **Email Signature:** plain text or HTML.
- **Format:** HTML or Plain Text.
- **Status:** *Draft* while you work, *Ready* when you have approved it.

Use **👁 Preview** and **✉️ Send test email** before every new campaign. The system never edits your text.

Optional personalisation: write `{{Company Name}}`, `{{Building Name}}` or `{{Contact Person|Property Manager}}`. The text after `|` is used when the field is empty. If you don't type these, nothing is replaced.

To use new content, click **+ New content**. Every campaign points to one Content ID, so older campaigns are not affected.

## 3. Set the schedule and start

In the Control Panel, open **New**:

| Field | Meaning |
|---|---|
| Send to | **All** eligible contacts, only **ticked** contacts (Select column), or contacts with a **tag** |
| Start date / End date | The campaign waits until the start date. If an end date is set, anything not sent by then is cancelled. |
| Daily limit | Emails per day for this campaign (default 8) |
| Start sending at | Dubai time. Sending stops at `SENDING_WINDOW_END` (default 17:00). |
| Sending days | UAE working week by default (Mon–Fri) |

Click **Create & start**, or **Save as draft** and start it later from the Campaigns tab.

## Pause, resume, stop, change

- **Pause** takes effect immediately, even in the middle of a run. **Resume** continues where it stopped.
- **Stop** ends the campaign permanently and cancels the remaining recipients.
- **Change limit / time / days** (Campaigns tab → *Change…*) takes effect from the next run, about 10 minutes.
- **+ New contacts** adds contacts that you imported after the campaign started.

## Reading the Dashboard

| Section | What it shows |
|---|---|
| Top tiles | Total contacts, emails sent, pending, failed/bounced, unsubscribed, active and completed campaigns, sent today against the cap, completion %, Gmail quota left |
| Campaigns table | Status (🟢 Active · 🕒 Scheduled · ⏸️ Paused · ✅ Completed · ⛔ Stopped · 📝 Draft), a progress bar, counts, today/limit and the estimated finish date |
| System Health | Whether the cloud scheduler is installed and when it last ran, inbox checks, errors in the last 24h, test mode, unsubscribe page |

Contact columns are updated automatically: **Campaign Status**, **Email Sent Count**, **Last Email Sent Date**, **Next Scheduled Date**, **Delivery Status**, **Unsubscribe Status** and **Error Log**.

## Emails you will receive

- A **daily report** at about 06:00, while a campaign is running
- **Campaign completed**
- **Critical error** alerts, at most once per hour per type

## Emergency stop

Menu **⚙️ System → ⛔ EMERGENCY STOP** removes all automation, and nothing is sent. To restart, use **Install / repair cloud automation**.
