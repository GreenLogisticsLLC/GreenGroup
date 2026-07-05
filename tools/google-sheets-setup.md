# Google Sheets setup (registration logs)

1. Open your Google Sheet and copy **Sheet ID** from URL.
2. Open [script.google.com](https://script.google.com/) and create a new project.
3. Copy code from:
   - `tools/google-sheets-registration-webhook.gs`
4. In script, set:
   - `SHEET_ID = "your_sheet_id"`
   - `SHEET_NAME = "Registrations"` (or your exact tab name)
5. Deploy:
   - **Deploy -> New deployment -> Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the **Web app URL**.
7. Open `assets/js/main.js` and paste URL into:
   - `SHEETS_ENDPOINT = "https://script.google.com/macros/s/.../exec"`
8. Save and publish site changes.

After that each Register submission is logged to the spreadsheet.

If you already deployed this integration, paste the updated Apps Script code and deploy a **new version** of the web app. The site posts registration fields as a regular form submit so the browser does not block the Google Apps Script request with CORS.
