"""
Fetch real job listings from external APIs (no web scraping).

You do NOT need any API to run the app — without API keys we use built-in sample jobs.
If you want real job listings, you can use ANY of the supported APIs (only one needed):

  - Adzuna (free): ADZUNA_APP_ID + ADZUNA_APP_KEY
  - JSearch via RapidAPI (free tier): RAPIDAPI_KEY (uses JSearch for LinkedIn/Indeed etc. listings)

Set env vars for the provider you prefer. We try Adzuna first, then JSearch; first one
that returns jobs is used. No API is compulsory.
"""

import os
import re
from typing import Dict, List, Any, Optional
import requests


# Adzuna
DEFAULT_COUNTRY = "in"  # India
ADZUNA_BASE = "https://api.adzuna.com/v1/api/jobs"

# JSearch (RapidAPI) – aggregates jobs from multiple sources including India
JSEARCH_RAPIDAPI_HOST = "jsearch.p.rapidapi.com"
JSEARCH_RAPIDAPI_URL = "https://jsearch.p.rapidapi.com/search"


def _get_adzuna_credentials() -> tuple:
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    return app_id, app_key


def _adzuna_job_to_our_format(adzuna_job: Dict[str, Any], index: int) -> Dict[str, Any]:
    """Convert Adzuna API job object to our app's job format (same as sample_jobs)."""
    title = adzuna_job.get("title") or "Job"
    company_obj = adzuna_job.get("company") or {}
    company = company_obj.get("display_name", "Company") if isinstance(company_obj, dict) else str(company_obj)
    loc_obj = adzuna_job.get("location") or {}
    if isinstance(loc_obj, dict):
        location = loc_obj.get("display_name", "India")
    else:
        location = str(loc_obj)
    # Ensure India in location for Indian jobs
    if "india" not in location.lower():
        location = f"{location}, India" if location else "India"
    description = adzuna_job.get("description") or ""
    url = adzuna_job.get("redirect_url") or ""
    salary_min = adzuna_job.get("salary_min")
    salary_max = adzuna_job.get("salary_max")
    contract_type = adzuna_job.get("contract_type", "permanent")
    contract_time = adzuna_job.get("contract_time", "full_time")
    # Salary string (Adzuna may return in GBP/USD; for India we show as-is or convert symbol)
    salary_range = ""
    if salary_min is not None or salary_max is not None:
        if salary_min is not None and salary_max is not None:
            salary_range = f"₹{salary_min:,} - ₹{salary_max:,} per year"
        elif salary_min is not None:
            salary_range = f"₹{salary_min:,}+ per year"
        else:
            salary_range = f"Up to ₹{salary_max:,} per year"
    else:
        salary_range = "Competitive"
    # Infer experience level from title
    title_lower = title.lower()
    if any(x in title_lower for x in ["senior", "lead", "principal", "staff", "architect"]):
        experience_level = "Senior"
    elif any(x in title_lower for x in ["junior", "intern", "graduate", "entry"]):
        experience_level = "Junior"
    else:
        experience_level = "Mid-level"
    # Extract skills from description for matching
    skills_required = _extract_skills_from_text(description + " " + title)
    return {
        "id": f"adzuna_{adzuna_job.get('id', index)}",
        "title": title,
        "company": company,
        "location": location,
        "type": "Full-time" if contract_time == "full_time" else "Part-time",
        "experience_level": experience_level,
        "description": description,
        "skills_required": skills_required if skills_required else ["relevant experience"],
        "salary_range": salary_range,
        "remote_friendly": "remote" in (description + title + location).lower(),
        "url": url,
        "source": "Adzuna",
    }


def _extract_skills_from_text(text: str) -> List[str]:
    """Extract skill-like terms from job description for matching."""
    text_lower = text.lower()
    skills = []
    tech_skills = [
        "python", "java", "javascript", "react", "angular", "vue", "node.js",
        "html", "css", "sql", "mongodb", "postgresql", "mysql", "aws", "azure", "gcp",
        "docker", "kubernetes", "git", "jenkins", "terraform", "pandas", "numpy",
        "tensorflow", "scikit-learn", "machine learning", "data science", "agile", "scrum",
        "rest", "api", "devops", "ci/cd", "redux", "typescript", "php", "ruby", "go",
        "r", "tableau", "power bi", "excel", "leadership", "communication",
    ]
    for skill in tech_skills:
        if skill in text_lower and skill not in skills:
            skills.append(skill)
    return skills[:20]


def fetch_real_jobs_from_adzuna(
    keywords: List[str],
    location: str = "India",
    country: str = None,
    results_per_page: int = 20,
    page: int = 1,
) -> List[Dict[str, Any]]:
    """
    Fetch real jobs from Adzuna API.
    Returns list of jobs in our app's format, or empty list if API not configured or fails.
    """
    app_id, app_key = _get_adzuna_credentials()
    if not app_id or not app_key:
        return []

    country = (country or os.getenv("ADZUNA_COUNTRY", DEFAULT_COUNTRY)).lower()
    what = " ".join(keywords[:5]) if keywords else "software engineer"  # fallback query
    where = (location or "India").replace(",", " ").strip() or "India"

    url = f"{ADZUNA_BASE}/{country}/search/{page}"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": what,
        "where": where,
        "results_per_page": min(results_per_page, 50),
        "content-type": "application/json",
    }

    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results") or []
        jobs = []
        for i, adzuna_job in enumerate(results):
            try:
                job = _adzuna_job_to_our_format(adzuna_job, i)
                jobs.append(job)
            except Exception:
                continue
        return jobs
    except Exception as e:
        print(f"Adzuna API error: {e}")
        return []


