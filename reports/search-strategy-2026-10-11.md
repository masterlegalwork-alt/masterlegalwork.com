# Search visibility work and evidence — 11 October 2026

## Requirement status

| Requirement | Completed work | Limit / next dependency |
|---|---|---|
| SEO | Unique titles/descriptions, canonical pages, sitemap, robots, breadcrumbs, internal links, responsive images | Indexing and rankings are search-engine decisions; HTTPS availability remains unresolved from this environment |
| AEO | Visible questions/answers in existing guides, precise preparation checks, links between guides and related full formats | No featured-snippet guarantee; FAQ schema does not make an advocate site eligible for restricted FAQ rich results |
| GEO | Source-linked legal explanations, consistent firm identity and addresses, structured documents with downloadable encodings | Inclusion in any AI answer is not guaranteed |
| Keyword research | Editorial intent clusters and relevant destination pages, grounded in real user tasks | Search volumes/difficulty and actual query positions have not been measured |
| Technical work | 133 preserved HTML files; robust recurring audit checks metadata, duplicates, schema, links/anchors, sitemap, form PDF parity and image dimensions | Rendered Core Web Vitals and exact third-party map pins not certified |
| Backlinks | Permanent useful original resources, source notes, full formats and download URLs suitable for earned citations | Third-party publishers control backlinks; none bought, fabricated or externally posted |
| Competitor analysis | Public-page comparison below | Qualitative sample, not a ranking or traffic benchmark |
| Monthly reporting | GitHub workflow on first day each month, manual run and audit-code change; Markdown + JSON artifacts; public-site availability checks | Traffic reporting requires a verified Search Console export; CSV import is supported |

## Keyword intent and content destinations

| User task / intent | Destination | Material added or retained |
|---|---|---|
| Chandigarh/Mohali case status, CNR, next date | /resources/#litigant-tools | Official eCourts route and preparation guidance |
| P&H High Court cause list / video hearing | /resources/cause-lists.html and /resources/vc-links.html | Official court destinations |
| Bail application format / BNSS versus CrPC | /guides/arrest-and-bail.html and /drafts.html#regular-bail | Procedure, factual risk analysis, supporting evidence, Dataram authority application |
| Anticipatory bail format | /drafts.html#anticipatory-bail | Apprehension/cooperation facts and fact-dependent Sushila Aggarwal principles |
| Cheque bounce complaint format / limitation | /drafts.html#ni-act-138-complaint and /research/s138-timeline.html | Transaction, service and statutory chronology checks; Rangappa application |
| Civil injunction / recovery suit format | /drafts.html#permanent-injunction and /drafts.html#recovery-suit | Relief selection, jurisdiction, court-fee blank, numbered facts and evidence |
| Maintenance / mutual consent divorce format | /drafts.html#maintenance-144 and /drafts.html#mutual-consent-divorce | Disclosure, statutory conditions and relevant authority distinctions |
| Advocate identity / office directions | /profile.html and /contact.html | Consistent real identity, email and address-specific Google Maps links |

## Public search-resource comparison

Sample inspected 11 October 2026; no traffic, domain-authority or position estimates.

- [Chandigarh High Court anticipatory-bail checklist](https://www.chandigarhhighcourt.com/articles/practical-checklist-for-lawyers-preparing-anticipatory-bail-applications-for-the-punjab-and-haryana-high-court): uses a task-specific local title and sections on documents/procedure. MLW's opportunity is to make equally clear task destinations while giving actual downloadable formats, linked judgment text and verified statutory distinctions. Its legal propositions and promotional ratings are not adopted as authority.
- [Indian Kanoon](https://indiankanoon.org/): searchable judgments and laws. MLW complements a research engine with a fact–evidence–relief explanation and a draft the reader can adapt; judgment links remain discoverable.
- [Official eCourts help](https://services.ecourts.gov.in/App/apphelp.html): explains CNR and alternative search options. MLW routes litigants to the official record rather than suggesting it holds live court data.

## Monthly performance data

Use one Search Console export dimension and a defined period per report. Supply the export through `--metrics-csv`; the importer computes clicks, impressions and aggregate CTR. Do not mix Pages, Queries and Dates exports into a single sum. Record the export period, property and filters in the report notes. Compare like periods; record query/page position directly from the source instead of deriving a fake rank. Track earned referring pages from verified source reports. Initial traffic/ranking/backlink baseline: unavailable, not zero.

## External dependencies

The current GitHub connection can edit repository files but cannot administer GitHub Pages certificates or the registrar's DNS. An independent GitHub runner confirmed SSL hostname mismatch: the served certificate is not valid for masterlegalwork.com. HTTP served the updated pages. Evidence: https://github.com/masterlegalwork-alt/masterlegalwork.com/actions/runs/38138108381 . In GitHub repository Settings → Pages, check the configured custom domain, domain/DNS check and HTTPS certificate status. Use the registrar DNS panel to compare apex and www records with GitHub’s current official instructions. Once DNS is valid, provision the domain certificate and enable Enforce HTTPS. Preserve mail/DNS records used by other services; do not change DNS by guessing. Administrator access to those settings is required. Exact room/home-office map pins require an actual confirmed Google Maps share link; address searches are live and are not labelled as confirmed GPS coordinates.

Guidance: [Google AI optimization](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [Google link-spam policy](https://developers.google.com/search/docs/essentials/spam-policies), [GitHub HTTPS documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).
