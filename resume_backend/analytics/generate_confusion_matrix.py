import os
import re
import sqlite3
from typing import Dict, List, Tuple

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import confusion_matrix


DB_PATH = r"c:\Users\banda\Videos\project_final\capstone_project\resume_backend\src\database\app.db"


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


def _load_recommendations() -> List[sqlite3.Row]:
    if not os.path.exists(DB_PATH):
        raise SystemExit(f"DB not found: {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    rows = cur.execute(
        """
        SELECT
          jr.resume_id AS resume_id,
          r.raw_text AS resume_text,
          jr.job_description AS job_text,
          jr.match_score AS match_score
        FROM job_recommendations jr
        JOIN resumes r ON r.id = jr.resume_id
        WHERE COALESCE(r.raw_text,'') <> '' AND COALESCE(jr.job_description,'') <> ''
        """
    ).fetchall()
    con.close()
    return rows


def main():
    TOP_K = 2
    rows = _load_recommendations()
    if not rows:
        raise SystemExit("No job recommendations found in DB. Open Job Recommendations in the app first.")

    # Group recommendations by resume_id
    grouped: Dict[int, List[Tuple[str, str, float]]] = {}
    for r in rows:
        rid = int(r["resume_id"])
        grouped.setdefault(rid, []).append(
            (r["resume_text"], r["job_text"], float(r["match_score"] or 0.0))
        )

    # Create y_true using proxy labels (top-K by stored match_score per resume)
    y_true: List[int] = []
    by_resume_pairs: Dict[int, List[Tuple[str, str]]] = {}
    for rid, recs in grouped.items():
        recs_sorted = sorted(recs, key=lambda x: x[2], reverse=True)
        by_resume_pairs[rid] = [(rt, jt) for rt, jt, _ in recs_sorted]
        for idx, _ in enumerate(recs_sorted):
            y_true.append(1 if idx < TOP_K else 0)

    def predict_topk(score_fn) -> List[int]:
        y_pred: List[int] = []
        for rid, pairs in by_resume_pairs.items():
            scores = [score_fn(rt, jt) for rt, jt in pairs]
            order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
            top_set = set(order[:TOP_K])
            y_pred.extend([1 if i in top_set else 0 for i in range(len(scores))])
        return y_pred

    methods = [
        ("Keyword Matching", keyword_matching_score),
        ("TF-IDF + Cosine Similarity", tfidf_cosine_score),
        ("Basic NLP Parsing", basic_nlp_parsing_score),
        ("Proposed Resume Analyzer", proposed_resume_analyzer_score),
    ]

    print(f"DB: {DB_PATH}")
    print(f"Resumes used: {len(by_resume_pairs)} | Total pairs: {len(y_true)}")
    print(f"Proxy ground-truth: TOP_K={TOP_K} by stored match_score per resume\n")

    for name, fn in methods:
        y_pred = predict_topk(fn)
        cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
        tn, fp, fn_, tp = cm.ravel()
        print(name)
        print("Confusion matrix (rows=true [0,1], cols=pred [0,1]):")
        print(cm)
        print(f"TN={tn} FP={fp} FN={fn_} TP={tp}\n")


if __name__ == "__main__":
    main()

