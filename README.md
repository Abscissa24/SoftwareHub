# Software Hub: setup guide

This folder is the complete website.

```
index.html          the website (one file)
og.png              the preview image shown when someone shares your link
screenshots/        put your app screenshots and tour videos here
worker/             optional helper service (live release cache, email sign-ups, problem reports, reviews)
.gitignore          protects local dev files (wrangler cache, etc.) from being committed
```

## 1. Put the site online (GitHub Pages)

1. On GitHub, create a new **public** repository named `SoftwareHub` under your Abscissa24 account.
2. Click **Add file > Upload files** and drag in `index.html`, `og.png` and the `screenshots` folder from this folder (the `worker` folder is optional and does not go here). Commit.
3. Go to **Settings > Pages**. Under "Build and deployment", choose **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, and save.
4. After a minute or two your site is live at **https://abscissa.co.za/** (or **https://abscissa24.github.io/SoftwareHub/** if you skip the custom domain). Later, you can add your own domain under the same Pages settings.

Later, you can add your own domain (for example `yourname.com`) under the same Pages settings. If you do, change the two address lines in the `<head>` of `index.html` (`og:image` and `og:url`) to match.

## 2. Already filled in for you

- No public contact email is exposed in the source. The "Report a problem" form posts to the worker (requires step 4 to be set up). If you skip the worker, set `CONTACT_EMAIL` in `index.html` to restore a footer Contact link and a mailto fallback for reports.
- Link-preview tags point at `https://abscissa.co.za/`.
- `API_BASE` in `index.html` already points at the deployed worker.
- Please still review the **Privacy** and **Licence** text (search for `PAGES` in `index.html`). It is a sensible starting point, not legal advice.

New versions appear automatically: publish a release on GitHub and the site shows it within a couple of minutes. No edits needed.

## 3. Screenshots

Save images into `screenshots/` using the names in `screenshots/README.txt`. They appear automatically.

## 4. Optional: helper service (recommended)

Without it the site still works. With it you get:
- no GitHub request limits, even if many people visit from one school or office,
- the "Get notified of new versions" email form,
- the "Report a problem" form with messages saved for you,
- a "Write a review" form on each app page, with reviews shown publicly,
- automatic update emails when you publish a new stable release (these need an email sender; for real subscribers that means a domain you own, because email services must verify the sending domain. For a quick test to your own address, Resend's `onboarding@resend.dev` sender works without a domain).

Setup (about 15 minutes, free tier is enough):
1. Create a free account at cloudflare.com.
2. **Workers & Pages > KV**: create a namespace called `HUB`. Copy its ID.
3. **Workers & Pages > Create > Worker**: paste in `worker/worker.js`. Under **Settings > Variables and bindings**:
   - KV binding: name `HUB`, the namespace from step 2.
   - Variable `REPOS` = `Abscissa24/CCU,Abscissa24/RT` (add new apps here when you add them).
    - Variable `SITE_URL` = `https://abscissa.co.za/`
   - Variable `MAIL_FROM` = `Software Hub <onboarding@resend.dev>` (for testing) or your verified sender for production.
   - Secret `ADMIN_TOKEN` = any long random text (lets you view sign-ups, reports, and reviews).
   - Secret `RESEND_API_KEY` = your Resend API key (required for "Get notified of new versions" to actually send emails).
   - Optional secret `GITHUB_TOKEN`: a GitHub token with no permissions, for a higher request limit.
4. **Triggers > Cron**: add `0 * * * *` (checks every hour).
5. Copy the worker's address (like `https://hub-api.yourname.workers.dev`) and paste it into `API_BASE` near the top of `index.html`.

Open `https://YOUR-WORKER/admin?token=YOUR_ADMIN_TOKEN` for a private dashboard of reports, sign-ups, and reviews. Raw JSON is also available at `.../admin/feedback?token=...`, `.../admin/subscribers?token=...` and `.../admin/reviews?token=...`. To run the new-release check immediately, open `.../admin/run?token=...`.

(Advanced: `worker/wrangler.toml` is included if you prefer the `wrangler` command line. Note that `worker/.wrangler/` is in `.gitignore` and will not be committed — it contains your local account file with the Cloudflare account ID and email.)

### Step-by-step: get "Get notified of new versions" working

Follow these exact steps after deploying the worker (step 3 above):

1. **Verify `RESEND_API_KEY` is set as a secret** in the worker dashboard. Without it, the "Thanks! We'll email you when a new version is out" message will appear but no email will ever be sent.
2. **Verify `MAIL_FROM` is not `YOUR-DOMAIN`**. The worker explicitly checks for the literal string `YOUR-DOMAIN` in `MAIL_FROM` and skips all emails if it's still there. Use `Software Hub <onboarding@resend.dev>` for testing, or a verified domain sender for production.
3. **Verify `SITE_URL`** is set to `https://abscissa.co.za/` so the notification email includes a link to your site.
4. **Subscribe to a test address**: open your site, go to an app page, enter your email in "Get notified of new versions", and submit.
5. **Check the KV**: open `.../admin/subscribers?token=YOUR_ADMIN_TOKEN` and confirm your email appears.
6. **Run the update check manually**: open `.../admin/run?token=YOUR_ADMIN_TOKEN`. The result should show `"baseline recorded"` for each repo (first run) — this is correct. No email is sent on the first run; emails are only sent when a *new* release is published after the baseline is recorded.
7. **Publish a new release** on GitHub for one of your repos. Then run `/admin/run?token=...` again. The result should show `"checked"` with `sent` and `failed` counts. Your test email should arrive.

## 5. Adding another app later

In `index.html`, copy one entry in the `APPS` list and change its name, icon, text, `repo` (like `Abscissa24/NewApp`), colours (`theme`), and add the repo to `REPOS` in the worker. For an app that isn't released yet, add `soon:true` to show a "Coming soon" card.

Release assets are recognised by file type: `.exe`/`.msi` (Windows), `.apk` (Android), `.deb`, `.rpm`, `.pkg.tar.zst` (Arch) and `.AppImage` (Linux). Write a `## Requirements` heading with bullet points in your release notes and they appear on the site.
