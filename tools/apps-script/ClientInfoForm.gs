/**
 * Master Legal Work: Client Information Form (before consultation)
 * One-time builder. Run createClientInfoForm() ONCE while signed in as masterlegalwork@gmail.com
 * (script.google.com > New project > paste > Run). It creates:
 *   1. Google Form "Master Legal Work — Client Information Form (before consultation)"
 *   2. Private Google Sheet "MLW Client Information Register" linked as the response destination
 *      (header row frozen, filter on, Status dropdown + Matter link columns)
 * Nothing is shared. The execution log prints the edit link, responder link and sheet link.
 */
function createClientInfoForm() {
  var form = FormApp.create('Master Legal Work — Client Information Form (before consultation)');
  form.setDescription(
    'Please complete this form before your consultation. Your consultation will be scheduled once we have your details.\n\n' +
    'Fields marked * are required. Please do not upload files here: share documents through a Google Drive link ' +
    'shared with masterlegalwork@gmail.com.\n\n' +
    'Submitting this form does not create an advocate–client relationship. Information on this form is not legal advice.');
  form.setCollectEmail(false);
  form.setRequireLogin(false);   // public responder link, no Google sign-in needed
  form.setLimitOneResponsePerUser(false);
  form.setAllowResponseEdits(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage('Thank you. We have received your details. Our chambers will contact you to schedule the consultation.');

  var emailV = FormApp.createTextValidation().requireTextIsEmail().setHelpText('Please enter a valid email address.').build();
  var phoneV = FormApp.createTextValidation().requireTextMatchesPattern('^\\+?[0-9 \\-]{10,15}$')
      .setHelpText('Please enter a valid mobile number (10 digits, with country code if outside India).').build();
  var ageV = FormApp.createTextValidation().requireNumberBetween(1, 120).setHelpText('Age in years.').build();

  form.addSectionHeaderItem().setTitle('Your details');
  form.addTextItem().setTitle('Full name').setRequired(true);
  form.addTextItem().setTitle('Age').setValidation(ageV);
  form.addMultipleChoiceItem().setTitle('Gender (optional)')
      .setChoiceValues(['Female', 'Male', 'Other', 'Prefer not to say']);
  form.addTextItem().setTitle('Mobile / WhatsApp number').setRequired(true).setValidation(phoneV);
  form.addTextItem().setTitle('Email').setRequired(true).setValidation(emailV);
  form.addParagraphTextItem().setTitle('Full address with city and PIN code').setRequired(true);
  form.addTextItem().setTitle('Occupation');
  form.addMultipleChoiceItem().setTitle('Preferred language')
      .setChoiceValues(['English', 'Hindi', 'Punjabi']).showOtherOption(true);
  form.addMultipleChoiceItem().setTitle('How did you find us?')
      .setChoiceValues(['Google search', 'Google Maps / Business Profile', 'Website', 'Referral by a client or friend',
                        'Referral by an advocate', 'Social media', 'Justdial / directory']).showOtherOption(true);

  form.addSectionHeaderItem().setTitle('Your matter');
  form.addListItem().setTitle('Type of matter').setRequired(true)
      .setChoiceValues(['Civil', 'Criminal / Bail', 'Matrimonial', 'Cheque bounce', 'Consumer', 'Property',
                        'Writ / Service', 'Arbitration', 'Corporate', 'Other']);
  form.addTextItem().setTitle('Court / forum and city (if a case is pending)');
  form.addTextItem().setTitle('Case number / CNR (if any)');
  form.addTextItem().setTitle('Opposite party name');
  form.addDateItem().setTitle('Next hearing date (if any)');
  form.addParagraphTextItem().setTitle('Brief facts / topic of consultation').setRequired(true)
      .setHelpText('A short, factual summary in your own words.');
  form.addParagraphTextItem().setTitle('Specific questions for the advocate');
  form.addTextItem().setTitle('Documents (Google Drive link)')
      .setHelpText('Put your documents in a Google Drive folder, share it with masterlegalwork@gmail.com, and paste the link here. Please do not send originals.');

  form.addSectionHeaderItem().setTitle('Consultation preferences');
  form.addMultipleChoiceItem().setTitle('Urgency').setChoiceValues(['Normal', 'Urgent']);
  form.addMultipleChoiceItem().setTitle('Preferred consultation mode').setChoiceValues(['In person', 'Phone', 'Video']);
  form.addDateTimeItem().setTitle('Preferred date and time');

  form.addSectionHeaderItem().setTitle('Consent and privacy');
  form.addCheckboxItem().setTitle('Consent (Digital Personal Data Protection Act, 2023)').setRequired(true)
      .setHelpText('Master Legal Work will use the information you give only for this consultation and for professional ' +
                   'record-keeping. It is kept confidential and not shared except as required by law. You may ask us at ' +
                   'any time to correct or delete your data by writing to masterlegalwork@gmail.com.')
      .setChoiceValues(['I consent to Master Legal Work processing my personal data for this consultation and record-keeping, ' +
                        'and I understand that submitting this form does not create an advocate–client relationship.']);

  // Response sheet: private, in masterlegalwork Drive
  var ss = SpreadsheetApp.create('MLW Client Information Register');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  Utilities.sleep(3000);
  ss = SpreadsheetApp.openById(ss.getId());
  var sh = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0] || ss.getSheets()[0];
  sh.setName('Responses');
  ss.getSheets().forEach(function (s) { if (s.getSheetId() !== sh.getSheetId() && s.getLastRow() === 0) ss.deleteSheet(s); });

  var lastCol = sh.getLastColumn();
  sh.getRange(1, lastCol + 1, 1, 2).setValues([['Status', 'Matter link']]);
  var status = SpreadsheetApp.newDataValidation()
      .requireValueInList(['New', 'Reviewed', 'Consultation booked', 'Closed'], true).setAllowInvalid(false).build();
  sh.getRange(2, lastCol + 1, sh.getMaxRows() - 1, 1).setDataValidation(status);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, lastCol + 2).setFontWeight('bold').setBackground('#F4EFE6');
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, sh.getMaxRows(), lastCol + 2).createFilter();

  // Default Status = New on each new response
  ScriptApp.newTrigger('mlwClientInfoOnSubmit').forSpreadsheet(ss).onFormSubmit().create();
  PropertiesService.getScriptProperties().setProperty('MLW_CLIENT_SHEET_ID', ss.getId());

  Logger.log('FORM EDIT LINK: ' + form.getEditUrl());
  Logger.log('FORM RESPONDER LINK: ' + form.getPublishedUrl());
  Logger.log('SHORT LINK: ' + form.shortenFormUrl(form.getPublishedUrl()));
  Logger.log('SHEET LINK: ' + ss.getUrl());
}

function mlwClientInfoOnSubmit(e) {
  var sh = e.range.getSheet();
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var c = head.indexOf('Status') + 1;
  if (c > 0 && !sh.getRange(e.range.getRow(), c).getValue()) sh.getRange(e.range.getRow(), c).setValue('New');
}
