from src.models.user import db
from datetime import datetime
import json


class Attempt(db.Model):
    __tablename__ = 'attempts'

    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(255), nullable=False, index=True)
    step_id = db.Column(db.String(100), nullable=False)
    score = db.Column(db.Float, nullable=False)
    feedback = db.Column(db.Text)
    strengths_json = db.Column(db.Text)
    improvements_json = db.Column(db.Text)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, user_email, step_id, score, feedback=None,
                 strengths=None, improvements=None, completed_at=None):
        self.user_email = user_email
        self.step_id = step_id
        self.score = score
        self.feedback = feedback
        self.strengths_json = json.dumps(strengths or [])
        self.improvements_json = json.dumps(improvements or [])
        self.completed_at = completed_at or datetime.utcnow()

    def get_strengths(self):
        try:
            return json.loads(self.strengths_json) if self.strengths_json else []
        except Exception:
            return []

    def get_improvements(self):
        try:
            return json.loads(self.improvements_json) if self.improvements_json else []
        except Exception:
            return []

    def to_dict(self):
        return {
            'id': self.id,
            'user_email': self.user_email,
            'step_id': self.step_id,
            'score': self.score,
            'feedback': self.feedback,
            'strengths': self.get_strengths(),
            'improvements': self.get_improvements(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }



