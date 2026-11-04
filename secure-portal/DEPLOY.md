# Secure MLW Client & Case Portal — deployment checklist

The repository includes an **inactive**, read-only authenticated case-workspace implementation. It is **not** connected to client data and is not ready for public client use.

1. Provision a dedicated Supabase project owned by Master Legal Work. Apply reviewed `schema.sql` in a privileged SQL migration. Set up a private `case-files` Storage bucket, and do not enable file uploads before antivirus quarantine and metadata validation exist.
2. Configure Supabase Auth with a correctly owned Google OAuth client, allowed production redirect `https://masterlegalwork.com/secure-portal/` and MFA. An authenticated person does not automatically receive access to any matter.
3. After the owner signs into Supabase Auth, assign their exact UUID to `staff_roles` with role `owner` through the privileged SQL editor. Never auto-assign permissions based on an email.
4. Set the Supabase project URL and **public anon/publishable** key in `config.js`. Keep `enabled:false` until access control testing passes. Never place a service role key, database password, OpenAI key or confidential client data in a website file.
5. Verify RLS and Storage restrictions with independent identities: owner, advocate, clerk, client A, client B and an uninvited user; attempt direct API and cross-matter requests.
6. Only after the security gate passes, implement audited case creation, invitation workflow, upload scan, document release, record retention, backups, privacy and incident response. Add per-matter AI retrieval with human approval and source citations.
7. Existing ChatGPT conversations, files and memory are not automatically accessible by the website. Use an explicit permitted import/export path for any individual file, with approval, case matching and deduplication.
8. The public `ai-legal-help.html` is a distinct general-information service. Never point it at a private case database or attach client documents.

## Current implementation
`secure-portal/index.html` — private sign-in and matter viewer
`secure-portal/app.js` — OAuth sign-in and read-only access through RLS
`secure-portal/config.js` — disabled by default, no secrets
`secure-portal/schema.sql` — RLS-protected clients, matters, case documents, events, notes, assignments and audit tables

Production blockers: configured infrastructure and secrets, verified access control, private file upload pipeline, administrative workflows, AI integration, audits, legal review and end-to-end testing.