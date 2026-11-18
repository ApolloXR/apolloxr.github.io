# ApolloXR — landing page

A static, dependency-free landing page (`index.html`, `styles.css`, `script.js`, `favicon.svg`)
ready for GitHub Pages.

## 1. Connect the email signup (required)

GitHub Pages only serves static files, so email addresses are collected by a form backend.
The page is set up for [Formspree](https://formspree.io) (free tier works):

1. Create a Formspree account and a new form. You'll get an endpoint like
   `https://formspree.io/f/abcdwxyz`.
2. In `index.html`, replace **both** occurrences of `YOUR_FORM_ID` with your form ID.
3. Submissions (with the email and a `source` field — `hero` or `cta`) appear in the
   Formspree dashboard and can be exported as CSV or forwarded to email / Mailchimp / Zapier.

Until this is done, submitting the form shows "Signups aren't connected yet".

Any other service that accepts a form POST and returns JSON (Getform, Basin, a Google Apps
Script, etc.) works too — just change the form `action` URLs.

## 2. Publish on GitHub Pages

```powershell
git init
git add .
git commit -m "ApolloXR landing page"
git branch -M main
git remote add origin https://github.com/<your-user-or-org>/<repo>.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
branch `main`, folder `/ (root)`. The site appears at
`https://<your-user-or-org>.github.io/<repo>/` (or at `https://<name>.github.io/` if the repo
is named `<name>.github.io`).

### Custom domain (optional)

To serve it at e.g. `apolloxr.co`: add the domain under **Settings → Pages → Custom domain**
(this creates a `CNAME` file), then point your DNS at GitHub Pages as described in
[GitHub's docs](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site).
Enable **Enforce HTTPS** once the certificate is issued.

## Preview locally

```powershell
python -m http.server 8000
```

Open http://localhost:8000.

## Editing

- Copy lives in `index.html` (hero, How it works, Technology, Use cases, CTA).
- Colours and fonts are CSS variables at the top of `styles.css`.
- The hero animation (a point-cloud performer inside a ring of cameras) is in `script.js`;
  it pauses when off-screen and renders a still frame for visitors who prefer reduced motion.
