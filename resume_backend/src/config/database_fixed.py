import os
from flask_sqlalchemy import SQLAlchemy

# Single database instance for MySQL users
db = SQLAlchemy()

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

def init_mysql_db(app):
    """Initialize MySQL database for user authentication"""
    app.config['SQLALCHEMY_DATABASE_URI'] = get_mysql_uri()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    return db
