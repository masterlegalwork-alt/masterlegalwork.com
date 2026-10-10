/**
 * Master Legal Work: unified website backend (Google Apps Script web app) - v3.
 * ONE Google Sheet "MLW Website Leads" (in the masterlegalwork@gmail.com Drive) receives every website form:
 *   tabs  Master | Consultation | Enquiry | Subscribe | Product order | Retainer | Revenue | Invoices
 * Every submission gets a Reference ID (MLW-YYMMDD-NNN), an IST timestamp, the source page, its type, all fields,
 * a Status dropdown (New / Contacted / Converted / Closed), a Follow-up date and Notes; and an instant tabular
 * email goes to masterlegalwork@gmail.com. Consultation requests also get the client acknowledgement email.
 * Revenue tab separates Professional fee from Product sales (turnover tracking). The MLW menu in the sheet
 * creates a Bill of Supply / Invoice PDF for a selected Revenue row (see SETUP.md for deployment).
 * Email subjects never contain case details (master prompt s.9.7).
 */
var TO = 'masterlegalwork@gmail.com';
var SHEET_NAME = 'MLW Website Leads';
var FOLDER = 'MLW Website';                 // Drive folder holding the sheet and the Invoices sub-folder
var FEE_PER_30 = {Normal: 5500, Urgent: 11000};
/* Written services booked through the consultation form (server-side, so a tampered browser value is ignored). */
var SERVICE_FEES = {
  'MLW Client Portal': 'Rs 11,000 per matter per year',
  'Written document review & opinion (48 hours)': 'Rs 16,500',
  'Drafting: legal notice': 'Rs 11,000',
  'Drafting: reply to legal notice': 'Rs 11,000',
  'Agreement / contract review': 'From Rs 16,500 (by length)'
};
/* Products and series: request flow until Cashfree is live (submit -> chambers confirm -> UPI/bank details sent with the confirmation). */
var PRODUCT_FEES = {
  'MLW Client Portal': 'Rs 11,000 per matter per year',
  'Drafting and formatting of court documents': 'From Rs 11,000 per document',
  'Section 138 NI Act complete draft kit': 'Rs 2,999', 'Bail draft kit (BNSS)': 'Rs 2,999', 'Recovery suit draft kit': 'Rs 2,999',
  'Judgment package: bail': 'Rs 1,499', 'Judgment package: cheque dishonour': 'Rs 1,499',
  'Case strategy note': 'From Rs 27,500', 'Document review and written opinion': 'Rs 16,500',
  'Video series: full unlock': 'Rs 2,499 per series'
};
var SCOPE = ' (subject to scope confirmation)';
var STATUSES = ['New', 'Contacted', 'Converted', 'Closed'];
var TYPES = {consultation: 'Consultation', enquiry: 'Enquiry', subscribe: 'Subscribe', product: 'Product order', retainer: 'Retainer'};
var FIXED = ['Reference ID', 'Timestamp (IST)', 'Source page', 'Type', 'Status', 'Follow-up date', 'Notes'];
var MASTER = FIXED.concat(['Name', 'Email', 'Phone', 'Summary']);
var REVENUE = ['Date', 'Reference ID', 'Revenue type', 'Client name', 'Client email', 'Client address', 'Client state', 'Client GSTIN (optional)',
  'Description', 'Amount (INR)', 'Expenses (INR)', 'Clerkage (INR)', 'Tax treatment', 'GST amount (INR)', 'Payment reference', 'Invoice no', 'Invoice PDF'];
var REV_TYPES = ['Professional fee', 'Product'];

/* ---- invoice settings: fill in before first use ---- */
var INV = {
  advocate: 'Gagandeep Goel, Advocate',
  firm: 'Master Legal Work',
  address: 'Chamber No. 422, 4th Floor, Distt. & Sessions Court, Sector 43, Chandigarh 160043',
  phone: '+91 9872206969', email: TO,
  pan: '',                       // read at run time from Script Properties 'PAN' (never committed); the PAN line prints only when it is set
  barEnrolment: 'P/1983/2007',   // Bar Council of Punjab & Haryana enrolment, shown in the header
  aadhaarMasked: '',             // built at run time from Script Property 'AADHAAR_LAST4' as 'XXXX XXXX ####' (never committed; never store the full number)
  showAadhaar: false,            // privacy: OFF by default; set true only if a client needs it on the bill
  tdsNote: 'The bill is not subject to any deduction except TDS.',
  gstin: '',                     // optional; leave '' unless registered
  showGstin: false,              // OFF by default
  prefix: 'MLW/',                // invoice number series: MLW/2026-27/0001
  supplierState: 'Chandigarh',
  productForwardGst: false,      // OFF: every bill is a Bill of Supply with no GST. Toggle: charge 18% GST (forward charge) on digital products, only after tax advice
  productGstRate: 18
};
/* Private identifiers live only in the deployed script's Script Properties (Project Settings > Script Properties). */
function loadPrivateInvoiceProps_() {
  var props = PropertiesService.getScriptProperties();
  var pan = String(props.getProperty('PAN') || '').trim().toUpperCase();
  var last4 = String(props.getProperty('AADHAAR_LAST4') || '').replace(/\D/g, '').slice(-4);
  INV.pan = pan;
  INV.aadhaarMasked = last4.length === 4 ? 'XXXX XXXX ' + last4 : '';
}
var RCM_NOTE = 'GST, if applicable, is payable by the recipient under reverse charge (Notification No. 13/2017-Central Tax (Rate)).';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    if (d._honey) return out({ok: true});                                   // bot trap
    var kind = d._form || 'consultation';
    if (!TYPES[kind]) return out({ok: false, error: 'Unknown form'});
    var cache = CacheService.getScriptCache(), rk = 'rl_' + kind + '_' + String(d.email || d.Mobile || d.Phone || '').toLowerCase();
    if (cache.get(rk)) return out({ok: false, error: 'Please wait a minute before sending again.'});
    cache.put(rk, '1', 60);
    var v = validate(kind, d); if (v) return out({ok: false, error: v});
    lock.waitLock(20000);
    var ref = (kind === 'consultation' && /^MLW-\d{6}-[A-Z0-9]{3,4}$/.test(d['Booking reference'] || '')) ? d['Booking reference'] : nextRef();
    var ts = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd.MM.yyyy HH:mm:ss');
    var page = d.Page || d.Source || '';
    var fields = {};
    Object.keys(d).forEach(function (k) { if (k.charAt(0) !== '_' && k !== 'Page' && k !== 'Source') fields[k] = String(d[k]).slice(0, 5000); });
    var ss = book();
    appendTyped(ss, TYPES[kind], ref, ts, page, fields);
    var phone = fields.Mobile || fields.Phone || '';
    var summary = kind === 'consultation' ? [fields['Service requested'], fields['Consultation type'], fields['Duration'], fields['Priority']].filter(String).join(' | ')
      : kind === 'retainer' ? [fields.Company, fields.Industry, fields['Approximate monthly volume']].filter(String).join(' | ')
      : kind === 'product' ? (fields.Product || '') : (fields.Subject || fields['Area of interest'] || '');
    var m = sheet(ss, 'Master', MASTER);
    m.appendRow([ref, ts, page, TYPES[kind], 'New', '', '', fields.Name || fields['Contact person'] || '', fields.email || '', phone, summary]);
    statusRule(m, m.getLastRow());
    lock.releaseLock();
    // instant tabular email to the chambers (no case details in the subject)
    var rows = [['Reference ID', ref], ['Received (IST)', ts], ['Type', TYPES[kind]], ['Source page', page]].concat(Object.keys(fields).map(function (k) { return [k === 'email' ? 'Email' : k, fields[k]]; }));
    var html = '<p>New website ' + esc(TYPES[kind].toLowerCase()) + ' received ' + ts + ' IST. Logged in "' + SHEET_NAME + '".</p><table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' +
      rows.map(function (r) { return '<tr><th style="text-align:left;padding:6px 10px;border:1px solid #ccc;background:#f4eee2;vertical-align:top">' + esc(r[0]) + '</th><td style="padding:6px 10px;border:1px solid #ccc;white-space:pre-wrap">' + esc(String(r[1])) + '</td></tr>'; }).join('') + '</table>';
    MailApp.sendEmail({to: TO, replyTo: validEmail(fields.email) ? fields.email : TO, subject: 'Website ' + TYPES[kind].toLowerCase() + ' ' + ref, htmlBody: html});
    if (kind === 'consultation' && validEmail(fields.email) && d._autoresponse)
      MailApp.sendEmail({to: fields.email, replyTo: TO, name: 'Master Legal Work', subject: 'Your request ' + ref + ': Master Legal Work', body: d._autoresponse});
    return out({ok: true, ref: ref});
  } catch (err) { try { lock.releaseLock(); } catch (x) {} return out({ok: false, error: String(err)}); }
}

