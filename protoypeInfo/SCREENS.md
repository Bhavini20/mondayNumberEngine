# Screens

The prototype has a start screen and two views. The analyst view is a short sequence of steps. The founder view is a single report page with drill-downs. All numbers come from `mock-data.json`.

Global elements on every screen:

- A view switch: **Analyst · 9:00** / **Founder · 10:00**.
- The brand and week: "Namak Street · Week of 16–22 Nov 2026".
- A small persistent note: "Prototype with illustrative data".
- A **Reset demo** control.

---

## S0 · Start screen

**Purpose:** set context in 10 seconds.

Shows:
- Product name: the Monday Number Engine (a Hevo product concept).
- One line: "Hevo moves the data. The Monday Number Engine makes it mean something."
- The founder's question: "How much did we sell last week, by city and product, and which channel is growing?"
- Two entry buttons: "Start as the analyst (9:00)" and "Jump to the founder's report (10:00)".
- The disclaimer from `OUT_OF_SCOPE.md`.

---

## Analyst view (Monday 9:00): "Monday prep"

The analyst's goal: a report they can stand behind, sent by 10:00, never accidentally incomplete.

### A1 · Readiness board

**Purpose:** see at a glance what is ready and what needs action.

Shows one card per channel, with:
- channel name and how its data arrives (from `route`);
- status: **Synced** (Shopify, Amazon), **Upload needed** (Blinkit), **Validated** (Zepto), **Report missing** (Instamart);
- the channel's current-week consumer sales if ready, or "—" if not;
- confidence reasons from `confidence` (days covered, % mapped, tax basis verified or not, data age). Show them as reasons, not as a single score.

Also shows:
- a summary line: "3 of 5 channels ready" (updates as the analyst works);
- the deadline: "Report due to founder at 10:00".

