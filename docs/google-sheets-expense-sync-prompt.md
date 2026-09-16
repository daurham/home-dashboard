# Prompt: Google Sheets → household weekly expenses (read-only sync)

Paste this into a coding agent in the **home-dashboard** / **home-ai** workspace after filling in **Your config**. Do not invent Drive IDs, sheet URLs, or column letters—if a value is still `REPLACE_ME`, stop and ask.

The finance spreadsheet is **source of truth**. The wife must not be asked to change how she logs. If she later standardizes layout, update **Your config** only; do not redesign the product.

If she replaces the register with a totally different workbook (new meaning of columns, income mixed differently, not a monthly file-per-month), stop and revisit the original discussion rather than guessing.

---

## Your config

Fill every `REPLACE_ME`. Leave heuristics in place where you are unsure.

```
# Google / Drive
GOOGLE_CLOUD_PROJECT_ID=REPLACE_ME
GOOGLE_SERVICE_ACCOUNT_JSON_PATH=REPLACE_ME          # e.g. /secrets/google-sheets-readonly.json — never commit the JSON
GOOGLE_SHARED_DRIVE_OR_FOLDER_URL=REPLACE_ME         # folder that contains the monthly workbooks
GOOGLE_FOLDER_ID=REPLACE_ME                          # from the folder URL: .../folders/THIS_PART
DRIVE_IS_SHARED_DRIVE=REPLACE_ME                     # true | false (Shared Drive vs “folder in My Drive”)

# Monthly workbook naming (new Google spreadsheet file each month in that folder)
# Example: if files are "September 2026" or "2026-09 Finance", write the real pattern.
MONTHLY_FILENAME_PATTERN=REPLACE_ME                  # human description + regex if you have one
# Regex against the file name; use capture groups if useful. Example: (?<year>\d{4})-(?<month>\d{2})
MONTHLY_FILENAME_REGEX=REPLACE_ME

# Which tab inside the workbook is the expense register (often 2nd or 3rd, not gid=0)
# Prefer names; fall back to header sniffing. Do not assume tab index 0.
EXPENSE_TAB_NAME_HINTS=REPLACE_ME                    # comma-separated, e.g. Register, Checking, September, Expenses
EXPENSE_TAB_HEADER_MUST_INCLUDE=REPLACE_ME           # e.g. date, transaction  (lowercase substrings)

# Layout of THAT tab (A1-style). Use letters as they appear today; fill-down blank dates.
SHEET_HEADER_ROW=REPLACE_ME                          # 1-based row where column titles live (screenshot was ~row 2)
COL_DATE=REPLACE_ME                                  # e.g. A
COL_DESCRIPTION=REPLACE_ME                           # e.g. B
COL_SPEND_AMOUNT=REPLACE_ME                          # the column that holds grocery/out amounts (NOT running balance)
COL_INCOME_AMOUNT=REPLACE_ME                         # paycheck/credit column if separate; or SAME as spend with sign
COL_RUNNING_BALANCE=REPLACE_ME                       # ignore for imports; e.g. E and/or F
COL_AP_OR_NOTES=REPLACE_ME                           # e.g. G  (a/p alaska) — used to EXCLUDE rows
# Extra note columns if needed
COL_SIDE_NOTES=REPLACE_ME                            # e.g. I / J  (“in bill pay”) — exclude from weekly envelope

# Dates in the sheet (often M/D with no year)
DATE_TIMEZONE=America/Phoenix
DATE_DEFAULT_YEAR_RULE=file-month                    # use the year/month of the workbook being synced

# What counts toward the dashboard weekly envelope (non-bill, non-A/P)
INCLUDE_DESCRIPTION_PREFIXES=REPLACE_ME              # e.g. GROCERY, OUT, WELLNESS
EXCLUDE_DESCRIPTION_PREFIXES=REPLACE_ME              # e.g. paycheck
EXCLUDE_IF_AP_CELL_CONTAINS=REPLACE_ME               # e.g. a/p, amazon, alaska  (tune so real groceries are not dropped)
EXCLUDE_HSA_OR_BLUE_ROWS=REPLACE_ME                  # true | false | unknown  (font color if true; skip if unknown)
CREDIT_CARD_OVERSPEND_STILL_COUNTS=true              # red “put on card” is still weekly spend unless you set false

# Map sheet text → existing dashboard categories (names must match DB or create once)
# Groceries, Travel, Entertainment, Home already exist; add others if needed (e.g. Dining, Wellness)
CATEGORY_MAP=REPLACE_ME
# Example:
#   GROCERY → Groceries
#   OUT → Dining          (create Dining if missing)
#   WELLNESS → Home       (or Wellness)

# paid_by when importing (dashboard allows Jake | Wife | Both, free text max 40)
IMPORT_PAID_BY=Wife

# Schedule (home box, Arizona, no DST)
SYNC_TIMEZONE=America/Phoenix
SYNC_HOUR_LOCAL=6
SYNC_MINUTE_LOCAL=0
# Also expose a manual “Sync now” on the Expenses tab.

# Optional last-known-good (agent may leave blank)
LAST_KNOWN_SPREADSHEET_ID=REPLACE_ME
LAST_KNOWN_TAB_GID=REPLACE_ME
```

