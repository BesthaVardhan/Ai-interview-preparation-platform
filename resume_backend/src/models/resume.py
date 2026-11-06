from src.config.database_unified import db
from datetime import datetime
import json

class Resume(db.Model):
    __tablename__ = 'resumes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(255), nullable=False, index=True)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # pdf, docx, txt
    
    # Parsed content
    raw_text = db.Column(db.Text)
    parsed_data = db.Column(db.Text)  # JSON string of structured data
    
    # ATS Analysis
    ats_score = db.Column(db.Float)
    ats_analysis = db.Column(db.Text)  # JSON string of detailed analysis
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_email, filename, file_path, file_type):
        self.user_email = user_email
        self.filename = filename
        self.file_path = file_path
        self.file_type = file_type
    
    def set_parsed_data(self, data):
        """Store parsed resume data as JSON string"""
        self.parsed_data = json.dumps(data)
    
    def get_parsed_data(self):
        """Retrieve parsed resume data as Python object"""
        if self.parsed_data:
            return json.loads(self.parsed_data)
        return {}
    
    def set_ats_analysis(self, analysis):
        """Store ATS analysis as JSON string"""
        self.ats_analysis = json.dumps(analysis)
    
    def get_ats_analysis(self):
        """Retrieve ATS analysis as Python object"""
        if self.ats_analysis:
            return json.loads(self.ats_analysis)
        return {}
    
    def to_dict(self):
        """Convert resume object to dictionary for API responses"""
        return {
            'id': self.id,
            'user_email': self.user_email,
            'filename': self.filename,
            'file_type': self.file_type,
            'parsed_data': self.get_parsed_data(),
            'ats_score': self.ats_score,
            'ats_analysis': self.get_ats_analysis(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class JobRecommendation(db.Model):
    __tablename__ = 'job_recommendations'
    
    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    job_title = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255))
    job_description = db.Column(db.Text)
    match_score = db.Column(db.Float)
    match_analysis = db.Column(db.Text)  # JSON string of match details
    job_url = db.Column(db.String(500))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, resume_id, job_title, company=None, job_description=None, 
                 match_score=None, match_analysis=None, job_url=None):
        self.resume_id = resume_id
        self.job_title = job_title
        self.company = company
        self.job_description = job_description
        self.match_score = match_score
        self.match_analysis = match_analysis
        self.job_url = job_url
    
    def set_match_analysis(self, analysis):
        """Store match analysis as JSON string"""
        self.match_analysis = json.dumps(analysis)
    
    def get_match_analysis(self):
        """Retrieve match analysis as Python object"""
        if self.match_analysis:
            return json.loads(self.match_analysis)
        return {}
    
    def to_dict(self):
        """Convert job recommendation to dictionary for API responses"""
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'job_title': self.job_title,
            'company': self.company,
            'job_description': self.job_description,
            'match_score': self.match_score,
            'match_analysis': self.get_match_analysis(),
            'job_url': self.job_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ImprovementSuggestion(db.Model):
    __tablename__ = 'improvement_suggestions'
    
    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    category = db.Column(db.String(100), nullable=False)  # content, format, skills, etc.
    priority = db.Column(db.String(20), nullable=False)  # high, medium, low
    suggestion = db.Column(db.Text, nullable=False)
    explanation = db.Column(db.Text)
    is_implemented = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    implemented_at = db.Column(db.DateTime)
    
    def __init__(self, resume_id, category, priority, suggestion, explanation=None):
        self.resume_id = resume_id
        self.category = category
        self.priority = priority
        self.suggestion = suggestion
        self.explanation = explanation
    
    def mark_implemented(self):
        """Mark suggestion as implemented"""
        self.is_implemented = True
        self.implemented_at = datetime.utcnow()
    
    def to_dict(self):
        """Convert suggestion to dictionary for API responses"""
        return {
            'id': self.id,
            'resume_id': self.resume_id,
            'category': self.category,
            'priority': self.priority,
            'suggestion': self.suggestion,
            'explanation': self.explanation,
            'is_implemented': self.is_implemented,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'implemented_at': self.implemented_at.isoformat() if self.implemented_at else None
        }