function validate(kind, d) {
  var hasConsent = Object.keys(d).some(function (k) { return /^Consent/.test(k) && d[k]; });
  if (!hasConsent) return 'Consent required';
  if (kind === 'subscribe') return validEmail(d.email) ? '' : 'Valid email required';
  if (kind === 'enquiry') return (d.Name && validEmail(d.email)) ? '' : 'Name and a valid email are required';
  if (kind === 'retainer') return (d.Company && d['Contact person'] && validEmail(d.email)) ? '' : 'Company, contact person and a valid email are required';
  if (kind === 'product') {
    if (!(d.Product && validEmail(d.email))) return 'Product and a valid email are required';
    var key = /^Video series/.test(d.Product) ? 'Video series: full unlock' : d.Product;
    d['Fee'] = (PRODUCT_FEES[key] || 'To be confirmed') + SCOPE;                  // set on the server
    d['Status'] = 'Request received: chambers to confirm; UPI/bank details are sent with the confirmation';
    return '';
  }
  // consultation
  var req = ['Consultation type', 'Name', 'Mobile', 'email', 'Opposite party'];
  for (var i = 0; i < req.length; i++) if (!d[req[i]]) return 'Missing ' + req[i];
  if (['In person', 'Telephonic', 'WhatsApp', 'Video call'].indexOf(d['Consultation type']) < 0) return 'Invalid mode';
  var isSvc = d['Service requested'] && d['Service requested'] !== 'Consultation';
  if (!isSvc) {
    var mins = parseInt(d['Duration'], 10);
    if ([30, 60, 90, 120].indexOf(mins) < 0) return 'Invalid duration';
    var pr = d['Priority'] === 'Urgent' ? 'Urgent' : 'Normal'; d['Priority'] = pr;
    d['Fee (INR)'] = mins / 30 * FEE_PER_30[pr];                              // recomputed on the server
  } else { d['Duration'] = ''; d['Priority'] = ''; d['Fee (INR)'] = (SERVICE_FEES[d['Service requested']] || 'To be confirmed') + SCOPE; }
  d['Status'] = 'Slot and conflict check pending (no payment requested yet)';
  return '';
}

/* MLW-YYMMDD-NNN, NNN restarting at 001 each day (IST). Caller holds the script lock. */
function nextRef() {
  var day = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyMMdd'), p = PropertiesService.getScriptProperties();
  var n = (p.getProperty('day') === day ? parseInt(p.getProperty('n') || '0', 10) : 0) + 1;
  p.setProperties({day: day, n: String(n)});
  return 'MLW-' + day + '-' + ('00' + n).slice(-3);
}

function folder() { var it = DriveApp.getFoldersByName(FOLDER); return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER); }
function book() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('sheetId');
  if (id) try { return SpreadsheetApp.openById(id); } catch (e) {}
  var it = DriveApp.getFilesByName(SHEET_NAME), ss;
  if (it.hasNext()) ss = SpreadsheetApp.open(it.next());
  else {
    ss = SpreadsheetApp.create(SHEET_NAME); DriveApp.getFileById(ss.getId()).moveTo(folder());
    ss.getSheets()[0].setName('Master'); sheet(ss, 'Master', MASTER);
    Object.keys(TYPES).forEach(function (k) { sheet(ss, TYPES[k], FIXED); });
    var r = sheet(ss, 'Revenue', REVENUE);
    r.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(REV_TYPES, true).build());
    sheet(ss, 'Invoices', ['Invoice no', 'Date', 'Reference ID', 'Client', 'Title', 'Amount (INR)', 'GST (INR)', 'PDF']);
    ss.setSpreadsheetTimeZone('Asia/Kolkata');
  }
  p.setProperty('sheetId', ss.getId());
  return ss;
}
function sheet(ss, tab, header) {
  var sh = ss.getSheetByName(tab) || ss.insertSheet(tab);
  if (sh.getLastRow() === 0) { sh.appendRow(header); sh.setFrozenRows(1); sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#EEE8DF'); }
  return sh;
}
/* Type tab: fixed columns, then one column per field; new field names add new columns automatically. */
function appendTyped(ss, tab, ref, ts, page, fields) {
  var sh = sheet(ss, tab, FIXED), head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  Object.keys(fields).forEach(function (k) { if (head.indexOf(k) < 0) { head.push(k); sh.getRange(1, head.length).setValue(k).setFontWeight('bold').setBackground('#EEE8DF'); } });
  var row = head.map(function (h) { return h === 'Reference ID' ? ref : h === 'Timestamp (IST)' ? ts : h === 'Source page' ? page : h === 'Type' ? tab : h === 'Status' ? 'New' : (fields[h] || ''); });
  sh.appendRow(row); statusRule(sh, sh.getLastRow());
}
function statusRule(sh, r) {
  sh.getRange(r, 5).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).build());
  sh.getRange(r, 6).setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
}

