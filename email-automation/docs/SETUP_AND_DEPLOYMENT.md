# Setup & Deployment Guide

Setup is a one-time job that takes about 20 minutes. You only need a web browser. After this, nothing runs on your computer.

## 0. Choose the sending Google account

The account you use here is the account that **sends** the campaign emails, and the cloud triggers run under it.

| Option | Daily Apps Script email quota | Recommendation |
|---|---|---|
| Google Workspace on your company domain (e.g. `info@civicdesign.ae`) | 1,500 recipients/day | **Best.** Professional sender plus SPF/DKIM/DMARC on your domain, so fewer emails land in spam |
| Free Gmail (e.g. `civicdesign.ainakheel@gmail.com`) | 100 recipients/day | Works fine at 8 emails/day |

Use the same account for every step below.

## 1. Create the Google Sheet

1. Go to <https://sheets.new> while signed in to the sending account.
2. Name it, for example **Civic Design – Email Campaigns**.

## 2. Add the Apps Script code

### Option A: copy and paste (no tools needed)

1. In the Sheet, open **Extensions → Apps Script**.
2. Click **Project Settings** (⚙️) and tick **Show "appsscript.json" manifest file in editor**.
3. Go back to **Editor** (`< >`).
4. Open `appsscript.json` and replace its content with [`apps-script/appsscript.json`](../apps-script/appsscript.json).
5. Delete the default `Code.gs`. Then, for every file in `apps-script/`, click **＋ → Script** (for `.gs` files) or **＋ → HTML** (for `.html` files). Type the name **without the extension** and paste the content:

   | Script files (＋ → Script) | HTML files (＋ → HTML) |
   |---|---|
   | Configuration, Database, ErrorHandler, ContactManager, EmailContentManager, EmailSender, UnsubscribeManager, CampaignManager, EmailScheduler, DashboardManager, Setup, Menu, WebApp, SelfTests | ControlPanel, ContentEditor, ImportDialog, Styles, Unsubscribe |

6. Click **💾 Save project**.

### Option B: `clasp` (for technical users)

```bash
npm install -g @google/clasp
```

```bash
clasp login
```

```bash
cd email-automation/apps-script
```

Copy the Script ID from Apps Script → Project Settings and create `.clasp.json` (see `.clasp.json.example`). Then:

```bash
clasp push
```

## 3. Run Setup (creates the database and turns on the cloud automation)

1. Reload the Google Sheet. After a few seconds a **📧 Email Automation** menu appears.
2. Click **📧 Email Automation → ⚙️ System → Setup / Repair System**.
3. Google asks for authorisation. Choose your account. If you see *"Google hasn't verified this app"*, click **Advanced → Go to (project) (unsafe)**. This is normal for a private script that you own. Then click **Allow**. The permissions are explained in [SECURITY_AND_COMPLIANCE.md](SECURITY_AND_COMPLIANCE.md).
4. Setup creates these sheets:

   | Sheet | Purpose |
   |---|---|
   | Dashboard | Live KPIs, campaign progress, system health |
   | Contacts | Your contact database (the 12 required fields plus Permission, Tags, Select, Date Added, Source, Notes) |
   | Campaigns | One row per campaign with schedule and counters |
   | Email Content | Your subjects and bodies (stored verbatim) |
   | Campaign Queue | One row per campaign × contact, the anti-duplicate ledger (managed automatically) |
   | Import | Paste area for bulk imports |
   | Suppression List | Emails or domains that must never be emailed |
   | Send Log / Error Log | Audit trail of every attempt and error |
   | Settings | All configurable limits and options |
   | Test Results | Output of the built-in self-tests |

   Setup also:
   - sets the spreadsheet time zone to **Asia/Dubai**
   - creates a secret key for unsubscribe links
   - adds your email as Draft content **CT-001**
   - installs three cloud triggers:
     - the scheduler, every 10 minutes
     - the inbox check (bounces and unsubscribe replies), hourly
     - maintenance and a daily report, at 06:00 Dubai time

You can run **Setup / Repair System** again at any time. It never deletes data.

## 4. Import your contacts

1. Click **📧 Email Automation → 📥 Import Contacts (CSV / Excel file)**.
2. Choose your file, for example `MANAGEMENT_COMPANY_LIST_1.xlsx`. A file with a single **Email** column works.
3. Optionally type a tag, for example `management-companies`.
4. Click **Import**.

The import:
- skips invalid addresses (your file has one row containing only `@`)
- skips duplicates and suppressed addresses
- assigns IDs `C0001`, `C0002`, …

Your current file has **351 valid, unique addresses**. At 8 per day, Monday to Friday, that is **44 sending days (about 9 weeks)**. Raise the daily limit if you want it to finish sooner.

Other ways to add contacts:
- paste rows into the **Import** sheet, then **Contacts → Import rows pasted in the "Import" sheet**
- add a single contact in the Control Panel → **Contacts**
- type directly into the Contacts sheet, then run **Contacts → Validate contacts & assign missing IDs**

## 5. Review your email content

1. Click **📧 Email Automation → ✏️ Content Editor**.
2. CT-001 already contains your subject, body, sender name, reply-to and signature. Check it carefully:
   - Your `[Click Here …] (:https://…)` text was turned into a clickable link **"Click Here to Submit Property Details"** in the HTML version. In the plain-text version it reads `… Details: https://forms.cloud.microsoft/r/rDGK2cpA0W?origin=lprLink`. Everything else is word-for-word as you supplied it.
   - Reply-To and signature use `civicdesign.ainakheel@gmail.com`, exactly as you wrote it. Confirm that is the correct spelling. The office is "Al **N**akheel Center", so check it isn't meant to be `alnakheel`.
3. Click **👁 Preview**, then **✉️ Send test email** to yourself. Check how it looks in Gmail and on your phone.
4. Set **Status = Ready** and click **💾 Save**. A campaign can only start with *Ready* content.

## 6. Deploy the one-click unsubscribe page (recommended, 2 minutes)

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click ⚙️ **Select type → Web app**.
3. Set **Description** to `Unsubscribe page`, **Execute as** to **Me**, and **Who has access** to **Anyone**.
4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
5. Open the Control Panel → **Settings** → paste it into **Unsubscribe web-app URL** → **Save settings**.

Each email footer then carries a personal, signed link. The recipient clicks it, confirms once, and is unsubscribed everywhere immediately.

If you skip this step, the footer uses a "reply to unsubscribe" email link instead. The hourly inbox check processes those replies automatically.

> When you change the code later, use **Deploy → Manage deployments → ✏️ → Version: New version**. This keeps the same URL.

## 7. Run the self-tests

Click **⚙️ System → Run self-tests**. The tests send nothing. Everything should pass, except the web-app check if you skipped step 6.

## 8. Test before going live

Follow [TESTING.md](TESTING.md). It uses **Test Mode** and a test tag, so no real contact receives anything during testing.

## 9. Create and start the real campaign

1. Open the Control Panel (**📧 Email Automation → 🧭 Open Control Panel**) and go to **New**.
2. Fill in the campaign:
   - **Name**
   - **Content:** CT-001
   - **Send to:** All contacts
   - **Start date**
   - **Daily limit:** 8
   - **Start sending at:** 09:00
   - **Days:** Mon–Fri
3. Click **Create & start**.

From now on, every sending day from 09:00 Dubai time, about 2 emails go out every 10 minutes until 8 have been sent. You can close the laptop.

## Updating the code later

Paste the changed files, or run `clasp push`, then run **⚙️ System → Setup / Repair System**. Your data is kept. If `WebApp.gs` changed, also publish a new web-app version (step 6 note).
