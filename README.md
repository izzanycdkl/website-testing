# JW Consulting

Responsive, animated business consulting landing page in solid forest green, charcoal, ivory and sage. No gradients or purple colours. Dependency-free HTML, CSS and JavaScript with a Node.js Vercel Function.

## Local development

Node.js 22 or newer is required. Run `npm run dev`, then visit http://localhost:3000. Run `npm test` for API validation and delivery-contract tests. Tests mock the email provider and do not send real emails.

## Vercel

Import this GitHub repository. Use framework preset **Other**, output directory **public**, and no build command. The `/api/enquiry.js` endpoint is deployed as a Node.js function. The project includes `vercel.json` with security headers and a 15-second function limit.

## Email configuration

Configure these server-only environment variables in Vercel, then redeploy:

- `RESEND_API_KEY`: a sending key from your Resend account.
- `ENQUIRY_FROM`: a sender on a domain verified in Resend, such as `JW Consulting <enquiries@your-domain.com>`.

Every enquiry is sent to **izzany.cdkl@gmail.com**, with the visitor's email as Reply-To. The client cannot change the recipient. A Resend testing sender may only deliver to the account owner's approved address; use a verified sending domain for production. Never commit credentials.

Without these variables, the endpoint returns HTTP 503 and the form offers the direct contact email. It never claims an enquiry was sent when delivery was not accepted by the provider. Provider acceptance does not prove inbox delivery; check the provider's delivery event and the recipient inbox during launch verification.

The endpoint validates input lengths, email, service, explicit consent, JSON content type and same-site browser origin. It uses a honeypot, provider idempotency and a best-effort warm-instance request limit. The memory limit is not shared between serverless instances; add a Vercel Firewall rate-limit rule for POST `/api/enquiry` before a public marketing campaign.

## Experience

- Responsive navigation and layouts, including 320px screens.
- Animated geometric artwork, scroll reveals and reduced-motion support.
- Service links preselect the enquiry topic.
- Accessible field labels, live feedback, keyboard navigation and privacy dialog.
- No trackers, external fonts, UI dependencies, invented client statistics or testimonials.

The service descriptions are proposed marketing copy and should be reviewed against JW Consulting's actual offering before promotion.