---

## Product intent

Wife logs **all** household money in Google Sheets (register: paychecks, groceries, eating out, wellness, A/P, bill pay, running balance). She creates a **new spreadsheet file each month** in a **shared Drive folder**, with a stable naming pattern. The expense register is **not always the first tab**.

The home dashboard expense module is **only** the weekly envelope: Friday 00:00 through Thursday 23:59:59 in `America/Phoenix`, default budget $150, non-bill spending. It must stay accurate **without her logging twice** and **without her changing the sheet**.

Dashboard expenses that she never puts on the sheet (rare) may still be entered manually. Imported rows must not duplicate those, and manual rows must not be deleted by sync.

---

## Repos and stack

- UI: `home-dashboard` (Vite/React, Expenses tab + home Expense Logger, Zustand → `/api/expenses`).
- API + DB: `home-ai` `node-api` + Postgres. Money is **integer cents**. Soft delete via `deleted_at`.
- Table `expenses`: `amount_cents`, `currency`, `category_id`, `note`, `paid_by`, `occurred_on` (DATE).
- Weeks: `occurred_on` calendar date; week key is the **Friday** of the Fri–Thu range (`home-ai/node-api/lib/expenseWeek.js`, dashboard `src/lib/expenses/weekRange.ts`).
- Deploy: Docker on the home box; LAN `/api`. Secrets in env/files, not git.
- Do not commit unless asked. Do not force-push.

---

## What to build

### 1. Google read-only client

- Service account JSON from `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`.
- Drive API: list spreadsheets in `GOOGLE_FOLDER_ID` (`supportsAllDrives` if `DRIVE_IS_SHARED_DRIVE`).
- Sheets API: read used range of the chosen tab (values + optionally cell formats if `EXCLUDE_HSA_OR_BLUE_ROWS=true`).
- Scopes: Drive readonly + Spreadsheets readonly. Share the **folder** (or Shared Drive) with the service account once.

### 2. Resolve “this month’s workbook”

- Now in `SYNC_TIMEZONE`.
- List files in the folder, filter by `MONTHLY_FILENAME_REGEX` / pattern.
- Pick the file for the current calendar month. If none yet (1st of month), **keep last successful import**; do not empty expenses.
- If multiple matches, newest `modifiedTime` wins; log a warning.

### 3. Resolve the expense tab

Never assume sheet index 0.

1. Tab title matches `EXPENSE_TAB_NAME_HINTS` (case-insensitive).
2. Else scan tabs: header row (`SHEET_HEADER_ROW`) contains `EXPENSE_TAB_HEADER_MUST_INCLUDE`.
3. Else fail the run (see Safety).

