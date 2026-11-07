import { createServicesStore } from "/js/wix/services-store.js";
import { esc } from "/assets/common.js";

var listEl = document.getElementById("list");
var store = createServicesStore();

function card(s) {
  var mode = s.conferencing ? "Online" : "At office";
  return '<a class="card tile" href="/service.html?slug=' + encodeURIComponent(s.slug) + '">'
    + '<span class="pill">' + mode + "</span>"
    + "<h2>" + esc(s.name) + "</h2>"
    + (s.tagLine ? '<p class="muted">' + esc(s.tagLine) + "</p>" : "")
    + '<p class="small">' + [s.durationLabel, s.price].filter(Boolean).map(esc).join(" &middot; ") + "</p>"
    + '<span class="go">Choose a time &rarr;</span></a>';
}

function render(st) {
  if (st.error) { listEl.innerHTML = '<p class="err">Consultations could not be loaded. Please refresh the page.</p>'; return; }
  if (st.services == null) return;
  if (!st.services.length) { listEl.innerHTML = '<p class="muted">Online booking is not open at the moment. Please contact our office.</p>'; return; }
  listEl.innerHTML = st.services.map(card).join("");
}
store.subscribe(render);
render(store.getState());
store.start();
