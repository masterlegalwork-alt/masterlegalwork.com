// Wraps each page body in the shared shell and writes the upload bundle.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = new URL("./pages/", import.meta.url).pathname;
const OUT = new URL("./site/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const NAV = [
  ["index", "/index.html", "Home"],
  ["matters", "/matters.html", "My Matters"],
  ["book", "/book.html", "Book Consultation"],
  ["how-we-work", "/how-we-work.html", "How We Work"],
  ["enquiry", "/enquiry.html", "New Enquiry"],
];

function shell({ page, title, description, body, script }) {
  const nav = NAV.map(([k, href, label]) =>
    `<a href="${href}"${k === page ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Master Legal Work Client Portal</title>
<meta name="description" content="${description}">
${page === "index" || page === "privacy" ? "" : '<meta name="robots" content="noindex">'}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:wght@500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
</head>
<body>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/index.html"><strong>Master Legal Work</strong><span>Client Portal</span></a>
    <nav class="nav" aria-label="Main">${nav}</nav>
    <div class="session" id="session" aria-live="polite"></div>
  </div>
</header>
<main><div class="wrap">
${body}
</div></main>
<footer class="site-footer">
  <div class="wrap">
    <p>As per the rules of the Bar Council of India, advocates are not permitted to solicit work or advertise. This portal is meant only for existing clients and for persons who approach us of their own accord. Nothing on this portal is legal advice, and using it does not create an advocate-client relationship.</p>
    <p>Office: <a href="mailto:masterlegalwork@gmail.com">masterlegalwork@gmail.com</a> &middot; <a href="tel:+919872206969">+91 98722 06969</a> &middot; <a href="/privacy.html">Privacy &amp; Disclaimer</a></p>
  </div>
</footer>
<script type="module" src="/assets/common.js"></script>
${script ? `<script type="module" src="/assets/${script}"></script>` : ""}
</body>
</html>
`;
}

const meta = JSON.parse(readFileSync(join(SRC, "pages.json"), "utf8"));
for (const p of meta) {
  const body = readFileSync(join(SRC, p.page + ".html"), "utf8");
  writeFileSync(join(OUT, p.page + ".html"), shell({ ...p, body }));
}

// Upload bundle: every file under site/
const files = [];
function walk(dir, rel = "") {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + "/" + e.name : e.name;
    if (e.isDirectory()) walk(join(dir, e.name), r);
    else files.push(r);
  }
}
walk(OUT);
const bundle = files.sort().map((f) => `=== FILE: ${f} ===\n` + readFileSync(join(OUT, f), "utf8").replace(/\n$/, "")).join("\n");
writeFileSync(new URL("./bundle.txt", import.meta.url).pathname, bundle + "\n");
console.log(files.join("\n"));