def _get_rapidapi_key() -> str:
    return os.getenv("RAPIDAPI_KEY", "").strip()


def _jsearch_job_to_our_format(job: Dict[str, Any], index: int) -> Dict[str, Any]:
    """Convert JSearch (RapidAPI) job object to our app's job format."""
    title = job.get("job_title") or job.get("title") or "Job"
    employer = job.get("employer_name") or job.get("company") or "Company"
    loc = job.get("job_city") or job.get("job_country") or ""
    if job.get("job_country") and job.get("job_city"):
        location = f"{job['job_city']}, {job['job_country']}"
    else:
        location = loc or "India"
    if location and "india" not in location.lower():
        location = f"{location}, India" if location else "India"
    description = job.get("job_description") or job.get("description") or ""
    url = job.get("job_apply_link") or job.get("job_link") or job.get("url") or ""
    salary_min = job.get("job_min_salary")
    salary_max = job.get("job_max_salary")
    salary_range = "Competitive"
    if salary_min is not None or salary_max is not None:
        if salary_min is not None and salary_max is not None:
            salary_range = f"₹{salary_min:,} - ₹{salary_max:,} per year"
        elif salary_min is not None:
            salary_range = f"₹{salary_min:,}+ per year"
        else:
            salary_range = f"Up to ₹{salary_max:,} per year"
    title_lower = title.lower()
    if any(x in title_lower for x in ["senior", "lead", "principal", "staff", "architect"]):
        experience_level = "Senior"
    elif any(x in title_lower for x in ["junior", "intern", "graduate", "entry"]):
        experience_level = "Junior"
    else:
        experience_level = "Mid-level"
    job_employment = (job.get("job_employment_type") or "FULLTIME").upper()
    remote = "remote" in (description + title + location).lower() or (job.get("job_is_remote") is True)
    skills_required = _extract_skills_from_text(description + " " + title)
    return {
        "id": f"jsearch_{job.get('job_id', index)}",
        "title": title,
        "company": employer,
        "location": location,
        "type": "Full-time" if job_employment == "FULLTIME" else "Part-time",
        "experience_level": experience_level,
        "description": description,
        "skills_required": skills_required if skills_required else ["relevant experience"],
        "salary_range": salary_range,
        "remote_friendly": remote,
        "url": url,
        "source": "JSearch",
    }


def fetch_real_jobs_from_jsearch(
    query: str,
    location: str = "India",
    page: int = 1,
    num_pages: int = 1,
) -> List[Dict[str, Any]]:
    """
    Fetch jobs from JSearch API (RapidAPI). Aggregates from multiple job boards.
    Requires RAPIDAPI_KEY. Returns list in our app's format or [].
    """
    api_key = _get_rapidapi_key()
    if not api_key:
        return []

    headers = {
        "X-RapidAPI-Key": api_key,
        "X-RapidAPI-Host": JSEARCH_RAPIDAPI_HOST,
    }
    params = {
        "query": f"{query} in {location}" if location else query,
        "page": str(page),
        "num_pages": str(num_pages),
    }

    try:
        resp = requests.get(JSEARCH_RAPIDAPI_URL, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
        results = data.get("data") or []
        jobs = []
        for i, j in enumerate(results):
            try:
                jobs.append(_jsearch_job_to_our_format(j, i))
            except Exception:
                continue
        return jobs
    except Exception as e:
        print(f"JSearch API error: {e}")
        return []


def fetch_real_jobs_for_resume(
    resume_skills: List[str],
    resume_summary_or_title: str = "",
    location: str = "India",
    max_jobs: int = 25,
) -> List[Dict[str, Any]]:
    """
    Fetch real jobs relevant to a resume. Tries configured APIs in order:
    Adzuna (if ADZUNA_APP_ID + ADZUNA_APP_KEY set), then JSearch (if RAPIDAPI_KEY set).
    No API is compulsory; if none configured or all fail, returns [] and app uses sample jobs.
    """
    keywords = list(resume_skills)[:8]
    if resume_summary_or_title:
        stop = {"the", "and", "for", "with", "years", "experience", "looking", "seeking"}
        words = re.findall(r"\b[a-zA-Z][a-zA-Z0-9+#.]*\b", resume_summary_or_title)
        for w in words[:6]:
            wl = w.lower()
            if len(wl) > 2 and wl not in stop and wl not in keywords:
                keywords.append(wl)
    if not keywords:
        keywords = ["software", "developer"]
    query = " ".join(keywords[:5])
    location = (location or "India").strip() or "India"

    # Try Adzuna first if configured
    jobs = fetch_real_jobs_from_adzuna(
        keywords=keywords,
        location=location,
        results_per_page=min(max_jobs, 50),
        page=1,
    )
    if jobs:
        return jobs[:max_jobs]

    # Then try JSearch (RapidAPI) if configured
    jobs = fetch_real_jobs_from_jsearch(
        query=query,
        location=location,
        page=1,
        num_pages=min(3, (max_jobs // 10) + 1),
    )
    if jobs:
        return jobs[:max_jobs]

    return []
