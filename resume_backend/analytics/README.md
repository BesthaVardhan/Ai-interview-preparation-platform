## Analytics graphs

This folder contains a script that generates graphs from the backend SQLite database created by the app at:

- `resume_backend/src/database/app.db`

### What it generates

PNG files under `resume_backend/analytics/output/`:

- `experience_level_matrix.png` (heatmap): resume level vs recommended job level (counts)
- `ats_score_hist.png`: ATS score distribution (if ATS scores exist)
- `match_score_hist.png`: match score distribution (if job recommendations exist)
- `top_companies.png`: most recommended companies
- `top_job_titles.png`: most recommended titles

### Run

1. Start the backend at least once and use the app (upload resume + open Job Recommendations) so the DB exists.
2. Install plotting deps (one-time):

```powershell
pip install matplotlib seaborn
```

3. Generate graphs:

```powershell
cd c:\Users\banda\Videos\project_final\capstone_project\resume_backend
python .\analytics\generate_graphs.py
```

