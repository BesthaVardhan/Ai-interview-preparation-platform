import os
from flask_sqlalchemy import SQLAlchemy

# Single database instance for both SQLite and MySQL
db = SQLAlchemy()

def get_sqlite_uri():
    """Get SQLite database URI for resume data"""
    return f"sqlite:///{os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db')}"

def get_mysql_uri():
    """Get MySQL database URI for user authentication"""
    mysql_host = os.getenv('MYSQL_HOST', 'localhost')
    mysql_user = os.getenv('MYSQL_USER', 'root')
    mysql_password = os.getenv('MYSQL_PASSWORD', '')
    mysql_database = os.getenv('MYSQL_DATABASE', 'interview_app_users')
    
    # URL encode password to handle special characters
    from urllib.parse import quote_plus
    encoded_password = quote_plus(mysql_password)
    
    return f"mysql+pymysql://{mysql_user}:{encoded_password}@{mysql_host}/{mysql_database}?charset=utf8mb4"

def init_databases(app):
    """Initialize both databases with proper configuration"""
    # Configure SQLite as default for resume data
    app.config['SQLALCHEMY_DATABASE_URI'] = get_sqlite_uri()
    app.config['SQLALCHEMY_BINDS'] = {
        'mysql': get_mysql_uri()  # MySQL for users
    }
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize the database
    db.init_app(app)
    
    # Create tables for both databases
    with app.app_context():
        # Create SQLite tables (resume data)
        from src.models.resume import Resume, JobRecommendation, ImprovementSuggestion
        db.create_all()
        
        # Create MySQL tables (user authentication only)
        from src.models.user_auth import User
        User.__table__.create(db.engines['mysql'], checkfirst=True)
    
    return db
