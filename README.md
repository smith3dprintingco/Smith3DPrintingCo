# Smith3DPrintingCo Website

## Shipping-enabled checkout

The storefront now collects the customer's U.S. shipping address before checkout, requests current USPS shipping rates from the Render backend through EasyPost, lets the customer select a returned rate, and sends that selected service to the Stripe Checkout backend.

Backend URL:
https://smith3dprintingco-backend.onrender.com

Shipping assumptions currently configured on the backend:
- Origin ZIP: 80127
- Package: 9 x 6 x 2 inches
- Weight: 3 oz

### Deployment
Upload the contents of this folder to the existing `Smith3DPrintingCo` GitHub Pages repository. Do not put Stripe or EasyPost API keys in this repository.

The backend repository is separate: `Smith3DPrintingCo-Backend`.
