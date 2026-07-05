/**
 * Green Logistics registration webhook for Google Sheets
 *
 * Setup:
 * 1) Create a Google Sheet and copy its ID from URL.
 * 2) Open script.google.com -> New project.
 * 3) Paste this file contents.
 * 4) Set SHEET_ID and SHEET_NAME.
 * 5) Deploy -> New deployment -> Web app:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6) Copy Web app URL and put it into:
 *    assets/js/main.js -> SHEETS_ENDPOINT
 */

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Registrations";
const NOTIFICATION_EMAIL = "info@greengrouplogistics.com";

function doPost(e) {
  try {
    const body = parseBody_(e);
    const sheet = getSheet_();
    ensureHeader_(sheet);

    const row = [
      new Date(),
      value_(body.submittedAt),
      value_(body.page),
      value_(body.registrationType),
      value_(body.firstName),
      value_(body.lastName),
      value_(body.company),
      value_(body.phone),
      value_(body.mc),
      value_(body.dot),
      value_(body.trucks),
      value_(body.rawPayload) || JSON.stringify(body),
    ];

    sheet.appendRow(row);
    sendNotification_(body);
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: "Green Logistics registration webhook is running." });
}

function parseBody_(e) {
  if (e && e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  const contents = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
  return JSON.parse(contents || "{}");
}

function getSheet_() {
  if (!SHEET_ID || SHEET_ID === "PASTE_YOUR_SHEET_ID_HERE") {
    throw new Error("Set SHEET_ID in script before deployment.");
  }
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    "receivedAt",
    "submittedAt",
    "page",
    "registrationType",
    "firstName",
    "lastName",
    "company",
    "phone",
    "mc",
    "dot",
    "trucks",
    "rawPayload",
  ]);
}

function sendNotification_(body) {
  if (!NOTIFICATION_EMAIL) return;

  const subject = value_(body._subject) || "Registration - Green Logistics";
  const lines = [
    "New Green Logistics registration",
    "",
    "Registration type: " + value_(body.registrationType),
    "First name: " + value_(body.firstName),
    "Last name: " + value_(body.lastName),
    "Company: " + value_(body.company),
    "Phone: " + value_(body.phone),
  ];

  if (body.mc) lines.push("MC#: " + value_(body.mc));
  if (body.dot) lines.push("DOT#: " + value_(body.dot));
  if (body.trucks) lines.push("Trucks: " + value_(body.trucks));

  lines.push("", "Page: " + value_(body.page), "Submitted at: " + value_(body.submittedAt));

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: lines.join("\n"),
  });
}

function value_(v) {
  return v == null ? "" : String(v);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
