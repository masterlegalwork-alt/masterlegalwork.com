# Model format maintenance

The 28 model pleadings live in `drafts.html`. The on-page text, `assets/drafts/*.docx` and matching `forms/files/MLW-*.docx` were synchronised on 17 October 2026. Existing short-form URLs now contain the expanded format with preparation notes. Existing filenames remain for link compatibility. Every Word version has a matching PDF.

## Review requirements

- Preserve the main factual pleading, witness lists and required statutory particulars.
- Keep preparation notes outside the signed pleading. Retain optional legal arguments only when the material facts, procedural stage and applicable statute support them.
- Verify every authority from the judgment itself, its subsequent treatment and local practice; never invent quotations, citations or paragraph numbers. `model-format-sources.json` records the authorities used in this revision.
- Supporting general affidavits have two numbered paragraphs. Separate prescribed financial, evidence or statutory affidavits must use the applicable form.
- Criminal procedural savings and substantive offence-date questions must be considered separately.
- Regenerate BOTH Word locations and all PDF counterparts after changing an on-page format. Render the complete documents, inspect all pages and check pagination; catalogue download sizes must be refreshed.
- Retain every existing page and download path. Make a backup branch before a new public revision.

The website is static: the form-handler source under `apps-script` requires its own deployment and configured endpoint before it is a live backend. No account data or leads are held in this repository.

## House layout revision 17 October 2026

The 28 featured models and their existing download aliases use Legal paper (8.5 × 14 inches), Arial 13, 1.25 line spacing, a 1.6-inch left margin and 1.2-inch other margins. Court titles are centred, bold and underlined. Party particulars remain narrative with blank placeholders and lawfully required identity fields only. Four-line counsel blocks include the enrolment number and public contact details. No client particulars are embedded.

`build_model_formats.py` builds the master Word files from `drafts.html`. Regenerate and render matching PDF files and synchronise existing aliases after changes. Preserve the two-paragraph general accompanying affidavit; prescribed statutory affidavits need their own forms. Mandatory current court and registry directions prevail over this house layout. This revision changes presentation and general affidavit wording without claiming a fresh merits review of every authority.
