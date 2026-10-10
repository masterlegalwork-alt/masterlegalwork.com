# MLW Website Leads: deployment (one-time, about 15 minutes)

Everything runs inside the **masterlegalwork@gmail.com** Google account. Nothing is sent anywhere else.

## 1. Create the sheet and the script
1. Sign in to Google Drive as masterlegalwork@gmail.com. New > Google Sheets. Name it exactly **MLW Website Leads**.
2. In the sheet: Extensions > Apps Script. Delete the sample code and paste the whole of `Code.gs`.
3. The `INV` block at the top of `Code.gs` is pre-filled: PAN AHIPG0903D (`showPan: true`), Bar Enrolment P/1983/2007 in the header, masked Aadhaar 'XXXX XXXX 2856' behind `showAadhaar` (OFF by default, for privacy), and the note 'The bill is not subject to any deduction except TDS.' Leave `gstin` empty and `showGstin: false` unless registered, and `productForwardGst: false` until your tax adviser confirms GST on digital products. In the Revenue tab, enter Amount (professional fee), Expenses and Clerkage separately; the bill lists them as three line items (Professional fee / Expenses / Clerkage) and totals them.
4. Select the function `setup` and click Run. Approve the permissions (Sheets, Drive, Gmail). This creates the tabs:
   **Master, Consultation, Enquiry, Subscribe, Product order, Retainer, Revenue, Invoices** and a Drive folder **MLW Website** (with an **Invoices** sub-folder).

## 2. Publish the web app
1. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy.
2. Copy the Web app URL. In the website file `assets/js/config.js`, set `appsScriptUrl: "<that URL>"`, rebuild and publish.
3. Test: send one enquiry from the site. Within a minute you should see a row in **Master** and **Enquiry**, and a tabular email titled `Website enquiry MLW-YYMMDD-001`.

## 3. How leads are recorded
- Every form (consultation, enquiry, subscribe, product order, corporate retainer) is one row in **Master** and one row in its own tab.
- Columns: Reference ID (`MLW-YYMMDD-NNN`, numbering restarts daily; consultation requests keep the booking reference shown to the client), Timestamp (IST), Source page, Type, **Status** (dropdown: New / Contacted / Converted / Closed), **Follow-up date** (date picker), **Notes**, then every field of the form. New form fields add new columns automatically.
- An instant email with all fields in a table goes to masterlegalwork@gmail.com. Subjects carry only the type and reference, never case details.
- Rate limit: one submission per minute per email/phone. A hidden honeypot field drops bots.

## 4. Revenue, bills and invoices
- When a payment is received, add a row to **Revenue**: Date, Reference ID, **Revenue type** (dropdown: *Professional fee* or *Product*), client details, description, amount, payment reference. This keeps professional fees and product sales separate for turnover tracking.
- Select the row, then menu **MLW > Create bill / invoice for selected Revenue row**. A PDF is saved in Drive > MLW Website > Invoices and linked in the row and in **Invoices**. It is **not emailed automatically**: check it, then send it yourself.
- Numbering: `MLW/2026-27/0001`, restarting each financial year (April).
- Professional fees always produce a **Bill of Supply**: an individual advocate's legal services are exempt (Notification No. 12/2017-Central Tax (Rate), entry 45) for individuals and for business entities within the registration-exemption turnover, and for other business entities GST is payable by the recipient under reverse charge (Notification No. 13/2017-Central Tax (Rate), serial 2). The bill carries the note: *"GST, if applicable, is payable by the recipient under reverse charge (Notification No. 13/2017-Central Tax (Rate))."* Enter the client's GSTIN when the client is a business.
- Products: Bill of Supply with no GST while `productForwardGst` is false. Switching it to true (after tax advice and registration) issues a **Tax Invoice** with 18% GST (CGST + UTGST/SGST within Chandigarh, IGST for other States).
- Please have a chartered accountant confirm the tax treatment and the bill format before first use.

## 5. Privacy
- The sheet is private to masterlegalwork@gmail.com. Do not share it. Retention periods are in the website privacy notice; delete rows when they expire.
