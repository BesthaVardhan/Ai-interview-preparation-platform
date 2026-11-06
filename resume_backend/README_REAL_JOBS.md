# Real Job Matches (No Web Scraping)

The app can show **real job listings** that match the user's resume using **official APIs**.  
**No API is compulsory** — without any keys, the app uses built-in sample jobs (Indian companies).

## Why we don't scrape Naukri / LinkedIn

- **Terms of Service**: Scraping is against their ToS and can lead to account bans or legal issues.
- **Anti-bot**: These sites block or throttle automated access; scrapers break when HTML changes.
- **APIs** give stable, legal access to job data.

## How it works

1. When a user opens **Job Recommendations**, the backend tries to fetch real jobs from **whichever API you have configured** (see below).
2. **Order**: Adzuna is tried first; if it returns no jobs, JSearch (RapidAPI) is tried. First provider that returns jobs is used.
3. If **no API is configured** or **all return no results**, the app uses **built-in sample jobs** (Indian companies). The app always works.

## Option A: Adzuna (free)

1. Register at **[Adzuna Developer Portal](https://developer.adzuna.com/signup)** and get **Application ID** and **Application Key**.
2. Set in your environment:
   ```bash
   ADZUNA_APP_ID=your_app_id
   ADZUNA_APP_KEY=your_app_key
   ```
3. Optional: `ADZUNA_COUNTRY=in` for India (default). Other codes: `gb`, `us`, `au`, etc.

## Option B: JSearch via RapidAPI (free tier)

Good alternative; aggregates jobs from multiple sources (including India).

1. Sign up at **[RapidAPI](https://rapidapi.com)** and subscribe to **JSearch** (free tier):  
   [JSearch API on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Copy your **RapidAPI Key** from the dashboard.
3. Set in your environment:
   ```bash
   RAPIDAPI_KEY=your_rapidapi_key
   ```

You only need **one** of the two (Adzuna or JSearch). If both are set, Adzuna is used first.

## Adding another API

You can add more providers in `src/services/real_job_fetcher.py` (e.g. another function that returns a list of jobs in the same format) and call it from `fetch_real_jobs_for_resume()`. For Naukri or LinkedIn, use their **official APIs** if you have access; do not scrape.
