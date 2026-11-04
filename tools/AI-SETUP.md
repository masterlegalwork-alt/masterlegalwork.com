# Master Legal Work AI Legal Information
The public website is hosted on GitHub Pages, which cannot keep an AI API key secret or execute the server-side AI request. The AI page is safe to publish before backend activation: unavailable requests report that the service is not connected, and no provider receives them.

## Activation (Cloudflare Workers)
1. Create a Cloudflare Worker, paste the contents of `tools/ai-worker.js` into its entry file, and deploy it.
2. Set an encrypted Worker secret named `OPENAI_API_KEY` to a valid OpenAI API key. Never commit the key.
3. Set `ALLOWED_ORIGIN` to `https://masterlegalwork.com`.
4. Configure the Worker custom domain `mlw-ai.masterlegalwork.com` in Cloudflare DNS/Worker routing, or update the endpoint in `assets/js/ai-legal-help.js` to the actual Worker HTTPS address.
5. Before enabling public traffic, add Cloudflare WAF/rate-limiting protection, abuse monitoring without storing user questions, and an appropriate privacy notice explaining the AI provider and retention terms.
6. Verify responses in English/Hindi/Punjabi, mobile behavior, error handling and legal safeguards with counsel before describing the service as operational.

The assistant is deliberately limited to *general legal information*; legal advice is reserved for an engaged advocate after conflict checks.
