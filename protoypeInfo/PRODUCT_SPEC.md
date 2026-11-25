# Product spec: the Monday Number Engine

## The problem

Namak Street is a fictional D2C snack brand. It sells on five channels: Shopify (its own website), Amazon, Blinkit, Zepto and Swiggy Instamart.

Every Monday the founder asks: **"How much did we sell last week, by city and product, and which channel is growing?"**

Today an analyst spends most of Monday downloading five reports and joining them in Excel. The numbers rarely match each other or the platforms' own dashboards, so the founder doesn't fully trust the result.

## Why the numbers don't match

"Sales" is not one fact. Each platform records a different event, on a different clock, under different names:

| Cause | What it means | Example in the demo |
|---|---|---|
| Different event | Sell-in (brand sells stock to the platform on a purchase order) vs sell-through (platform sells to a consumer). They must never be added together. | Blinkit placed a big restock PO: sell-in +62%, consumer sales only +3.8%. |
| Different definitions | Gross vs net, GST included or excluded, cancellations included or excluded. | Amazon's Seller Central figure includes GST and cancelled orders. |
| Different clocks | Order date vs processed date; refunds arrive weeks later. | Shopify deducts refunds on the day processed; we credit them to the original order week, so last week's number changed. |
| Different names | SKU vs ASIN vs platform item ID; customer city vs dark-store city. | 12 Blinkit items aren't mapped to Namak Street SKUs yet. |
| Different access | Shopify and Amazon have APIs; Blinkit, Zepto and Instamart only offer portal exports. | Instamart's report hasn't been uploaded this week. |

## Users

**Analyst (does the work, Monday 9:00).** Wants to produce a report they can stand behind, quickly, without rebuilding everything in Excel. They're afraid of sending a number that turns out to be wrong.

**Founder (makes decisions, Monday 10:00).** Wants one number she trusts enough to move stock and marketing spend on, and to know which channel is really growing. She's been burned by numbers that looked like growth but weren't.

## Product principle

**Standardise what can be standardised. Show what can't.**

The product doesn't pretend the channels are identical. Where data can be made comparable, it does that. Where it can't, it labels the difference and explains it in plain language.

## How the product works (four layers)

1. **Sources.** Shopify and Amazon come in automatically through Hevo connectors. Blinkit, Zepto and Instamart come in as uploads of their official portal exports.
2. **Hevo platform (reused).** Pipelines and storage. Not shown in the prototype except as "synced" status.
3. **Semantic layer (the new product).** This is what the prototype demonstrates:
   - one agreed definition of sales: consumer sell-through, net of discounts and returns, excluding GST, Monday to Sunday IST;
   - mapping of platform item IDs to brand SKUs, and pack sizes to base units;
   - city labels saying whether a city is the customer's city or the store's city;
   - sell-in kept separate from sell-through;
   - date rules: refunds credited back to the original order week, with restatements shown;
   - readiness and confidence checks per channel.
4. **Monday report.** What the founder sees.

## The four moments the prototype must make obvious

1. **The PO trap.** The old Excel method would report +21% growth. The real consumer growth is +5%. The difference is Blinkit's restock purchase order.
2. **Honest incompleteness.** Instamart's report is missing, so the report says "4 of 5 channels" and compares like with like, rather than quietly dropping a channel.
3. **Unmapped revenue is visible.** ₹38,000 of Blinkit revenue isn't mapped to SKUs until the analyst maps it. It's never silently dropped.
4. **Restatement is explained.** Last week's Shopify number changed from ₹4,50,000 to ₹4,38,000 because of refunds, and the report says so.

## Definitions to use on screen

- **Consumer sales (sell-through):** what consumers bought, net of discounts and returns, excluding GST.
- **Purchase orders (sell-in):** stock a platform bought from Namak Street. Shown separately, never added to consumer sales.
- **Week:** Monday to Sunday, IST. Current week is W4 (16–22 Nov 2026); report date is Monday 23 Nov 2026.
- **Ready:** a channel is ready when its data for all 7 days is in and validated.
- **Material gap:** a difference between our number and the platform's own figure of more than ±2%.
