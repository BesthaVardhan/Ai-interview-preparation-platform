import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from src.models.resume import Resume, JobRecommendation, ImprovementSuggestion
from src.config.database_unified import db
from src.services.resume_parser import ResumeParser
from src.services.ats_scorer import ATSScorer

resume_bp = Blueprint('resume', __name__)

# Configure upload settings
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16MB

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_size(file):
    """Get file size"""
    file.seek(0, 2)  # Seek to end
    size = file.tell()
    file.seek(0)  # Reset to beginning
    return size

@resume_bp.route('/upload', methods=['POST'])
def upload_resume():
    """Upload and parse resume file"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_email = request.form.get('user_email')
        
        if not user_email:
            return jsonify({'error': 'User email is required'}), 400
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Please upload PDF, DOCX, or TXT files.'}), 400
        
        # Check file size
        if get_file_size(file) > MAX_FILE_SIZE:
            return jsonify({'error': 'File size too large. Maximum size is 16MB.'}), 400
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, UPLOAD_FOLDER)
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        file.save(file_path)
        
        # Parse resume
        parser = ResumeParser()
        try:
            parsed_data = parser.parse_file(file_path, file_extension)
        except Exception as parse_err:
            # Cleanup saved file when parsing fails
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': f'Failed to parse resume: {str(parse_err)}'}), 400
        
        # Reject image/screenshot PDFs (no or very little extractable text) — no ATS
        raw_text = (parsed_data.get('raw_text') or '').strip()
        word_count = len(raw_text.split()) if raw_text else 0
        if len(raw_text) < 200 or word_count < 40:
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({
                'error': 'This appears to be an image or screenshot (no selectable text). ATS analysis works only with text-based resumes. Please upload a PDF or DOCX that has selectable text, or type your resume and export as PDF.'
            }), 400
        
        # Detect non-resume (certificate, application form, etc.) — no ATS; job matches by skills only
        scorer = ATSScorer()
        not_a_resume = scorer.is_not_resume(parsed_data, filename=file.filename or '')
        
        if not_a_resume:
            ats_analysis = {
                'not_a_resume': True,
                'message': 'This doesn\'t appear to be a resume. Upload a document with resume sections: Education, Skills, Experience, Projects, Certifications, Awards/Internships, and contact (email/phone). ATS score is only for resumes.',
                'overall_score': None,
                'component_scores': {},
                'recommendations': [],
                'strengths': [],
                'improvement_areas': []
            }
            resume = Resume(
                user_email=user_email,
                filename=file.filename,
                file_path=file_path,
                file_type=file_extension
            )
            resume.raw_text = parsed_data.get('raw_text', '')
            resume.set_parsed_data(parsed_data)
            resume.ats_score = None
            resume.set_ats_analysis(ats_analysis)
            db.session.add(resume)
            db.session.commit()
            return jsonify({
                'message': 'Document uploaded. This does not appear to be a resume — ATS analysis is not provided. Job matches are based on extracted skills only.',
                'resume_id': resume.id,
                'ats_score': None,
                'analysis': ats_analysis,
                'parsed_data': parsed_data,
                'not_a_resume': True
            }), 200
        
        # Calculate ATS score for actual resumes
        try:
            ats_analysis = scorer.calculate_ats_score(parsed_data)
        except Exception as score_err:
            return jsonify({'error': f'Failed to score resume: {str(score_err)}'}), 400
        
        # Save to database
        resume = Resume(
            user_email=user_email,
            filename=file.filename,
            file_path=file_path,
            file_type=file_extension
        )
        resume.raw_text = parsed_data.get('raw_text', '')
        resume.set_parsed_data(parsed_data)
        resume.ats_score = ats_analysis['overall_score']
        resume.set_ats_analysis(ats_analysis)
        
        db.session.add(resume)
        db.session.commit()
        
        # Generate improvement suggestions
        suggestions = generate_improvement_suggestions(resume.id, ats_analysis)
        for suggestion in suggestions:
            db.session.add(suggestion)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resume uploaded and analyzed successfully',
            'resume_id': resume.id,
            'ats_score': ats_analysis['overall_score'],
            'analysis': ats_analysis,
            'parsed_data': parsed_data,
            'not_a_resume': False
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error processing resume: {str(e)}'}), 500

@resume_bp.route('/analysis/<int:resume_id>', methods=['GET'])
def get_resume_analysis(resume_id):
    """Get detailed resume analysis"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get improvement suggestions
        suggestions = ImprovementSuggestion.query.filter_by(resume_id=resume_id).all()
        
        return jsonify({
            'resume': resume.to_dict(),
            'suggestions': [suggestion.to_dict() for suggestion in suggestions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error retrieving analysis: {str(e)}'}), 500

@resume_bp.route('/user/<user_email>/resumes', methods=['GET'])
def get_user_resumes(user_email):
    """Get all resumes for a user"""
    try:
        resumes = Resume.query.filter_by(user_email=user_email).order_by(Resume.created_at.desc()).all()
        
        return jsonify({
            'resumes': [resume.to_dict() for resume in resumes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error retrieving resumes: {str(e)}'}), 500

@resume_bp.route('/reanalyze/<int:resume_id>', methods=['POST'])
def reanalyze_resume(resume_id):
    """Re-analyze resume with updated job description"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        job_description = request.json.get('job_description', '')
        
        # Get parsed data
        parsed_data = resume.get_parsed_data()
        
        # Recalculate ATS score with job description
        scorer = ATSScorer()
        ats_analysis = scorer.calculate_ats_score(parsed_data, job_description)
        
        # Update resume
        resume.ats_score = ats_analysis['overall_score']
        resume.set_ats_analysis(ats_analysis)
        
        # Clear old suggestions and generate new ones
        ImprovementSuggestion.query.filter_by(resume_id=resume_id).delete()
        
        suggestions = generate_improvement_suggestions(resume_id, ats_analysis)
        for suggestion in suggestions:
            db.session.add(suggestion)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Resume re-analyzed successfully',
            'ats_score': ats_analysis['overall_score'],
            'analysis': ats_analysis
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error re-analyzing resume: {str(e)}'}), 500

@resume_bp.route('/suggestions/<int:suggestion_id>/implement', methods=['PUT'])
def implement_suggestion(suggestion_id):
    """Mark a suggestion as implemented"""
    try:
        suggestion = ImprovementSuggestion.query.get(suggestion_id)
        if not suggestion:
            return jsonify({'error': 'Suggestion not found'}), 404
        
        suggestion.mark_implemented()
        db.session.commit()
        
        return jsonify({
            'message': 'Suggestion marked as implemented',
            'suggestion': suggestion.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error updating suggestion: {str(e)}'}), 500

@resume_bp.route('/delete/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete a resume and its associated data"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Delete file from filesystem
        if os.path.exists(resume.file_path):
            os.remove(resume.file_path)
        
        # Delete associated suggestions and recommendations
        ImprovementSuggestion.query.filter_by(resume_id=resume_id).delete()
        JobRecommendation.query.filter_by(resume_id=resume_id).delete()
        
        # Delete resume record
        db.session.delete(resume)
        db.session.commit()
        
        return jsonify({'message': 'Resume deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Error deleting resume: {str(e)}'}), 500

@resume_bp.route('/compare', methods=['POST'])
def compare_resumes():
    """Compare multiple resumes"""
    try:
        data = request.get_json()
        resume_ids = data.get('resume_ids', [])
        
        if len(resume_ids) < 2:
            return jsonify({'error': 'At least 2 resumes required for comparison'}), 400
        
        resumes = Resume.query.filter(Resume.id.in_(resume_ids)).all()
        
        if len(resumes) != len(resume_ids):
            return jsonify({'error': 'One or more resumes not found'}), 404
        
        comparison = {
            'resumes': [],
            'summary': {
                'highest_score': 0,
                'lowest_score': 100,
                'average_score': 0
            }
        }
        
        total_score = 0
        for resume in resumes:
            resume_data = resume.to_dict()
            comparison['resumes'].append(resume_data)
            
            score = resume.ats_score or 0
            total_score += score
            
            if score > comparison['summary']['highest_score']:
                comparison['summary']['highest_score'] = score
            if score < comparison['summary']['lowest_score']:
                comparison['summary']['lowest_score'] = score
        
        comparison['summary']['average_score'] = total_score / len(resumes)
        
        return jsonify(comparison), 200
        
    except Exception as e:
        return jsonify({'error': f'Error comparing resumes: {str(e)}'}), 500

def generate_improvement_suggestions(resume_id: int, ats_analysis: dict) -> list:
    """Generate improvement suggestions based on ATS analysis"""
    suggestions = []
    
    # Extract recommendations from ATS analysis
    recommendations = ats_analysis.get('recommendations', [])
    component_scores = ats_analysis.get('component_scores', {})
    
    # Generate suggestions based on component scores
    for component, score_data in component_scores.items():
        score = score_data.get('score', 0)
        
        if component == 'keywords' and score < 70:
            suggestions.append(
                ImprovementSuggestion(
                    resume_id=resume_id,
                    category='keywords',
                    priority='high',
                    suggestion='Add more relevant industry keywords and technical skills to improve ATS matching',
                    explanation='Your resume lacks important keywords that ATS systems look for. Research job descriptions in your field and incorporate relevant terms.'
                )
            )
        
        if component == 'format' and score < 80:
            suggestions.append(
                ImprovementSuggestion(
                    resume_id=resume_id,
                    category='format',
                    priority='medium',
                    suggestion='Improve resume formatting for better ATS compatibility',
                    explanation='Use standard section headers, bullet points, and avoid complex formatting that ATS systems cannot parse properly.'
                )
            )
        
        if component == 'content' and score < 70:
            suggestions.append(
                ImprovementSuggestion(
                    resume_id=resume_id,
                    category='content',
                    priority='high',
                    suggestion='Enhance content quality with more action verbs and quantified achievements',
                    explanation='Use strong action verbs and include specific numbers, percentages, and metrics to demonstrate your impact.'
                )
            )
        
        if component == 'completeness' and score < 80:
            suggestions.append(
                ImprovementSuggestion(
                    resume_id=resume_id,
                    category='completeness',
                    priority='medium',
                    suggestion='Add missing resume sections for completeness',
                    explanation='Ensure your resume includes all standard sections: contact info, summary, experience, education, and skills.'
                )
            )
    
    # Add specific suggestions from recommendations
    for recommendation in recommendations:
        if 'keyword' in recommendation.lower():
            priority = 'high'
            category = 'keywords'
        elif 'format' in recommendation.lower():
            priority = 'medium'
            category = 'format'
        elif 'content' in recommendation.lower():
            priority = 'high'
            category = 'content'
        else:
            priority = 'low'
            category = 'general'
        
        suggestions.append(
            ImprovementSuggestion(
                resume_id=resume_id,
                category=category,
                priority=priority,
                suggestion=recommendation,
                explanation='Based on ATS analysis of your resume.'
            )
        )
    
    return suggestions

