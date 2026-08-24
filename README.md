# Smith3DPrintingCo — live-ready storefront

This version is built around the two replica product families:
- Cartridge replicas
- Shotgun shell replicas

## Current catalog
The editable `catalog.json` contains your current 14 cartridge calibers and 8 colors.

Cartridge pricing:
- $1.30 each
- +$0.10 per item when custom text is entered
- maximum 15 characters

Shotgun shell gauges:
- 12 Gauge
- 20 Gauge
- 16 Gauge
- .410 Gauge

Shotgun shell pricing: $1.30 each, plus $0.10 per shell when custom text is entered (maximum 15 characters).

## Your photos
The two uploaded photos are already included in `assets/`.

## Editing later
Open `catalog.json` to change:
- colors
- calibers
- gauges
- prices
- custom-text fee
- custom-text character limit
- product names
- product photos

The front-end reads this catalog automatically.

## Stripe
The site includes a Stripe Checkout backend in `server.js`. Do NOT put your Stripe secret key in browser JavaScript or commit it to source control.

Before launch:
1. Create/finish your Stripe account.
2. Put the secret key in an environment variable named `STRIPE_SECRET_KEY`.
3. Set `PUBLIC_BASE_URL` to your real HTTPS website URL.
4. Install dependencies with `npm install`.
5. Run with `npm start`.
6. Use Stripe's test mode first, then switch to the live key after approval.

The server validates the catalog price rather than trusting prices sent by the browser. For production, also validate every selectable caliber/color/gauge against the catalog before creating a Checkout Session.

## Important
This is the first production-oriented build. Hosting, DNS, SSL, Stripe account credentials, email notifications, taxes, shipping rates, and final legal/policy pages still need to be configured before accepting live orders.
