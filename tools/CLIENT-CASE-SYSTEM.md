# Master Legal Work: Client + Matter System (secure implementation contract)
Status: design and public informational entry only. Not a functioning secure portal. Never store confidential client or matter data in GitHub Pages, public JavaScript, public GitHub repositories, URL query parameters or open Google Sheets.

## Data ownership and integration
- Authoritative source: dedicated, private per-matter case database plus protected file storage (private Google Drive folders via service credential/OAuth or appropriate private object storage).
- Connect ChatGPT using *supported, explicitly authorised* tools to the same case repository. Do not claim the personal ChatGPT account's uploads, memory or conversations are directly accessible by the website. Export/upload earlier ChatGPT files individually through a deliberate, reviewed import and deduplication process.
- OpenAI API can process selected files from the matter after express internal approval and relevant client/data-processing permissions, with per-matter scoped retrieval and retention controls. API credentials are server-side only. Do not allow the public-facing chatbot access to private matter indexes.
- The existing Google Apps Script lead intake should NOT become a confidential case-file store without a security redesign. Link leads to cases only after administrative approval and conflict checks.

## Data entities (all have UUID primary keys, created/updated timestamps, revision history)
1. clients: client_id, verified_display_name, encrypted contacts, postal_address, preferred_language, verified_status, lawful_basis/consent status, primary_counsel.
2. matters: matter_id, client_id or approved multi-client relationship, internal_case_ref, title, category, court/jurisdiction, court_case_no, CNR (nullable), stage, status, assignment, confidentiality classification, conflict-check status.
3. parties: party_id, matter_id, role, name, counsel, addresses and contact fields with encryption/role-based access; avoid collecting unnecessary identifiers.
4. documents: document_id, matter_id, storage_object_id, original_filename, mime_type, checksum, version, document_type, date, source, uploader, access_classification, publication/AI-processing approvals. No public object URLs.
5. events: event_id, matter_id, hearing/deadline/appointment type, date/time/timezone, source, verified_by, verification_timestamp, calendar_event_id, owner.
6. communications: message_id, matter_id, sender/recipient/channel, date, summary, securely retained source and provenance; no silent WhatsApp/SMS ingestion.
7. tasks: task_id, matter_id, assigned_user, deadline, priority, status, approval status.
8. accounts: private professional-fee entries, expenses, invoices, receipts, references, with separate permission policy.
9. ai_runs: ai_run_id, matter_id, authorised_by, input_document_version_ids, model, task, output, source citations and page anchors, hallucination warnings, review_state, reviewed_by, expiry/deletion schedule.
10. access_grants: user_id, matter_id, specific permission, start/end, grantor, revocation timestamp.
11. audit_events: who, action, target record, timestamp, outcome, IP/device metadata as proportionate; tamper-resistant append-only storage.

## Roles
- System owner: authenticated advocate/admin; sensitive administrative actions require multi-factor authentication.
- Assigned advocate: approved matters only; can review drafts and publish client-facing updates.
- Clerk/staff: least-privilege access to assigned administrative tasks.
- Client: verified identity and explicit membership in an approved matter. Read only documents/statuses *released* by the chambers; can upload only to a private intake queue.
- Public visitor: only general AI information, never case-specific data.

## Critical security constraints
1. OIDC Google sign-in (and optionally Facebook) authenticates identity, NOT matter access. Invite, verify and link identities server-side; no auto-match by email or phone alone.
2. Enforce row-/object-level authorisation on every backend request and every document download, including AI retrieval and search; deny by default and test cross-tenant isolation.
3. Encrypt at rest and in transit, store credentials in secret manager; restrict backups and apply defined retention/deletion schedules. Never publish signed file URLs in logs.
4. Upload with strict content/type/size checks, antivirus scan, quarantine, immutable versions and human review before an AI agent reads it. Treat document content as untrusted (prompt injection).
5. No client identifiers or confidential facts in URLs, analytics, metadata, public sitemap, generic AI prompts or marketing.
6. Written consent/notice for sensitive handling and AI use, purpose limitation, access logs, breach-response procedures, data minimisation and Indian law/professional confidentiality review.
7. AI outputs are PRIVATE DRAFTS by default; cite document IDs, page numbers and quoted snippets where available, mark unavailable sources, prohibit invented judgments, and obtain advocate approval before sharing.
8. Calendar sync: dedupe by provider event ID plus matter ID; never overwrite court dates silently; track source and verification.

## API (future authenticated backend; NOT active)
GET /api/me  -> verified user profile and role
GET /api/matters -> authorised matter summaries only
GET /api/matters/:id -> check matter permission on every request
GET /api/matters/:id/documents -> permitted metadata only
POST /api/matters/:id/uploads -> permission, quarantine, virus scan
GET /api/documents/:id/download -> server-checked, short-lived access
GET /api/matters/:id/events -> verified events
POST /api/matters/:id/ai-analysis -> advocate role + explicit approved source versions + audit
POST /api/matters/:id/release -> advocate approval; client-safe records only
POST /api/matters/:id/invite -> authorised admin, verified client membership

## Initial rollout gates
A. Private database, document store, encrypted secrets, domain and backups.
B. Authentication + MFA + invitation-only client authorisation + independent access testing.
C. Document intake, chronology, events, tasks, fees, audit logging and admin matter interface.
D. Reviewed AI summarisation, document comparison, source linking, privileged-information screening.
E. Explicit migration/import of relevant Google Drive or ChatGPT-supplied documents after human matter matching, consent and duplicate checks.
F. Security tests, legal/privacy approval, recovery tests, load tests; only then public client login.

## Definition of a complete case
Client(s) and verified parties; conflict review; pleadings; evidence and annexure index; orders; submissions; correspondence; court stage and upcoming dates; verified chronology; limitation/deadline controls; assigned advocate; fees and receipts; secure client-visible updates; versioned source documents; signed-off AI-assisted summaries. Fields may be unknown, never auto-invented.
