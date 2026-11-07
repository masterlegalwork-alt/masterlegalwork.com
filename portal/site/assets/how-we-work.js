import { subscribeMember, getMemberState } from "/js/wix/member-store.js";
import { ROADMAP, ROADMAP_NOTE, roadmapTable } from "/assets/roadmap.js";
import { esc } from "/assets/common.js";
import { loginPrompt } from "/assets/portal-data.js";
var body = document.getElementById("hww"), gate = document.getElementById("hww-gate");
var pick = document.getElementById("rm-pick"), out = document.getElementById("rm-out");
pick.innerHTML += ROADMAP.map(function (r, i) { return '<option value="' + i + '">' + esc(r[0]) + "</option>"; }).join("");
pick.addEventListener("change", function () {
  var r = ROADMAP[pick.value];
  out.innerHTML = r ? roadmapTable(r) + '<p class="small muted">' + ROADMAP_NOTE + "</p>" : "";
});
function render(s) {
  if (s.loading) return;
  body.hidden = !s.loggedIn;
  gate.innerHTML = s.loggedIn ? "" : loginPrompt();
}
subscribeMember(render);
render(getMemberState());
