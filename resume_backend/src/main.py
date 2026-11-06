import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Load .env so RAPIDAPI_KEY, ADZUNA_APP_ID, etc. are available
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(_env_path)
except ImportError:
    pass

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.config.database_unified import init_databases, db
from src.models.user import User
from src.models.user_auth import User as AuthUser
from src.models.resume import Resume, JobRecommendation, ImprovementSuggestion
from src.routes.user import user_bp
from src.routes.resume import resume_bp
from src.routes.jobs import jobs_bp
from src.routes.improvements import improvements_bp
from src.routes.attempts import attempts_bp
from src.routes.auth import auth_bp

project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # .../capstone_project
dist_dir = os.path.join(project_root, 'capstone_final_fix', 'dist')
app = Flask(__name__, static_folder=dist_dir, static_url_path="/")
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'your-super-secret-jwt-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire for testing
app.config['JWT_TOKEN_LOCATION'] = ['headers', 'cookies', 'query_string']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Enable CORS for all routes
CORS(app, origins="*")

# Initialize both databases
init_databases(app)  # Initialize both SQLite and MySQL

# Initialize JWT Manager
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')  # JWT authentication
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
app.register_blueprint(improvements_bp, url_prefix='/api/improvements')
app.register_blueprint(attempts_bp, url_prefix='/api/attempts')

@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
    
    
    
    
    
    
    
    
    
    
    
# :: STEP 1 - GO TO BACKEND FOLDER
# cd "C:\Users\nanib\Downloads\capstone_project\capstone\An-AI-Driven-Interview-Preparation-Platform-with-Resume-Analysis-and-Performance-Evaluation\resume_backend"

# :: STEP 2 - ACTIVATE VIRTUAL ENVIRONMENT
# .venv\Scripts\activate

# :: STEP 3 - RUN BACKEND
# python -m src.main