/* ---------------- Revenue and invoices ---------------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('MLW').addItem('Create bill / invoice for selected Revenue row', 'invoiceForSelectedRow').addToUi();
}
function invoiceForSelectedRow() {
  var ss = SpreadsheetApp.getActive(), sh = ss.getActiveSheet();
  if (sh.getName() !== 'Revenue') return SpreadsheetApp.getUi().alert('Select a row in the Revenue tab first.');
  var r = sh.getActiveRange().getRow(); if (r < 2) return;
  var v = sh.getRange(r, 1, 1, REVENUE.length).getValues()[0], o = {};
  REVENUE.forEach(function (k, i) { o[k] = v[i]; });
  if (o['Invoice no']) return SpreadsheetApp.getUi().alert('This row already has invoice ' + o['Invoice no'] + '.');
  var res = makeInvoice(o);
  sh.getRange(r, REVENUE.indexOf('Tax treatment') + 1).setValue(res.treatment);
  sh.getRange(r, REVENUE.indexOf('GST amount (INR)') + 1).setValue(res.gst);
  sh.getRange(r, REVENUE.indexOf('Invoice no') + 1).setValue(res.no);
  sh.getRange(r, REVENUE.indexOf('Invoice PDF') + 1).setValue(res.url);
  sheet(ss, 'Invoices', ['Invoice no', 'Date', 'Reference ID', 'Client', 'Title', 'Amount (INR)', 'GST (INR)', 'PDF']).appendRow([res.no, res.date, o['Reference ID'], o['Client name'], res.title, res.total, res.gst, res.url]);
  SpreadsheetApp.getUi().alert(res.title + ' ' + res.no + ' saved to Drive. It has NOT been emailed; send it yourself after checking.');
}
function nextInvoiceNo() {
  var now = new Date(), y = parseInt(Utilities.formatDate(now, 'Asia/Kolkata', 'yyyy'), 10), mo = parseInt(Utilities.formatDate(now, 'Asia/Kolkata', 'M'), 10);
  var fy = mo >= 4 ? y + '-' + String(y + 1).slice(-2) : (y - 1) + '-' + String(y).slice(-2);
  var p = PropertiesService.getScriptProperties(), key = 'inv_' + fy, n = parseInt(p.getProperty(key) || '0', 10) + 1;
  p.setProperty(key, String(n));
  return INV.prefix + fy + '/' + ('000' + n).slice(-4);
}
/* Professional fees of an individual advocate are never charged GST by the advocate: exempt (Notification 12/2017-CT(Rate),
   entry 45) or, for a business entity above the threshold, payable by the recipient under reverse charge (Notification
   13/2017-CT(Rate), serial 2). So professional fees always produce a Bill of Supply, with the RCM note when the client is a
   business (client GSTIN given). Products produce a Tax Invoice with GST only if INV.productForwardGst is switched on. */
