# Prompt for Claude Code

Paste the section below into Claude Code as the first message, with the other files in this folder.

---

I'm building a clickable prototype for a product management case. The product is called **the Monday Number Engine**. It's a product idea for Hevo Data, a data pipeline company. The prototype shows one Monday at a fictional D2C snack brand called **Namak Street**, first through the eyes of the analyst (9:00) and then the founder (10:00).

Read these files before writing any code:

1. `PRODUCT_SPEC.md`: the problem, the two users, the product principle and what the product does.
2. `SCREENS.md`: every screen, what it shows, what the user can do, and its states.
3. `mock-data.json`: the only data source. Every number on screen must come from this file or be computed from it. Don't invent numbers.
4. `DEMO_SCRIPT.md`: the 2–3 minute click path the prototype must support end to end.
5. `OUT_OF_SCOPE.md`: what to fake, what to leave out, and the disclaimer text.

What I need:

- A front-end-only prototype that runs locally and can be deployed as a static site (no backend, no login, no real APIs).
- A switch between the two views: **Analyst · 9:00** and **Founder · 10:00**.
- State carries across views. What the analyst does (uploading the corrected Blinkit file, mapping items, sending the report) changes what the founder sees.
- A **Reset demo** control that returns everything to the starting state.
- Every path in `DEMO_SCRIPT.md` works without errors.
- Indian number formatting for rupees (₹1,72,000 and ₹17.2L). Dates in IST.

Constraints:

- I will decide the visual design myself, so ask me about design direction before styling. Keep the first pass structurally complete and plain.
- Keep the data logic in one place (a small module that reads `mock-data.json` and computes totals, week-on-week change, unmapped revenue and readiness). Screens should only display.
- Never add sell-in (Blinkit purchase orders) to consumer sales anywhere, except inside the clearly labelled "Old Excel view" comparison.
- Every number that depends on incomplete data must say so on screen.

Start by summarising back to me what you'll build and the component structure, then wait for my go-ahead.
