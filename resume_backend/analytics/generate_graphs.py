import json
import os
import sqlite3


def _ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def _load_rows(db_path: str):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    resumes = cur.execute(
        "SELECT id, user_email, filename, parsed_data, ats_score, created_at FROM resumes"
    ).fetchall()
    con.close()
    return resumes


def main():
    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(backend_root, "src", "database", "app.db")
    out_dir = os.path.join(os.path.dirname(__file__), "output")
    _ensure_dir(out_dir)

    if not os.path.exists(db_path):
        raise SystemExit(
            "Database not found at:\n"
            f"  {db_path}\n\n"
            "Run the backend once (upload a resume and open Job Recommendations) so it creates the DB, then re-run."
        )

    try:
        import matplotlib.pyplot as plt
    except Exception:
        raise SystemExit(
            "Missing plotting dependency.\n"
            "Install with:\n"
            "  pip install matplotlib\n"
        )

    resumes = _load_rows(db_path)

    # Collect ATS scores (only real resumes have ats_score)
    ats_scores = []
    for r in resumes:
        if r["ats_score"] is not None:
            ats_scores.append(float(r["ats_score"]))

    # ATS score distribution (ONLY output we generate)
    if ats_scores:
        plt.figure(figsize=(7, 4))
        # Use 5-point buckets on x-axis (0,5,10,...,100)
        bins = list(range(0, 105, 5))
        plt.hist(ats_scores, bins=bins, color="#2563eb", alpha=0.85, edgecolor="white")
        plt.title("ATS score distribution")
        plt.xlabel("ATS score (5-point buckets)")
        plt.ylabel("Count")
        plt.xticks(range(0, 101, 5), rotation=0)
        plt.tight_layout()
        plt.savefig(os.path.join(out_dir, "ats_score_hist.png"), dpi=160)
        plt.close()
        print("Saved graph to:")
        print(f"  {os.path.join(out_dir, 'ats_score_hist.png')}")
    else:
        raise SystemExit("No ATS scores found (ats_score is NULL for all resumes). Upload a resume first.")


if __name__ == "__main__":
    main()

