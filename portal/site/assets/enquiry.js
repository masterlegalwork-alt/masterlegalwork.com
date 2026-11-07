import { createFormStore, FORM_ERROR, otherText, otherValue } from "/js/wix/form-store.js";
import { esc } from "/assets/common.js";

var formEl = document.getElementById("enquiry");
var FORM_ID = formEl.getAttribute("data-form-id") || "7ace60cc-7bde-4a60-ab5f-efed6656982e";
var THANKS = formEl.getAttribute("data-thanks") || "Thank you. Your enquiry has been received. Our office will contact you shortly.";
var store = createFormStore({ formId: FORM_ID });
var drawnKey = "";

function inputType(c) {
  return { email: "email", url: "url", phone: "tel", password: "password", number: "number", date: "date", time: "time", datetime: "datetime-local" }[c] || "text";
}

function fieldHtml(f, s) {
  var v = s.values[f.target];
  var id = "f-" + f.target;
  var req = f.required ? ' <span aria-hidden="true">*</span>' : "";
  var label = f.showLabel === false ? "" : f.label;
  var html = '<div data-wrap="' + esc(f.target) + '">';
  switch (f.control) {
    case "checkbox":
      html += '<label class="check"><input id="' + id + '" name="' + esc(f.target) + '" type="checkbox"' + (v === true ? " checked" : "") + "><span>" + esc(f.label) + req + "</span></label>";
      break;
    case "textarea":
      html += '<label for="' + id + '">' + esc(label) + req + "</label>"
        + '<textarea id="' + id + '" name="' + esc(f.target) + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "")
        + (f.validation && f.validation.maxLength ? ' maxlength="' + f.validation.maxLength + '"' : "") + ">" + esc(v || "") + "</textarea>";
      break;
    case "select":
    case "radio":
      var other = f.otherOption ? otherText(f, v) : null;
      html += '<label for="' + id + '">' + esc(label) + req + "</label>"
        + '<select id="' + id + '" name="' + esc(f.target) + '" data-choice><option value="">Select</option>'
        + (f.choices || []).map(function (c) { return '<option value="' + esc(c.value) + '"' + (v === c.value ? " selected" : "") + ">" + esc(c.label) + "</option>"; }).join("")
        + (f.otherOption ? '<option value="__other"' + (other != null ? " selected" : "") + ">" + esc(f.otherOption.label || "Other") + "</option>" : "")
        + "</select>"
        + (f.otherOption ? '<input type="text" data-other="' + esc(f.target) + '" aria-label="Please specify" placeholder="Please specify"' + (other != null ? "" : " hidden") + ' value="' + esc(other || "") + '" style="margin-top:8px">' : "");
      break;
    case "payment":
    case "appointment":
    case "unknown":
    case "file":
    case "signature":
      html += "<label>" + esc(label) + '</label><p class="help">Please send this to our office by email.</p>';
      break;
    default:
      html += '<label for="' + id + '">' + esc(label) + req + "</label>"
        + '<input id="' + id + '" name="' + esc(f.target) + '" type="' + inputType(f.control) + '"' + (f.placeholder ? ' placeholder="' + esc(f.placeholder) + '"' : "")
        + ' value="' + esc(v == null ? "" : v) + '"' + (f.readOnly ? " disabled" : "") + ">";
  }
  if (f.description) html += '<p class="help">' + esc(f.description) + "</p>";
  html += '<p class="err" role="alert" data-err="' + esc(f.target) + '"></p></div>';
  return html;
}

function render(s) {
  if (s.outcome) {
    if (s.outcome.url) { if (s.outcome.newTab) window.open(s.outcome.url, "_blank"); else location.assign(s.outcome.url); return; }
    var msg = s.outcome.message ? s.outcome.message.split("\n").map(esc).join("<br>") : THANKS;
    formEl.innerHTML = '<div class="success">' + msg + "</div>";
    drawnKey = "done";
    return;
  }
  if (!s.form) {
    formEl.innerHTML = s.errors && s.errors[FORM_ERROR]
      ? '<p class="err">' + esc(s.errors[FORM_ERROR]) + "</p>"
      : '<p class="muted">Loading form…</p>';
    return;
  }
  if (s.closed) {
    formEl.innerHTML = '<p class="notice">' + esc(s.form.disabledMessage || "This form is not accepting enquiries right now. Please contact our office.") + "</p>";
    return;
  }
  var stepId = s.form.steps[s.step] && s.form.steps[s.step].id;
  var visible = s.form.fields.filter(function (f) { return !stepId || !f.stepId || f.stepId === stepId; });
  var key = s.step + ":" + visible.map(function (f) { return f.target; }).join(",");
  if (key !== drawnKey) {
    var last = s.step >= s.form.steps.length - 1;
    formEl.innerHTML = visible.map(function (f) { return fieldHtml(f, s); }).join("")
      + '<p class="err" data-formerr></p>'
      + '<div class="form-actions">'
      + (s.step > 0 ? '<button type="button" class="linkbtn" data-prev>' + esc(s.form.previousText || "Back") + "</button>" : "")
      + '<button class="btn btn-brass" type="submit" data-go>' + esc(last ? (s.form.submitText || "Submit Enquiry") : (s.form.nextText || "Next")) + "</button></div>";
    drawnKey = key;
  }
  visible.forEach(function (f) {
    var err = s.errors[f.target];
    var errEl = formEl.querySelector('[data-err="' + CSS.escape(f.target) + '"]');
    if (errEl) errEl.textContent = err || "";
    var ctl = formEl.querySelector('[name="' + CSS.escape(f.target) + '"]');
    if (ctl) { if (err) ctl.setAttribute("aria-invalid", "true"); else ctl.removeAttribute("aria-invalid"); }
  });
  var fe = formEl.querySelector("[data-formerr]");
  if (fe) fe.textContent = s.errors[FORM_ERROR] || "";
  var go = formEl.querySelector("[data-go]");
  if (go) { go.disabled = !!s.loading; go.setAttribute("aria-busy", String(!!s.loading)); }
}

function fieldOf(target) {
  var s = store.getState();
  return s.form ? s.form.fields.find(function (f) { return f.target === target; }) : null;
}

formEl.addEventListener("input", function (e) {
  var t = e.target;
  if (t.dataset.other) { var fo = fieldOf(t.dataset.other); if (fo) store.setValue(fo.target, otherValue(fo, t.value)); return; }
  if (!t.name || t.type === "checkbox" || t.dataset.choice !== undefined) return;
  store.setValue(t.name, t.value);
});
formEl.addEventListener("change", function (e) {
  var t = e.target;
  if (t.type === "checkbox" && t.name) { store.setValue(t.name, t.checked); return; }
  if (t.dataset.choice !== undefined && t.name) {
    var f = fieldOf(t.name);
    var otherInput = formEl.querySelector('[data-other="' + CSS.escape(t.name) + '"]');
    if (t.value === "__other" && f) {
      if (otherInput) { otherInput.hidden = false; otherInput.focus(); }
      store.setValue(f.target, otherValue(f, otherInput ? otherInput.value : ""));
    } else {
      if (otherInput) otherInput.hidden = true;
      store.setValue(t.name, t.value);
    }
  }
});
formEl.addEventListener("focusout", function (e) { if (e.target.name) store.validate(e.target.name); });
formEl.addEventListener("click", function (e) { if (e.target.closest("[data-prev]")) store.previous(); });
formEl.addEventListener("submit", function (e) {
  e.preventDefault();
  var s = store.getState();
  if (s.form && s.step < s.form.steps.length - 1) store.next(e); else store.submit(e);
});

store.subscribe(render);
render(store.getState());
store.start();