Actions:
- Blinkit card → **Upload report** (goes to A2).
- Instamart card → **Remind channel owner** (shows a confirmation that a reminder was sent; the report stays missing in this demo).
- Any channel card → **View details** (opens the channel's gap check, A4).
- **Review and send** (goes to A5), always available.

### A2 · Upload and validate (Blinkit)

**Purpose:** show that an upload is checked, not just accepted.

Flow:
1. The analyst chooses a file. In the prototype this is simulated: a button such as "Use sample file" loads `blinkit_upload.first_attempt`.
2. The validation result shows:
   - file name, rows detected;
   - required columns found (8/8), listing the columns from `required_columns`;
   - **missing day: Thu 19 Nov** (flagged as a problem);
   - unexpected column: "Promo Tag" (flagged as a warning, not a blocker);
   - duplicate rows: 0;
   - a preview of a few rows.
3. Status: **Needs attention**. Options: **Upload corrected file**, or **Accept with Thursday missing** (allowed, but Blinkit's confidence then says "6/7 days").
4. "Upload corrected file" loads `corrected_file`: 2,804 rows, no missing days, status **Validated**.
5. After validation, the screen says: "12 items aren't mapped to Namak Street SKUs (₹38,000)". Button: **Map items** (goes to A3).

### A3 · Mapping queue

**Purpose:** show unmapped revenue shrinking, and what's left staying visible.

Shows:
- a running total at the top: "Unmapped revenue: ₹38,000 · Blinkit mapped 93%";
- a list of the 12 items from `unmapped_items`: platform item ID, platform name, revenue, and the suggested Namak Street SKU (with its name from `skus`);
- for the Snack Box items, a note that one pack equals 3 base units.

Actions:
- **Confirm** per item (moves it out of the queue and lowers the unmapped total).
- **Change** per item (pick a different SKU from the list).
- **Accept all suggestions** (confirms every item that has a suggestion).
- The last item, "Namak Street Festive Pack" (₹2,000), has no matching SKU (`NEEDS_NEW_SKU`). Options: **Create new SKU** or **Leave unmapped**. The demo leaves it unmapped so the founder later sees "₹2,000 unmapped".

Running totals update live: unmapped revenue and Blinkit's mapped %.

### A4 · Gap check (per channel)

**Purpose:** explain every difference between our number and the platform's own figure.

For the selected channel, shows:
- our number (current-week consumer sales);
- the platform's own figure and what it means (`platform_figure`, `platform_label`);
- the list of reasons with amounts (`gap_reasons`), which add up from the platform figure to our number (see `_gap_convention`);
- whether the remaining difference is within the ±2% tolerance;
- date basis and city type for this channel;
- confidence reasons.

Specific content:
- **Shopify:** platform ₹4,18,000 → ours ₹4,60,000. Reason: refunds processed this week on older orders are credited back to the original weeks. Also shows the **restatement**: "Last week (W3) was sent as ₹4,50,000; it's now ₹4,38,000 because of ₹12,000 of refunds on W3 orders."
- **Amazon:** platform ₹4,95,000 → ours ₹4,30,000: GST removed (−₹52,000), cancelled orders removed (−₹13,000).
- **Blinkit:** platform ₹5,46,000 → ours ₹5,40,000: ₹6,000 unexplained but within tolerance; tax basis of the export not yet verified.
- **Zepto:** matches.
- **Instamart:** "No data this week."

### A5 · Review and send

**Purpose:** make it impossible to send an incomplete report that looks complete.

Shows:
- a readiness checklist for all five channels;
- a preview of the headline number and what's included;
- open issues: missing channels, unmapped revenue, unverified tax bases.

Send button behaviour:
- If every channel is ready: "Send report".
- If any channel is missing or not uploaded: the button reads **"Send as incomplete (Instamart missing)"**, naming the missing channels. Sending is allowed, and the report is marked incomplete everywhere.
- After sending: confirmation, and the founder view changes from "waiting" to the report.

---

## Founder view (Monday 10:00): "Monday report"

The founder's goal: one number she trusts, read correctly, and which channel is really growing.

### F0 · Before the report is sent

If the analyst hasn't sent the report yet, the founder sees: "This week's report isn't ready yet. 3 of 5 channels ready. Last report: W3." With a link to last week's report or simply the readiness status. (This state matters less in the demo; keep it simple.)

### F1 · Report header (headline)

Shows:
- **Consumer sales last week: ₹17.2L, +5.0% week-on-week.**
- The completeness strip directly under it: "4 of 5 channels · Swiggy Instamart missing · ₹2,000 unmapped".
- The comparison note: "Week-on-week compares the same four channels in both weeks."
- If the report was sent incomplete, an "Incomplete" label is always visible next to the headline.

The headline must be computed from the channels that are ready, comparing the same channels in the previous week (using restated figures). If the analyst skipped the Blinkit upload, the headline changes to three channels accordingly.

### F2 · Channel growth

A row or card per channel with:
- current-week consumer sales;
- week-on-week change;
- the 4-week trend (W1–W4);
- city type label (customer city / store city / platform-reported);
- a "why it differs" link (opens F4);
- for Instamart: "Report missing" instead of numbers.

For Blinkit, a separate, clearly labelled line underneath: **Purchase orders (sell-in): ₹7,45,000, +62%**, with a note that it's not part of consumer sales.

### F3 · The PO trap card

A highlighted explanation of the most important reading this week:
- "Blinkit purchase orders +62%. Blinkit consumer sales +3.8%."
- "Blinkit placed a large restock order. That's stock moving into Blinkit's warehouses, not consumers buying more."

A toggle: **Show what the old Excel would have said.** When on, it shows the old method's result next to the real one:
- Old Excel: ₹19.25L, **+21.1%** week-on-week (Blinkit +62%).
- Monday Number Engine: ₹17.2L, **+5.0%** (Blinkit consumer sales +3.8%).
- One line on why: the old method added purchase orders to consumer sales and used last week's un-restated Shopify figure.

### F4 · Why numbers differ (drawer or panel)

Per channel: our figure, the platform's figure, the reasons in plain language, the date basis, and confidence reasons (same content as A4, written for the founder). Includes the Shopify restatement note.

### F5 · By city / by product

Two tabs or tables for the current week's consumer sales:

- **By city:** totals per city per channel, with each column or value labelled as customer city or store city. A note explains that Gurugram customers served by a Delhi dark store appear under Delhi on Blinkit and Instamart (Blinkit shows ₹0 for Gurugram for this reason).
- **By product:** revenue and units per SKU per channel, with Snack Box units also shown as base units. The unmapped ₹2,000 appears as its own row, "Unmapped (Blinkit)".

Instamart is shown as "missing" in both tables.

### F6 · Trust capture

At the end of the report, two buttons: **I'd act on this** / **Needs a recheck**. Selecting one records it for this week and shows the history from `trust_capture.history` plus this week (for example, "Recheck, Recheck, Act, Act"). A short note says this is how the product measures decision-grade trust.
