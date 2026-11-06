import os
import re
import sqlite3
from typing import List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score


DB_PATH = r"c:\Users\banda\Videos\project_final\capstone_project\resume_backend\src\database\app.db"
OUT_PATH = r"c:\Users\banda\Videos\project_final\capstone_project\resume_backend\analytics\Model_Performance_Comparison_Table.txt"


def keyword_matching_score(resume_text: str, job_text: str) -> float:
    rt = set(re.findall(r"[a-z0-9+#.]+", (resume_text or "").lower()))
    jt = set(re.findall(r"[a-z0-9+#.]+", (job_text or "").lower()))
    if not jt:
        return 0.0
    return len(rt & jt) / max(len(jt), 1)


def basic_nlp_parsing_score(resume_text: str, job_text: str) -> float:
    def skillish(text: str) -> set:
        toks = re.findall(r"[a-z0-9+#.]+", (text or "").lower())
        return set([t for t in toks if (len(t) >= 4 or any(c in t for c in ["+", "#", "."]))])

    r = skillish(resume_text)
    j = skillish(job_text)
    if not j:
        return 0.0
    return len(r & j) / max(len(j), 1)


def tfidf_cosine_score(resume_text: str, job_text: str) -> float:
    vec = TfidfVectorizer(stop_words="english", max_features=1200, ngram_range=(1, 2))
    X = vec.fit_transform([resume_text or "", job_text or ""])
    v0 = X[0].toarray()[0]
    v1 = X[1].toarray()[0]
    denom = float(np.linalg.norm(v0) * np.linalg.norm(v1))
    if denom == 0.0:
        return 0.0
    return float(np.dot(v0, v1) / denom)


def proposed_resume_analyzer_score(resume_text: str, job_text: str) -> float:
    tfidf = tfidf_cosine_score(resume_text, job_text)
    kw = keyword_matching_score(resume_text, job_text)
    nlp = basic_nlp_parsing_score(resume_text, job_text)
    score = 0.55 * tfidf + 0.25 * kw + 0.20 * nlp
    if score < 0:
        return 0.0
    if score > 1:
        return 1.0
    return float(score)


def main():
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"DB not found at: {DB_PATH}\nRun the backend once and open Job Recommendations first.")

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    rows = cur.execute(
        """
        SELECT
          jr.resume_id AS resume_id,
          r.raw_text AS resume_text,
          jr.job_title AS job_title,
          jr.job_description AS job_text,
          jr.match_score AS match_score
        FROM job_recommendations jr
        JOIN resumes r ON r.id = jr.resume_id
        WHERE COALESCE(r.raw_text,'') <> '' AND COALESCE(jr.job_description,'') <> ''
        """
    ).fetchall()
    con.close()

    # Build per-resume groups so we can create non-degenerate labels.
    # Ground-truth (silver) label: for each resume, the top-K jobs by stored match_score are positives.
    TOP_K = 2
    groups = {}
    for row in rows:
        rid = int(row["resume_id"])
        groups.setdefault(rid, []).append(
            {
                "resume_text": row["resume_text"],
                "job_text": row["job_text"],
                "match_score": float(row["match_score"] or 0.0),
            }
        )

    # Flatten into a list with labels assigned
    items = []
    for rid, recs in groups.items():
        recs_sorted = sorted(recs, key=lambda x: x["match_score"], reverse=True)
        for idx, rec in enumerate(recs_sorted):
            label = 1 if idx < TOP_K else 0
            items.append((rid, rec["resume_text"], rec["job_text"], label))

    if len(items) < 10:
        raise SystemExit(f"Not enough DB pairs to evaluate (found {len(items)}). Upload/open more job matches first.")

    y_true = [lbl for _, _, _, lbl in items]

    # For each method, predict positives as top-K by that method score within each resume group.
    def topk_predictions(scores_by_resume: dict, top_k: int) -> List[int]:
        preds = []
        for rid, score_list in scores_by_resume.items():
            # indices of items for this resume within the flattened order
            order = sorted(range(len(score_list)), key=lambda i: score_list[i], reverse=True)
            top_set = set(order[:top_k])
            preds.extend([1 if i in top_set else 0 for i in range(len(score_list))])
        return preds

    # Compute scores grouped by resume in the same order as items grouped
    resume_to_texts = {}
    for rid, rt, jt, lbl in items:
        resume_to_texts.setdefault(rid, []).append((rt, jt, lbl))

    method_scores = {}
    # Keyword Matching
    method_scores["Keyword Matching"] = {
        rid: [keyword_matching_score(rt, jt) for rt, jt, _ in pairs]
        for rid, pairs in resume_to_texts.items()
    }
    # TF-IDF + Cosine
    method_scores["TF-IDF + Cosine Similarity"] = {
        rid: [tfidf_cosine_score(rt, jt) for rt, jt, _ in pairs]
        for rid, pairs in resume_to_texts.items()
    }
    # Basic NLP Parsing
    method_scores["Basic NLP Parsing"] = {
        rid: [basic_nlp_parsing_score(rt, jt) for rt, jt, _ in pairs]
        for rid, pairs in resume_to_texts.items()
    }
    # Proposed Resume Analyzer
    method_scores["Proposed Resume Analyzer"] = {
        rid: [proposed_resume_analyzer_score(rt, jt) for rt, jt, _ in pairs]
        for rid, pairs in resume_to_texts.items()
    }

    lines = []
    lines.append("Table 1. Performance comparison of different resume matching techniques (silver-label from real DB)")
    lines.append(f"Pairs used: {len(items)} | Label rule: per-resume TOP_K={TOP_K} by stored match_score")
    lines.append("")
    lines.append(f"{'Method':28} {'Accuracy (%)':>12} {'Precision':>10} {'Recall':>8} {'F1 Score':>9}")
    lines.append("-" * 72)

    for name, scores_by_resume in method_scores.items():
        y_pred = topk_predictions(scores_by_resume, TOP_K)
        acc = accuracy_score(y_true, y_pred) * 100
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        lines.append(f"{name:28} {acc:12.1f} {prec:10.2f} {rec:8.2f} {f1:9.2f}")

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print("Saved:", OUT_PATH)
    print("\n".join(lines[-6:]))


if __name__ == "__main__":
    main()

