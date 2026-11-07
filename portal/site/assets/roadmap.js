// Client roadmap content (source: MLW Client Roadmaps). Shown privately to logged-in clients.
import { esc } from "/assets/common.js";

export var PHASES = [
  ["Agree the plan", "Tell us what you need. We confirm the work, fee and first delivery date."],
  ["Review the work", "You receive the agreed draft or advice. We explain what needs your approval."],
  ["See the progress", "We share proof of filing or dispatch when included. Each update tells you who acts next."],
  ["Get your handover", "You receive the agreed records, a plain-language summary and any remaining dates."],
];

// [category, what we do first, what we need from you, what happens outside our office, what you receive or confirm]
export var ROADMAP = [
  ["Civil recovery, declaration, injunction", "3–7 days for pleadings or response draft, with interim relief and evidence plan.", "Chronology, agreements, payment trail and relief sought.", "Scrutiny → service → pleadings → evidence → judgment. Interim relief is a separate milestone.", "Filed papers and acknowledgement, then order explained and execution options logged."],
  ["Property, possession, partition and rent", "4–8 days for document-gap and forum note or first draft, as scoped.", "Title or lease chain, site details, possession and notices.", "Service, records or inspection if required, evidence and order.", "Identify the property and operative directions. Record possession or enforcement as a separate task."],
  ["Contested matrimonial and custody", "3–7 days for first petition or reply, with interim maintenance or custody checklist as relevant.", "Marriage records, child arrangements and urgent concerns.", "Interim directions, counselling or mediation where applicable, evidence and order.", "Explain operative directions, next dates and compliance responsibilities."],
  ["Mutual consent and settlement", "3–5 days for draft terms after key terms and disclosures are available.", "Confirm consent, payments, property, child arrangements and attendance.", "First motion, applicable interval or waiver decision, second motion and decree.", "Signed terms and decree copy as scoped. Check agreed payments and handover."],
  ["Maintenance and domestic violence", "2–5 days for first draft and relief checklist. Urgent protection gets same-day triage.", "Income and expenses, dependants, orders and safety needs.", "Interim relief, service, disclosures, evidence and decision.", "Explain directions, payment dates and arrears or enforcement options."],
  ["Arrest, remand and bail", "Same-day triage on contact. Confirm availability and first viable action after custody and papers are checked.", "FIR, custody location, arrest or remand papers and hearing details.", "Production or remand, listing, hearing and order. Surety or release steps may follow.", "Record order, conditions, bail bonds and release follow-up if in scope."],
  ["Criminal complaints and trials, including CBI", "3–7 days for procedural plan or first scoped draft. Flag immediate defence or evidence steps.", "FIR or complaint, charge papers, orders, witnesses and evidence.", "Investigation or complaint process, charge, evidence, arguments and decision as applicable.", "Record stage completed, order, conditions and appeal or compliance choices."],
  ["NDPS and special-statute matters", "Same-day custody triage. 2–5 days for first record-based bail or defence note as scoped.", "FIR, seizure and sampling records, custody dates and orders.", "Reports, statutory restrictions, remand, applications and trial as applicable.", "Explain controlling orders, conditions and the verified next deadline."],
  ["Cheque dishonour, Section 138", "Same-day limitation screen. 1–3 days for notice or first defence note after essentials.", "Cheque, bank intimation, notice or service proof, transaction records.", "Notice and service, statutory waiting period, complaint, process, evidence or settlement.", "Record dispatch and service proof, verified filing date and recovery steps."],
  ["Juvenile Justice Board", "Same-day urgency screen. Confirm first action and arrangements after checking age and custody.", "Age records, guardian contact and orders through secure intake.", "Production, bail or placement, inquiry and applicable directions.", "Explain the order to authorised persons and record confidentiality and follow-up."],
  ["High Court writs and quashing", "3–7 days for grounds, maintainability note and first draft as scoped. Urgent relief gets early triage.", "Impugned action, dates, prior remedies and relevant record.", "Scrutiny and objections, listing, interim order, replies and decision.", "Record cleared objections, operative directions and implementation steps."],
  ["Appeal, revision, review and execution", "Same-day deadline screen. 3–7 days for first remedy or enforcement plan after record review.", "Order or decree, copy details, prior filings and compliance history.", "Copy availability, filing, notice, stay if sought, decision or enforcement.", "Record remedy filed or reasoned decision. Track compliance or recovery separately."],
  ["Consumer commissions", "3–7 days for complaint or reply draft, relief and loss schedule.", "Invoice, service records, communications, loss and remedy sought.", "Scrutiny, notice, response, evidence and decision or settlement.", "Explain awarded relief, compliance dates, appeal or enforcement options."],
  ["MACT compensation", "4–8 days for claim or defence draft and evidence-gap list.", "Accident, insurance, medical, income and dependency records as relevant.", "Service, insurer response, evidence, award and disbursement.", "Explain award and record deposit or disbursement steps if in scope."],
  ["DRT, CAT, service and labour", "3–7 days for forum, deadlines and first response or application plan.", "Demand or service orders, representations, contracts and records.", "Forum-specific scrutiny, interim application, hearing and disposal.", "Record order, amounts or service directions, compliance and remedies."],
  ["Notices, replies and opinions", "2–5 days for first draft or scoped written opinion. Screen service and reply deadlines on intake.", "Key documents, recipient details, objective and settlement authority.", "Dispatch and service, reply period, response or agreed escalation.", "Approved document, dispatch proof or signed opinion, with next action."],
  ["Agreements, vetting and due diligence", "3–7 days for first draft or mark-up, with risks and open issues.", "Commercial terms, parties, documents and decision-maker.", "Counterparty negotiation, approvals, signing and formalities as relevant.", "Clean final version, execution checklist and list of obligations or gaps."],
  ["Commercial and arbitration", "3–7 days for forum, clause and first action plan. Check pre-institution steps where applicable.", "Contract, correspondence, claims, amounts and urgency.", "Pre-institution process where applicable, appointment or filing, interim relief, hearing and outcome.", "Record settlement, award or order, then enforcement or challenge options."],
  ["Mediation and Lok Adalat", "2–5 days for settlement brief after instructions and documents.", "Priorities, authority to settle, payment terms and acceptable alternatives.", "Other side participation, session, approved terms and recording where applicable.", "Signed terms or recorded outcome, compliance dates and fallback decision."],
  ["Corporate retainer", "Confirm the request queue and first agreed output within 2–3 days after scope and inputs.", "Nominate approver, classify priorities and provide complete requests.", "Business approvals, regulatory filings and counterparty dependencies as relevant.", "Monthly report showing completed work, open items and decisions due."],
];