Cache spreadsheet id + gid after a successful parse; still re-detect when the **file id** changes (new month).

### 4. Parse rows

- Fill-down `COL_DATE` when blank.
- Parse `M/D` or `M/D/YY` using `DATE_DEFAULT_YEAR_RULE` (workbook’s month/year). Output `YYYY-MM-DD` for `occurred_on`.
- Amount: `COL_SPEND_AMOUNT` only for included rows. Ignore running balance columns.
- Description: `COL_DESCRIPTION`.
- Skip empty rows and rows with no amount.
- Apply include/exclude prefix lists.
- Exclude if `COL_AP_OR_NOTES` / `COL_SIDE_NOTES` match `EXCLUDE_IF_AP_CELL_CONTAINS` (do not exclude a grocery row just because a neighboring totals cell mentions Alaska unless the config says so).
- Note field: description text, truncated to 500 chars.

If required columns are missing or >N% of “included” rows have unparsable dates/amounts, **abort the run**.

### 5. Upsert into Postgres (do not replace the whole table)

Add import provenance so sync is idempotent, e.g.

- `source` = `google_sheets`
- `external_key` unique: `spreadsheetId + gid + occurred_on + normalized description + amount_cents`  
  (or row number **within that file+tab** if the sheet is stable enough—prefer a key that survives reordering if possible; document the choice)

Behavior:

- New key → INSERT (category from `CATEGORY_MAP`, `paid_by` = `IMPORT_PAID_BY`).
- Same key, different amount/note/date → UPDATE that row only.
- Keys that were imported from **this month’s file** but disappeared from the sheet → soft-delete (`deleted_at`) those import rows only.
- Never delete or alter rows where `source` is not `google_sheets` (manual dashboard entries).

Migration SQL must be additive and documented (home-ai `postgres/migrate_*.sql`). `init.sql` for fresh volumes.

### 6. Daily schedule + manual Sync

- In **node-api** (same Docker service): run at `SYNC_HOUR_LOCAL`:`SYNC_MINUTE_LOCAL` in `SYNC_TIMEZONE`.
- Manual: `POST /api/expenses/sheets-sync` (LAN, same auth style as other household APIs).
- Expenses UI: “Sync from sheet” + last success/failure time and a one-line error (file not found, tab not found, layout mismatch). Do not block the rest of the dashboard.

### 7. Tests

- Parser: fill-down dates, skip paycheck, skip a/p, map GROCERY, `9/2` → year of file.
- Upsert: insert, update amount, do not touch manual rows, abort on garbage layout.
- Month rollover: no file for new month → no wipe.

---

## Safety and ops

- Dry-run log: file name, tab, row counts included/excluded, before first production write (or env `SHEETS_SYNC_DRY_RUN`).
- Credentials never in the frontend or git.
- Quota: one scheduled pull per day + rare manual; batch Drive/Sheets calls.
- If Google returns 403, the error should say the service account needs access to the folder.

---

## Out of scope

- Changing the wife’s spreadsheet.
- Bank/Plaid feeds.
- Turning the dashboard into a full check register (income, A/P, running balance).
- Writing back to Google.
- Guessing a new layout if **Your config** is still `REPLACE_ME`.

---

## Implementation order

1. Migration + `external_key` / `source`.
2. Config from env (folder id, regex, column letters, schedule).
3. Drive file picker + tab picker (unit-testable).
4. Row parser (unit-testable with a fixture copied from a real export, PII stripped).
5. Upsert.
6. Cron + POST sync + small UI status.
7. Document the one-time Google Cloud + folder share steps in a short comment or existing README only if the user asks for docs; the agent should still print those steps in the chat when done.

---

## Done when

- A new monthly file in the shared folder, named per pattern, is picked up the next scheduled run with no URL paste.
- The register tab is found even if it is 2nd or 3rd.
- Grocery/out-style rows show on the dashboard week/month views; paychecks and A/P do not.
- Manual expenses remain.
- Failed detection does not clear the week.
```
