/* Master Legal Work site settings. ONE-TIME STEPS: fill these in, then rebuild/redeploy.
   appsScriptUrl    = Google Apps Script web-app URL (tools/apps-script/Code.gs) -> Google Sheet client database + emails
   bookingUrl       = Google Calendar appointment schedule (normal slots) booking page, legalcarepro
   urgentBookingUrl = separate urgent appointment schedule (from 1:30 PM)
   cashfreeUrl      = Cashfree payment link once the account is active                                   */
window.MLW_CONFIG = { appsScriptUrl: "", bookingUrl: "", urgentBookingUrl: "", cashfreeUrl: "", email: "masterlegalwork@gmail.com", base: "", serviceFees: { "MLW Client Portal": {amt: 11000, from: false, unit: "per matter per year"}, "Written document review & opinion (48 hours)": {amt: 16500, from: false}, "Drafting: legal notice": {amt: 11000, from: false}, "Drafting: reply to legal notice": {amt: 11000, from: false}, "Agreement / contract review": {amt: 16500, from: true, note: "by length"} } };
