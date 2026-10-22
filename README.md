# OffAxis — storefront prototype

A responsive streetwear storefront concept for OffAxis, built as a lightweight static website (HTML, CSS and JavaScript). It does not require a framework or a build step.

## Included

- Responsive home page and product catalogue
- Search and product-category filters
- Colour and size choices
- Shopping bag with quantity updates and remove controls
- Cart saved in the visitor's browser
- Checkout form that builds an order message and opens WhatsApp
- Instagram and WhatsApp contact links
- Product artwork drawn as editable SVG illustrations (these are concept mockups, not confirmed product photography)

## Important before publishing

This is a **storefront prototype**, not a fully verified official store. Please have OffAxis approve it and confirm all details before going live.

- The six product titles, descriptions, available colours/sizes and prices in `products.js` are example catalogue data. Prices are DEMO prices in XCD and have not been confirmed by the brand.
- Replace concept garment illustrations with actual approved product photography where available.
- The WhatsApp order contact is configured in `app.js` as `17587268533` based on the number supplied for this project. Verify that it is the correct business number before launch.
- This site does not take card payments, reserve stock, calculate delivery fees or automatically confirm an order. A customer sends the order request to WhatsApp; OffAxis must reply to confirm stock, final total, delivery/collection and payment.
- If card payments or automatic inventory management are required, connect a suitable commerce/payment backend before advertising the site as a fully automated checkout.

## Preview locally

1. Download or clone the repository.
2. Open `index.html` in a current browser. For the most reliable behaviour, serve the folder through a local static server rather than opening the file directly.
3. The website uses Google Fonts over the internet; it falls back to system fonts if unavailable.

For example, if Python is installed, open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Update catalogue details

Edit `products.js`. Each product has an `id`, `name`, `category` (`tee` or `hoodie`), `price` (number in XCD), `colors` (name + hex), `sizes`, description and illustration style (`art`). Keep IDs unique. The current art styles are `shift`, `kweyol`, `hoodie`, `minimal`, `core`, and `afterhours`.

## Change the WhatsApp number

Edit `WHATSAPP_NUMBER` at the top of `app.js`. Use digits only, including country code, with no plus sign or spaces. Also update the fallback link in `index.html` if the number changes.

## Deploy

This repository contains the website files in its root. It can be published as a static site using GitHub Pages or connected to Cloudflare Pages/Netlify. No build command is needed. For Cloudflare Pages, set the root directory to `/` and leave the build command empty.