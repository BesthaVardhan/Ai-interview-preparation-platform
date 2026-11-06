import re
import json
from typing import Dict, List, Any, Tuple
from collections import Counter
import math
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class JobMatcher:
    def __init__(self):
        # Current job openings at Indian companies (India locations)
        self.sample_jobs = [
            {
                'id': 1,
                'title': 'Senior Software Engineer',
                'company': 'Infosys',
                'location': 'Bangalore, India',
                'type': 'Full-time',
                'experience_level': 'Senior',
                'description': '''
                We are hiring a Senior Software Engineer for our Bangalore office. The role involves building scalable applications using Python, JavaScript, and cloud technologies. Current opening for our digital transformation projects.
                
                Responsibilities:
                - Design and develop scalable web applications
                - Lead technical discussions and code reviews
                - Mentor junior developers
                - Collaborate with cross-functional teams
                - Implement best practices for software development
                
                Requirements:
                - Bachelor's degree in Computer Science or related field
                - 5+ years of software development experience
                - Proficiency in Python, JavaScript, React, Node.js
                - Experience with AWS, Docker, Kubernetes
                - Strong problem-solving skills
                - Excellent communication skills
                ''',
                'skills_required': ['python', 'javascript', 'react', 'node.js', 'aws', 'docker', 'kubernetes'],
                'salary_range': '₹18 LPA - ₹28 LPA',
                'remote_friendly': True,
                'url': 'https://careers.infosys.com/'
            },
            {
                'id': 2,
                'title': 'Data Scientist',
                'company': 'TCS',
                'location': 'Mumbai, India',
                'type': 'Full-time',
                'experience_level': 'Mid-level',
                'description': '''
                Tata Consultancy Services is looking for a Data Scientist in Mumbai. Join our analytics team to build ML models and derive insights. Current opening for our BFSI and retail projects.
                
                Responsibilities:
                - Develop and deploy machine learning models
                - Analyze large datasets to identify trends and patterns
                - Create data visualizations and reports
                - Collaborate with business stakeholders
                - Present findings to clients
                
                Requirements:
                - Master's or Bachelor's in Data Science, Statistics, or related field
                - 3+ years of data science experience
                - Proficiency in Python, R, SQL
                - Experience with pandas, numpy, scikit-learn, tensorflow
                - Knowledge of statistical analysis and machine learning
                - Strong presentation skills
                ''',
                'skills_required': ['python', 'r', 'sql', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'machine learning'],
                'salary_range': '₹12 LPA - ₹22 LPA',
                'remote_friendly': True,
                'url': 'https://www.tcs.com/careers'
            },
            {
                'id': 3,
                'title': 'Frontend Developer',
                'company': 'Wipro',
                'location': 'Hyderabad, India',
                'type': 'Full-time',
                'experience_level': 'Junior',
                'description': '''
                Wipro is hiring Frontend Developers for our Hyderabad campus. Current opening for our product engineering team. Build responsive web applications and grow your career with us.
                
                Responsibilities:
                - Build responsive web applications using React
                - Collaborate with designers to implement UI/UX designs
                - Optimize applications for maximum speed and scalability
                - Write clean, maintainable code
                - Participate in code reviews
                
                Requirements:
                - Bachelor's degree or equivalent experience
                - 1-3 years of frontend development experience
                - Proficiency in HTML, CSS, JavaScript, React
                - Experience with modern build tools
                - Understanding of responsive design principles
                - Portfolio of web projects
                ''',
                'skills_required': ['html', 'css', 'javascript', 'react', 'responsive design'],
                'salary_range': '₹5 LPA - ₹12 LPA',
                'remote_friendly': False,
                'url': 'https://careers.wipro.com/'
            },
            {
                'id': 4,
                'title': 'DevOps Engineer',
                'company': 'HCL Technologies',
                'location': 'Noida, India',
                'type': 'Full-time',
                'experience_level': 'Senior',
                'description': '''
                HCL Technologies has an opening for DevOps Engineer in Noida. Work on cloud infrastructure, CI/CD, and automation for our global clients. Immediate joining preferred.
                
                Responsibilities:
                - Design and maintain CI/CD pipelines
                - Manage cloud infrastructure on AWS
                - Implement monitoring and logging solutions
                - Automate deployment processes
                - Ensure system security and compliance
                
                Requirements:
                - 4+ years of DevOps experience
                - Strong experience with AWS, Docker, Kubernetes
                - Proficiency in scripting languages (Python, Bash)
                - Experience with Jenkins, GitLab CI, or similar
                - Knowledge of infrastructure as code (Terraform)
                - Strong troubleshooting skills
                ''',
                'skills_required': ['aws', 'docker', 'kubernetes', 'python', 'bash', 'jenkins', 'terraform', 'ci/cd'],
                'salary_range': '₹14 LPA - ₹25 LPA',
                'remote_friendly': True,
                'url': 'https://www.hcltech.com/careers'
            },
            {
                'id': 5,
                'title': 'Product Manager',
                'company': 'Zoho',
                'location': 'Chennai, India',
                'type': 'Full-time',
                'experience_level': 'Mid-level',
                'description': '''
                Zoho Corporation is hiring Product Managers in Chennai. Drive product strategy for our SaaS products. Current opening in our product team.
                
                Responsibilities:
                - Define product roadmap and strategy
                - Gather and prioritize product requirements
                - Work with engineering teams on product development
                - Analyze market trends and user feedback
                - Coordinate product launches
                
                Requirements:
                - 3-5 years of product management experience
                - Strong analytical and problem-solving skills
                - Experience with agile development methodologies
                - Excellent communication and leadership skills
                - Technical background preferred
                - MBA or equivalent experience
                ''',
                'skills_required': ['product management', 'agile', 'analytics', 'leadership', 'strategy'],
                'salary_range': '₹15 LPA - ₹28 LPA',
                'remote_friendly': True,
                'url': 'https://www.zoho.com/careers/'
            },
            {
                'id': 6,
                'title': 'UX Designer',
                'company': 'Flipkart',
                'location': 'Bangalore, India',
                'type': 'Full-time',
                'experience_level': 'Mid-level',
                'description': '''
                Flipkart is looking for UX Designers in Bangalore. Create intuitive experiences for millions of Indian users. Current opening in our design team.
                
                Responsibilities:
                - Conduct user research and usability testing
                - Create wireframes, prototypes, and user flows
                - Collaborate with product and engineering teams
                - Design user interfaces for web and mobile
                - Present design concepts to stakeholders
                
                Requirements:
                - 2-4 years of UX design experience
                - Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)
                - Strong portfolio demonstrating UX process
                - Understanding of user-centered design principles
                - Experience with user research methods
                - Strong communication skills
                ''',
                'skills_required': ['ux design', 'figma', 'sketch', 'adobe creative suite', 'user research', 'prototyping'],
                'salary_range': '₹12 LPA - ₹20 LPA',
                'remote_friendly': True,
                'url': 'https://www.flipkartcareers.com/'
            },
            {
                'id': 7,
                'title': 'Software Development Engineer',
                'company': 'Amazon India',
                'location': 'Bangalore, India',
                'type': 'Full-time',
                'experience_level': 'Mid-level',
                'description': '''
                Amazon Development Centre India is hiring SDEs in Bangalore. Work on large-scale systems and customer-facing products. Multiple current openings.
                
                Responsibilities:
                - Design, develop and maintain scalable services
                - Write high-quality code and participate in code reviews
                - Collaborate with product and operations teams
                - Own delivery of features end to end
                
                Requirements:
                - Bachelor's in Computer Science or related field
                - 2+ years of software development experience
                - Proficiency in Java, Python, or C++
                - Strong in data structures and algorithms
                - Experience with distributed systems is a plus
                ''',
                'skills_required': ['java', 'python', 'data structures', 'algorithms', 'aws', 'distributed systems'],
                'salary_range': '₹18 LPA - ₹35 LPA',
                'remote_friendly': False,
                'url': 'https://www.amazon.jobs/'
            },
            {
                'id': 8,
                'title': 'Full Stack Developer',
                'company': 'Tech Mahindra',
                'location': 'Pune, India',
                'type': 'Full-time',
                'experience_level': 'Mid-level',
                'description': '''
                Tech Mahindra has current openings for Full Stack Developers in Pune. Work on digital transformation projects for global clients.
                
                Responsibilities:
                - Develop full stack web applications
                - Work with React, Node.js, and cloud services
                - Integrate APIs and databases
                - Participate in agile ceremonies
                - Ensure code quality and documentation
                
                Requirements:
                - 2-4 years of full stack development experience
                - Proficiency in JavaScript, React, Node.js
                - Experience with SQL/NoSQL databases
                - Knowledge of REST APIs and microservices
                - Good communication skills
                ''',
                'skills_required': ['javascript', 'react', 'node.js', 'sql', 'rest', 'html', 'css'],
                'salary_range': '₹8 LPA - ₹18 LPA',
                'remote_friendly': True,
                'url': 'https://www.techmahindra.com/careers/'
            }
        ]
        
        # Experience level mapping
        self.experience_levels = {
            'entry': ['junior', 'entry', 'entry-level', 'graduate', 'intern'],
            'mid': ['mid', 'mid-level', 'intermediate', 'experienced'],
            'senior': ['senior', 'lead', 'principal', 'staff', 'architect']
        }
        
        # Initialize TF-IDF vectorizer for text similarity
        self.vectorizer = TfidfVectorizer(
            stop_words='english',
            max_features=1000,
            ngram_range=(1, 2)
        )
    
    def find_job_matches(self, parsed_resume: Dict[str, Any], preferences: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Find job matches for a given resume. Uses real jobs from API when configured, else sample jobs."""
        
        if preferences is None:
            preferences = {}
        
        resume_skills = self._extract_resume_skills(parsed_resume)
        resume_experience = self._extract_experience_level(parsed_resume)
        resume_text = self._extract_resume_text(parsed_resume)
        # Only treat as "has experience" when resume actually lists experience entries (not for freshers)
        resume_has_experience = len(parsed_resume.get('experience', [])) > 0
        location = (preferences.get("location") or "India").strip() or "India"
        summary = (parsed_resume.get("summary") or "")[:200]
        
        # Try real jobs from Adzuna API first (no scraping; respects ToS of Naukri/LinkedIn)
        jobs_to_match = []
        try:
            from src.services.real_job_fetcher import fetch_real_jobs_for_resume
            real_jobs = fetch_real_jobs_for_resume(
                resume_skills=resume_skills,
                resume_summary_or_title=summary,
                location=location,
                max_jobs=30,
            )
            if real_jobs:
                jobs_to_match = real_jobs
        except Exception as e:
            print(f"Real job fetch skipped: {e}")
        
        if not jobs_to_match:
            jobs_to_match = self.sample_jobs
        
        matches = []
        for job in jobs_to_match:
            match_score = self._calculate_match_score(
                resume_skills, resume_experience, resume_text, job
            )
            # Only include jobs that match resume's experience level (don't show senior jobs to freshers)
            if match_score['experience_match'] < 50:
                continue
            if self._meets_preferences(job, preferences):
                match_data = {
                    'job': job,
                    'match_score': match_score['overall_score'],
                    'match_details': match_score,
                    'recommendation_reason': self._generate_recommendation_reason(
                        match_score, job, resume_has_experience=resume_has_experience
                    )
                }
                matches.append(match_data)
        
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches
    
    def _extract_resume_skills(self, parsed_resume: Dict[str, Any]) -> List[str]:
        """Extract all skills from parsed resume"""
        skills = []
        
        # Get skills from skills section
        skills_section = parsed_resume.get('skills', {})
        if isinstance(skills_section, dict):
            for category, skill_list in skills_section.items():
                if isinstance(skill_list, list):
                    skills.extend([skill.lower() for skill in skill_list])
        
        # Extract skills from experience descriptions
        experience = parsed_resume.get('experience', [])
        for exp in experience:
            description = exp.get('description', '')
            # Simple skill extraction from text
            skills.extend(self._extract_skills_from_text(description))
        
        return list(set(skills))  # Remove duplicates
    
    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        skills = []
        text_lower = text.lower()
        
        # Common technical skills to look for
        tech_skills = [
            'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node.js',
            'html', 'css', 'sql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure',
            'docker', 'kubernetes', 'git', 'jenkins', 'terraform', 'pandas', 'numpy',
            'tensorflow', 'scikit-learn', 'machine learning', 'data science',
            'agile', 'scrum', 'project management', 'leadership'
        ]
        
        for skill in tech_skills:
            if skill in text_lower:
                skills.append(skill)
        
        return skills
    
    def _extract_experience_level(self, parsed_resume: Dict[str, Any]) -> str:
        """Determine experience level from resume"""
        experience = parsed_resume.get('experience', [])
        
        if not experience:
            return 'entry'
        
        # Simple heuristic based on number of positions and descriptions
        total_positions = len(experience)
        avg_description_length = sum(len(exp.get('description', '')) for exp in experience) / total_positions
        
        if total_positions >= 4 or avg_description_length > 200:
            return 'senior'
        elif total_positions >= 2 or avg_description_length > 100:
            return 'mid'
        else:
            return 'entry'
    
    def _extract_resume_text(self, parsed_resume: Dict[str, Any]) -> str:
        """Extract all text content from resume for similarity matching"""
        text_parts = []
        
        # Add summary
        if parsed_resume.get('summary'):
            text_parts.append(parsed_resume['summary'])
        
        # Add experience descriptions
        for exp in parsed_resume.get('experience', []):
            if exp.get('description'):
                text_parts.append(exp['description'])
        
        # Add skills
        skills_section = parsed_resume.get('skills', {})
        if isinstance(skills_section, dict):
            for skill_list in skills_section.values():
                if isinstance(skill_list, list):
                    text_parts.extend(skill_list)
        
        return ' '.join(text_parts)
    
    def _calculate_match_score(self, resume_skills: List[str], resume_experience: str, 
                             resume_text: str, job: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive match score between resume and job"""
        
        # Skills match score (40% weight)
        skills_score = self._calculate_skills_match(resume_skills, job['skills_required'])
        
        # Experience level match (20% weight)
        experience_score = self._calculate_experience_match(resume_experience, job['experience_level'])
        
        # Text similarity score (30% weight)
        text_score = self._calculate_text_similarity(resume_text, job['description'])
        
        # Industry/role relevance (10% weight)
        relevance_score = self._calculate_relevance_score(resume_skills, resume_text, job)
        
        # Calculate weighted overall score
        overall_score = (
            skills_score * 0.4 +
            experience_score * 0.2 +
            text_score * 0.3 +
            relevance_score * 0.1
        )
        
        return {
            'overall_score': round(overall_score, 1),
            'skills_match': round(skills_score, 1),
            'experience_match': round(experience_score, 1),
            'text_similarity': round(text_score, 1),
            'relevance_score': round(relevance_score, 1),
            'matched_skills': self._get_matched_skills(resume_skills, job['skills_required']),
            'missing_skills': self._get_missing_skills(resume_skills, job['skills_required'])
        }
    
    def _calculate_skills_match(self, resume_skills: List[str], required_skills: List[str]) -> float:
        """Calculate skills match percentage"""
        if not required_skills:
            return 100.0
        
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matched_skills = set(resume_skills_lower) & set(required_skills_lower)
        match_percentage = (len(matched_skills) / len(required_skills_lower)) * 100
        
        return min(match_percentage, 100.0)
    
    def _calculate_experience_match(self, resume_experience: str, job_experience: str) -> float:
        """Calculate experience level match"""
        job_exp_lower = job_experience.lower()
        
        # Map job experience to our categories
        job_level = 'mid'  # default
        for level, keywords in self.experience_levels.items():
            if any(keyword in job_exp_lower for keyword in keywords):
                job_level = level
                break
        
        # Score based on match
        if resume_experience == job_level:
            return 100.0
        elif (resume_experience == 'senior' and job_level == 'mid') or \
             (resume_experience == 'mid' and job_level == 'entry'):
            return 80.0  # Overqualified but acceptable
        elif (resume_experience == 'mid' and job_level == 'senior') or \
             (resume_experience == 'entry' and job_level == 'mid'):
            return 60.0  # Underqualified but possible
        else:
            return 40.0  # Significant mismatch
    
    def _calculate_text_similarity(self, resume_text: str, job_description: str) -> float:
        """Calculate text similarity using TF-IDF and cosine similarity"""
        try:
            # Combine texts for vectorization
            texts = [resume_text, job_description]
            
            # Fit and transform texts
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return similarity * 100
        except Exception:
            # Fallback to simple word overlap (e.g. empty text or TF-IDF failure)
            resume_words = set(resume_text.lower().split())
            job_words = set(job_description.lower().split())
            
            if not job_words:
                return 0.0
            
            overlap = len(resume_words & job_words)
            return (overlap / len(job_words)) * 100
    
    def _calculate_relevance_score(self, resume_skills: List[str], resume_text: str, job: Dict[str, Any]) -> float:
        """Calculate overall relevance score"""
        score = 50.0  # Base score
        
        # Boost score for relevant keywords in job title
        job_title_lower = job['title'].lower()
        resume_text_lower = resume_text.lower()
        
        title_keywords = job_title_lower.split()
        for keyword in title_keywords:
            if len(keyword) > 3 and keyword in resume_text_lower:
                score += 10
        
        # Boost for company type relevance
        if 'tech' in job['company'].lower() and any(skill in resume_skills for skill in ['python', 'javascript', 'java']):
            score += 15
        
        return min(score, 100.0)
    
    def _get_matched_skills(self, resume_skills: List[str], required_skills: List[str]) -> List[str]:
        """Get list of matched skills"""
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        required_skills_lower = [skill.lower() for skill in required_skills]
        
        matched = []
        for req_skill in required_skills:
            if req_skill.lower() in resume_skills_lower:
                matched.append(req_skill)
        
        return matched
    
    def _get_missing_skills(self, resume_skills: List[str], required_skills: List[str]) -> List[str]:
        """Get list of missing skills"""
        resume_skills_lower = [skill.lower() for skill in resume_skills]
        
        missing = []
        for req_skill in required_skills:
            if req_skill.lower() not in resume_skills_lower:
                missing.append(req_skill)
        
        return missing
    
    def _meets_preferences(self, job: Dict[str, Any], preferences: Dict[str, Any]) -> bool:
        """Check if job meets user preferences.
        
        Also applies a global filter to hide very low-salary roles
        (anything with a detected minimum salary < 10 LPA).
        """
        # Global salary floor: hide jobs with salary clearly below 10 LPA
        salary_text = (job.get('salary_range') or '').strip()
        if salary_text:
            # Pattern for sample jobs like "₹5 LPA - ₹12 LPA"
            lpa_match = re.search(r'₹\s*([\d.]+)\s*LPA', salary_text, re.IGNORECASE)
            if lpa_match:
                try:
                    min_lpa = float(lpa_match.group(1))
                    if min_lpa < 10:
                        return False
                except ValueError:
                    pass
            else:
                # Pattern for numeric annual salaries like "₹500000 - ₹900000 per year"
                rupee_match = re.search(r'₹\s*([\d,]+)', salary_text)
                if rupee_match:
                    try:
                        min_rupees = int(rupee_match.group(1).replace(',', ''))
                        approx_lpa = min_rupees / 100000.0
                        if approx_lpa < 10:
                            return False
                    except ValueError:
                        pass

        if not preferences:
            return True
        
        # Check location preference
        if 'location' in preferences and preferences['location']:
            if preferences['location'].lower() not in job['location'].lower():
                return False
        
        # Check remote work preference
        if preferences.get('remote_only', False) and not job.get('remote_friendly', False):
            return False
        
        # Check experience level preference
        if 'experience_level' in preferences and preferences['experience_level']:
            if preferences['experience_level'].lower() not in job['experience_level'].lower():
                return False
        
        # Check salary range (if provided explicitly by the user)
        if 'min_salary' in preferences and preferences['min_salary']:
            salary_numbers = re.findall(r'\$(\d+,?\d+)', salary_text)
            if salary_numbers:
                min_salary = int(salary_numbers[0].replace(',', ''))
                if min_salary < preferences['min_salary']:
                    return False
        
        return True
    
    def _generate_recommendation_reason(
        self, match_score: Dict[str, Any], job: Dict[str, Any], resume_has_experience: bool = True
    ) -> str:
        """Generate explanation for why this job is recommended."""
        reasons = []
        
        if match_score['skills_match'] >= 80:
            reasons.append(f"Strong skills match ({match_score['skills_match']}%)")
        elif match_score['skills_match'] >= 60:
            reasons.append(f"Good skills alignment ({match_score['skills_match']}%)")
        
        if match_score['text_similarity'] >= 70:
            reasons.append("High content similarity with your background")
        
        if match_score['matched_skills']:
            top_skills = match_score['matched_skills'][:3]
            reasons.append(f"Matches your skills in {', '.join(top_skills)}")
        
        if job.get('remote_friendly'):
            reasons.append("Offers remote work flexibility")
        
        if not reasons:
            reasons.append("Potential growth opportunity in your field")
        
        return "; ".join(reasons)
    
    def get_job_recommendations_summary(self, matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary of job recommendations"""
        if not matches:
            return {
                'total_matches': 0,
                'avg_match_score': 0,
                'top_skills_in_demand': [],
                'recommended_improvements': []
            }
        
        total_matches = len(matches)
        avg_score = sum(match['match_score'] for match in matches) / total_matches
        
        # Analyze skills in demand
        all_required_skills = []
        all_missing_skills = []
        
        for match in matches:
            job_skills = match['job']['skills_required']
            missing_skills = match['match_details']['missing_skills']
            
            all_required_skills.extend(job_skills)
            all_missing_skills.extend(missing_skills)
        
        # Count frequency of skills
        skill_demand = Counter(all_required_skills)
        missing_skill_count = Counter(all_missing_skills)
        
        top_skills = [skill for skill, count in skill_demand.most_common(5)]
        top_missing = [skill for skill, count in missing_skill_count.most_common(3)]
        
        recommendations = []
        if top_missing:
            recommendations.append(f"Consider learning {', '.join(top_missing)} to improve job match scores")
        
        if avg_score < 70:
            recommendations.append("Focus on highlighting relevant experience and skills in your resume")
        
        return {
            'total_matches': total_matches,
            'avg_match_score': round(avg_score, 1),
            'top_skills_in_demand': top_skills,
            'most_missing_skills': top_missing,
            'recommended_improvements': recommendations
        }