export var ROADMAP_NOTE = "Working-day targets begin after engagement, conflict clearance and receipt of essentials. Court, registry and authority dates are confirmed separately. Statutory deadlines and court directions take priority.";

export function findRoadmap(category) {
  if (!category) return null;
  var c = String(category).toLowerCase().trim();
  return ROADMAP.find(function (r) { return r[0].toLowerCase() === c; })
    || ROADMAP.find(function (r) { return r[0].toLowerCase().indexOf(c) === 0 || c.indexOf(r[0].toLowerCase()) === 0; })
    || null;
}

export function phaseBar(phase) {
  var p = Number(phase) || 0;
  return '<ol class="phases" aria-label="Matter progress">' + PHASES.map(function (ph, i) {
    var n = i + 1;
    var cls = n < p ? "done" : n === p ? "now" : "";
    return '<li class="ph' + n + (cls ? " " + cls : "") + '"' + (n === p ? ' aria-current="step"' : "") + '>'
      + '<span class="num">0' + n + "</span><span>" + esc(ph[0]) + "</span></li>";
  }).join("") + "</ol>";
}

export function roadmapTable(row) {
  var heads = ["What we do first", "What we need from you", "What happens outside our office", "What you receive or confirm"];
  return '<dl class="rm">' + heads.map(function (h, i) {
    return '<div class="rm' + (i + 1) + '"><dt>' + h + "</dt><dd>" + esc(row[i + 1]) + "</dd></div>";
  }).join("") + "</dl>";
}
