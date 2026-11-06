import os
from flask_sqlalchemy import SQLAlchemy

# Single database instance with multiple binds
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
    """Initialize both databases with proper binds"""
    # Configure both databases
    app.config['SQLALCHEMY_DATABASE_URI'] = get_sqlite_uri()  # Default for resumes
    app.config['SQLALCHEMY_BINDS'] = {
        'mysql': get_mysql_uri()  # MySQL for users
    }
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize with both databases
    db.init_app(app)
    
    # Create tables for both databases
    with app.app_context():
        db.create_all()  # Creates SQLite tables
        # Create MySQL tables using the bind
        db.metadata.tables['users'].create(db.engine, bind_key='mysql')
    
    return db
