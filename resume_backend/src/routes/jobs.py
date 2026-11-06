from flask import Blueprint, request, jsonify
from src.models.resume import db, Resume, JobRecommendation
from src.services.job_matcher import JobMatcher

jobs_bp = Blueprint('jobs', __name__)

# Minimum ATS score required to show job matches (below this we ask user to improve resume first)
MIN_ATS_SCORE_FOR_JOBS = 30

@jobs_bp.route('/recommendations/<int:resume_id>', methods=['GET'])
def get_job_recommendations(resume_id):
    """Get job recommendations for a specific resume. Returns no matches if ATS score < 30%."""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # For non-resume (certificate, application form) ats_score is None — still show job matches by skills only
        ats_score = resume.ats_score
        if ats_score is not None and ats_score < MIN_ATS_SCORE_FOR_JOBS:
            return jsonify({
                'resume_id': resume_id,
                'matches': [],
                'summary': {'total_matches': 0, 'avg_match_score': 0, 'top_skills_in_demand': [], 'recommended_improvements': []},
                'total_found': 0,
                'ats_too_low': True,
                'message': 'Increase ATS score to see job matches. Your current ATS score is below 30%. Improve your resume using the Analysis and Improvements tabs, then re-upload to get recommendations.'
            }), 200
        
        # Get user preferences from query parameters
        preferences = {
            'location': request.args.get('location'),
            'remote_only': request.args.get('remote_only', 'false').lower() == 'true',
            'experience_level': request.args.get('experience_level'),
            'min_salary': int(request.args.get('min_salary', 0)) if request.args.get('min_salary') else None
        }
        
        # Remove None values
        preferences = {k: v for k, v in preferences.items() if v is not None and v != ''}
        
        # Get parsed resume data
        parsed_data = resume.get_parsed_data()
        
        # Find job matches
        matcher = JobMatcher()
        matches = matcher.find_job_matches(parsed_data, preferences)
        
        # Get recommendations summary
        summary = matcher.get_job_recommendations_summary(matches)
        
        # Save top recommendations to database
        _save_job_recommendations(resume_id, matches[:10])  # Save top 10
        
        return jsonify({
            'resume_id': resume_id,
            'matches': matches,
            'summary': summary,
            'total_found': len(matches),
            'ats_too_low': False
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error finding job recommendations: {str(e)}'}), 500

@jobs_bp.route('/recommendations/<int:resume_id>/saved', methods=['GET'])
def get_saved_recommendations(resume_id):
    """Get previously saved job recommendations"""
    try:
        recommendations = JobRecommendation.query.filter_by(resume_id=resume_id).order_by(
            JobRecommendation.match_score.desc()
        ).all()
        
        return jsonify({
            'recommendations': [rec.to_dict() for rec in recommendations]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error retrieving saved recommendations: {str(e)}'}), 500

@jobs_bp.route('/search', methods=['POST'])
def search_jobs():
    """Search jobs with custom criteria"""
    try:
        data = request.get_json()
        
        # Extract search criteria
        keywords = data.get('keywords', '')
        location = data.get('location', '')
        experience_level = data.get('experience_level', '')
        remote_only = data.get('remote_only', False)
        
        # Initialize job matcher
        matcher = JobMatcher()
        
        # Filter jobs based on criteria
        filtered_jobs = []
        for job in matcher.sample_jobs:
            # Check keywords
            if keywords:
                job_text = f"{job['title']} {job['description']} {' '.join(job['skills_required'])}".lower()
                if not any(keyword.lower() in job_text for keyword in keywords.split()):
                    continue
            
            # Check location
            if location and location.lower() not in job['location'].lower():
                continue
            
            # Check experience level
            if experience_level and experience_level.lower() not in job['experience_level'].lower():
                continue
            
            # Check remote preference
            if remote_only and not job.get('remote_friendly', False):
                continue
            
            filtered_jobs.append(job)
        
        return jsonify({
            'jobs': filtered_jobs,
            'total_found': len(filtered_jobs),
            'search_criteria': {
                'keywords': keywords,
                'location': location,
                'experience_level': experience_level,
                'remote_only': remote_only
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error searching jobs: {str(e)}'}), 500

@jobs_bp.route('/match-analysis', methods=['POST'])
def analyze_job_match():
    """Analyze match between resume and specific job description"""
    try:
        data = request.get_json()
        resume_id = data.get('resume_id')
        job_description = data.get('job_description')
        job_title = data.get('job_title', 'Custom Job')
        
        if not resume_id or not job_description:
            return jsonify({'error': 'Resume ID and job description are required'}), 400
        
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get parsed resume data
        parsed_data = resume.get_parsed_data()
        
        # Create a temporary job object for analysis
        temp_job = {
            'title': job_title,
            'description': job_description,
            'skills_required': _extract_skills_from_job_description(job_description),
            'experience_level': 'Mid-level'  # Default
        }
        
        # Initialize matcher and calculate match
        matcher = JobMatcher()
        resume_skills = matcher._extract_resume_skills(parsed_data)
        resume_experience = matcher._extract_experience_level(parsed_data)
        resume_text = matcher._extract_resume_text(parsed_data)
        
        match_score = matcher._calculate_match_score(
            resume_skills, resume_experience, resume_text, temp_job
        )
        
        # Generate detailed analysis
        analysis = {
            'match_score': match_score,
            'recommendation': _generate_match_recommendation(match_score),
            'improvement_suggestions': _generate_improvement_suggestions(match_score),
            'job_title': job_title
        }
        
        return jsonify(analysis), 200
        
    except Exception as e:
        return jsonify({'error': f'Error analyzing job match: {str(e)}'}), 500

@jobs_bp.route('/skills-gap/<int:resume_id>', methods=['GET'])
def analyze_skills_gap(resume_id):
    """Analyze skills gap based on job market demands"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get parsed resume data
        parsed_data = resume.get_parsed_data()
        
        # Initialize matcher
        matcher = JobMatcher()
        
        # Get all job matches to analyze market demands
        matches = matcher.find_job_matches(parsed_data)
        
        # Analyze skills gap
        resume_skills = matcher._extract_resume_skills(parsed_data)
        
        # Collect all required skills from job matches
        all_required_skills = []
        missing_skills_count = {}
        
        for match in matches:
            job_skills = match['job']['skills_required']
            missing_skills = match['match_details']['missing_skills']
            
            all_required_skills.extend(job_skills)
            
            for skill in missing_skills:
                missing_skills_count[skill] = missing_skills_count.get(skill, 0) + 1
        
        # Calculate skills gap analysis
        from collections import Counter
        skill_demand = Counter(all_required_skills)
        
        # Get top missing skills
        top_missing_skills = sorted(
            missing_skills_count.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:10]
        
        # Get top in-demand skills
        top_demand_skills = skill_demand.most_common(10)
        
        # Generate learning recommendations
        learning_recommendations = []
        for skill, count in top_missing_skills[:5]:
            learning_recommendations.append({
                'skill': skill,
                'demand_count': count,
                'priority': 'high' if count >= 3 else 'medium',
                'reason': f"Required by {count} out of {len(matches)} matching jobs"
            })
        
        gap_analysis = {
            'current_skills': resume_skills,
            'top_missing_skills': [{'skill': skill, 'demand_count': count} for skill, count in top_missing_skills],
            'top_demand_skills': [{'skill': skill, 'frequency': count} for skill, count in top_demand_skills],
            'learning_recommendations': learning_recommendations,
            'skills_coverage': {
                'total_skills_in_market': len(skill_demand),
                'skills_you_have': len(set(resume_skills) & set(skill_demand.keys())),
                'coverage_percentage': round(
                    (len(set(resume_skills) & set(skill_demand.keys())) / len(skill_demand)) * 100, 1
                ) if skill_demand else 0
            }
        }
        
        return jsonify(gap_analysis), 200
        
    except Exception as e:
        return jsonify({'error': f'Error analyzing skills gap: {str(e)}'}), 500

@jobs_bp.route('/market-insights', methods=['GET'])
def get_market_insights():
    """Get general job market insights"""
    try:
        matcher = JobMatcher()
        
        # Analyze all jobs in the database
        all_skills = []
        experience_levels = []
        locations = []
        remote_jobs = 0
        salary_ranges = []
        
        for job in matcher.sample_jobs:
            all_skills.extend(job['skills_required'])
            experience_levels.append(job['experience_level'])
            locations.append(job['location'])
            
            if job.get('remote_friendly'):
                remote_jobs += 1
            
            # Extract salary info (simplified)
            salary_text = job.get('salary_range', '')
            if salary_text:
                salary_ranges.append(salary_text)
        
        from collections import Counter
        
        insights = {
            'total_jobs': len(matcher.sample_jobs),
            'top_skills_demand': [
                {'skill': skill, 'count': count} 
                for skill, count in Counter(all_skills).most_common(10)
            ],
            'experience_level_distribution': [
                {'level': level, 'count': count}
                for level, count in Counter(experience_levels).most_common()
            ],
            'top_locations': [
                {'location': loc, 'count': count}
                for loc, count in Counter(locations).most_common(5)
            ],
            'remote_work_availability': {
                'remote_jobs': remote_jobs,
                'total_jobs': len(matcher.sample_jobs),
                'percentage': round((remote_jobs / len(matcher.sample_jobs)) * 100, 1)
            },
            'salary_ranges': salary_ranges
        }
        
        return jsonify(insights), 200
        
    except Exception as e:
        return jsonify({'error': f'Error getting market insights: {str(e)}'}), 500


def _save_job_recommendations(resume_id: int, matches: list):
    """Save job recommendations to database"""
    try:
        # Clear existing recommendations
        JobRecommendation.query.filter_by(resume_id=resume_id).delete()
        
        # Save new recommendations
        for match in matches:
            job = match['job']
            recommendation = JobRecommendation(
                resume_id=resume_id,
                job_title=job['title'],
                company=job['company'],
                job_description=job['description'],
                match_score=match['match_score'],
                job_url=job.get('url')
            )
            recommendation.set_match_analysis(match['match_details'])
            db.session.add(recommendation)
        
        db.session.commit()
        
    except Exception as e:
        print(f"Error saving recommendations: {str(e)}")

def _extract_skills_from_job_description(job_description: str) -> list:
    """Extract skills from job description text"""
    # Simple skill extraction - in a real implementation, this would be more sophisticated
    common_skills = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
        'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
        'docker', 'kubernetes', 'git', 'jenkins', 'terraform', 'pandas', 'numpy',
        'tensorflow', 'scikit-learn', 'machine learning', 'data science',
        'agile', 'scrum', 'project management', 'leadership', 'communication'
    ]
    
    job_description_lower = job_description.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill in job_description_lower:
            found_skills.append(skill)
    
    return found_skills

def _generate_match_recommendation(match_score: dict) -> str:
    """Generate recommendation based on match score"""
    overall_score = match_score['overall_score']
    
    if overall_score >= 80:
        return "Excellent match! This position aligns very well with your background and skills."
    elif overall_score >= 70:
        return "Good match! You meet most of the requirements for this position."
    elif overall_score >= 60:
        return "Moderate match. Consider applying if you're interested in growing in this area."
    elif overall_score >= 50:
        return "Partial match. This could be a stretch opportunity for career growth."
    else:
        return "Limited match. Consider developing more relevant skills before applying."

def _generate_improvement_suggestions(match_score: dict) -> list:
    """Generate suggestions to improve match score"""
    suggestions = []
    
    if match_score['skills_match'] < 70:
        missing_skills = match_score.get('missing_skills', [])
        if missing_skills:
            suggestions.append(f"Consider learning these skills: {', '.join(missing_skills[:3])}")
    
    if match_score['experience_match'] < 70:
        suggestions.append("Highlight relevant experience more prominently in your resume")
    
    if match_score['text_similarity'] < 60:
        suggestions.append("Tailor your resume content to better match the job description")
    
    if not suggestions:
        suggestions.append("Your profile is already well-aligned with this position")
    
    return suggestions

