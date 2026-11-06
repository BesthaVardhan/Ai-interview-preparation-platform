import os
from flask_sqlalchemy import SQLAlchemy

# SQLite database for resume data
sqlite_db = SQLAlchemy()

def get_sqlite_uri():
    """Get SQLite database URI for resume data"""
    return f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db')}"

def init_sqlite_db(app):
    """Initialize SQLite database for resume data"""
    app.config['SQLALCHEMY_DATABASE_URI'] = get_sqlite_uri()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    sqlite_db.init_app(app)
    
    with app.app_context():
        sqlite_db.create_all()
    
    return sqlite_db

# Export the database instance for use in models
db = sqlite_db