function makeInvoice(o) {
  loadPrivateInvoiceProps_();
  var amount = Number(o['Amount (INR)']) || 0, expenses = Number(o['Expenses (INR)']) || 0, clerkage = Number(o['Clerkage (INR)']) || 0, isProduct = o['Revenue type'] === 'Product', business = !!String(o['Client GSTIN (optional)'] || '').trim();
  var gst = 0, title = 'Bill of Supply', treatment, taxRows = '';
  if (isProduct && INV.productForwardGst) {
    title = 'Tax Invoice'; gst = Math.round(amount * INV.productGstRate) / 100;
    var inter = o['Client state'] && String(o['Client state']).toLowerCase() !== INV.supplierState.toLowerCase();
    taxRows = inter ? row('IGST @ ' + INV.productGstRate + '%', gst) : row('CGST @ ' + INV.productGstRate / 2 + '%', gst / 2) + row('UTGST/SGST @ ' + INV.productGstRate / 2 + '%', gst / 2);
    treatment = 'Forward charge GST ' + INV.productGstRate + '%';
  } else if (!isProduct && business) { treatment = 'Reverse charge (recipient pays), Notif. 13/2017-CT(Rate)'; }
  else { treatment = isProduct ? 'No GST charged (forward-charge toggle off)' : 'Exempt, Notif. 12/2017-CT(Rate) entry 45'; }
  var no = nextInvoiceNo(), date = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd.MM.yyyy'), total = amount + expenses + clerkage + gst;
  var note = (!isProduct) ? '<p class="n">' + esc(RCM_NOTE) + '</p>' : (title === 'Bill of Supply' ? '<p class="n">No GST has been charged on this supply.</p>' : '');
  var html = '<html><head><style>body{font-family:Georgia,serif;color:#2A2723;font-size:12px;margin:36px}h1{font-weight:normal;letter-spacing:.12em;text-transform:uppercase;font-size:18px;border-bottom:1px solid #A98D52;padding-bottom:8px}' +
    'table{width:100%;border-collapse:collapse;margin-top:14px}td,th{border:1px solid #D6CEC0;padding:7px;text-align:left}th{background:#EEE8DF}.r{text-align:right}.n{font-size:11px;color:#5C564E;margin-top:16px}.two{display:flex;justify-content:space-between;gap:24px}</style></head><body>' +
    '<h1>' + title + '</h1><div class="two"><div><b>' + esc(INV.advocate) + '</b><br>' + esc(INV.firm) + '<br>' + esc(INV.address) + '<br>' + esc(INV.phone) + ' &middot; ' + esc(INV.email) +
    (INV.barEnrolment ? '<br>Bar Enrolment: ' + esc(INV.barEnrolment) : '') +
    (INV.pan ? '<br>PAN: ' + esc(INV.pan) : '') + (INV.showGstin && INV.gstin ? '<br>GSTIN: ' + esc(INV.gstin) : '') + (INV.showAadhaar && INV.aadhaarMasked ? '<br>Aadhaar: ' + esc(INV.aadhaarMasked) : '') + '</div><div><b>No.</b> ' + esc(no) + '<br><b>Date</b> ' + date + '<br><b>Reference</b> ' + esc(String(o['Reference ID'] || '')) + '</div></div>' +
    '<p style="margin-top:18px"><b>Billed to</b><br>' + esc(String(o['Client name'] || '')) + '<br>' + esc(String(o['Client address'] || '')) + (o['Client state'] ? '<br>State: ' + esc(String(o['Client state'])) : '') +
    (business ? '<br>GSTIN: ' + esc(String(o['Client GSTIN (optional)'])) : '') + '</p>' +
    '<table><tr><th>Description</th><th class="r">Amount (INR)</th></tr>' + row(isProduct ? String(o.Description || 'Legal product') : 'Professional fee' + (o.Description ? ': ' + String(o.Description) : ''), amount) +
    (isProduct ? '' : row('Expenses', expenses) + row('Clerkage', clerkage)) + taxRows +
    '<tr><th>Total</th><th class="r">' + total.toFixed(2) + '</th></tr></table>' +
    (o['Payment reference'] ? '<p>Payment received: ' + esc(String(o['Payment reference'])) + '</p>' : '') + note + '<p class="n">' + esc(INV.tdsNote) + '</p></body></html>';
  var blob = Utilities.newBlob(html, 'text/html', no.replace(/\//g, '-') + '.html').getAs('application/pdf').setName(no.replace(/\//g, '-') + '.pdf');
  var f = invFolder().createFile(blob);
  return {no: no, date: date, title: title, total: total, gst: gst, treatment: treatment, url: f.getUrl()};
}
function row(d, a) { return '<tr><td>' + esc(d) + '</td><td class="r">' + Number(a).toFixed(2) + '</td></tr>'; }
function invFolder() { var p = folder(), it = p.getFoldersByName('Invoices'); return it.hasNext() ? it.next() : p.createFolder('Invoices'); }

function validEmail(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '')); }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
/* Run once from the editor to create the sheet and authorise Gmail/Drive/Sheets. */
function setup() { book(); }
