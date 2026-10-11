# Model format maintenance

The 28 model pleadings live in `drafts.html`. The on-page text, `assets/drafts/*.docx` and matching `forms/files/MLW-*.docx` were synchronised on 11 October 2026. Existing short-form URLs now contain the expanded format with preparation notes. Existing filenames remain for link compatibility. Every Word version has a matching PDF.

## Review requirements

- Preserve the main factual pleading, witness lists and required statutory particulars.
- Keep preparation notes outside the signed pleading. Retain optional legal arguments only when the material facts, procedural stage and applicable statute support them.
- Verify every authority from the judgment itself, its subsequent treatment and local practice; never invent quotations, citations or paragraph numbers. `model-format-sources.json` records the authorities used in this revision.
- Supporting general affidavits have two numbered paragraphs. Separate prescribed financial, evidence or statutory affidavits must use the applicable form.
- Criminal procedural savings and substantive offence-date questions must be considered separately.
- Regenerate BOTH Word locations and all PDF counterparts after changing an on-page format. Render the complete documents, inspect all pages and check pagination; catalogue download sizes must be refreshed.
- Retain every existing page and download path. Make a backup branch before a new public revision.

The website is static: the form-handler source under `apps-script` requires its own deployment and configured endpoint before it is a live backend. No account data or leads are held in this repository.
