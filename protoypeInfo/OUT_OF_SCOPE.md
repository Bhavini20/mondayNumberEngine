# Out of scope for the prototype

The prototype demonstrates the semantic layer and the two users' experience. It deliberately fakes or leaves out the following. This mirrors the scope discipline in the proposal.

## Simulated (looks real, isn't)

- **File upload and parsing.** "Use sample file" and "Upload corrected file" load results from `mock-data.json`. No real Excel parsing.
- **Connector syncs.** Shopify and Amazon show "Synced" from the data file. No API calls.
- **Mapping suggestions.** Come from the data file, not from a matching algorithm.
- **Sending the report and reminders.** Change on-screen state only. No email, Slack or notifications.
- **Trust capture.** Stored in the browser for the session only.

## Not included

- Login, users, permissions or multiple brands.
- Real Hevo pipelines, warehouses or destinations.
- Portal scraping or automated downloads from Blinkit, Zepto or Instamart.
- Stock-out or inventory analysis.
- Forecasting, ad spend, ROAS or financial settlement reconciliation.
- AI or natural-language queries.
- Editing the sales definition (it's shown as fixed and signed off).
- Mobile-specific layouts beyond basic responsiveness.

## Disclaimer text (show on the start screen and in small text throughout)

> Prototype for a product management case. Namak Street is a fictional brand and all figures are illustrative. Platform behaviours shown (data access routes, date and tax treatment) are based on public documentation where available and are simplified for the demo.
