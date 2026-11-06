import re
import json
from typing import Dict, List, Any, Tuple
from collections import Counter
import math

class ATSScorer:
    def __init__(self):
        # ATS-friendly formatting rules
        self.format_rules = {
            'standard_sections': ['experience', 'education', 'skills', 'summary'],
            'avoid_elements': ['tables', 'images', 'graphics', 'text_boxes'],
            'preferred_fonts': ['arial', 'calibri', 'times', 'helvetica'],
            'max_columns': 2,
            'bullet_points': ['•', '-', '*']
        }
        
        # Common industry keywords by category
        self.industry_keywords = {
            'technology': {
                'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'swift'],
                'web_development': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django'],
                'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle'],
                'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
                'data_science': ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'tableau'],
                'tools': ['git', 'jenkins', 'jira', 'agile', 'scrum']
            },
            'business': {
                'management': ['leadership', 'team management', 'project management', 'strategic planning'],
                'analysis': ['data analysis', 'business analysis', 'market research', 'financial analysis'],
                'communication': ['presentation', 'negotiation', 'client relations', 'stakeholder management'],
                'tools': ['excel', 'powerpoint', 'salesforce', 'crm', 'erp']
            },
            'marketing': {
                'digital': ['seo', 'sem', 'social media', 'content marketing', 'email marketing'],
                'analytics': ['google analytics', 'facebook ads', 'conversion optimization', 'a/b testing'],
                'creative': ['copywriting', 'brand management', 'campaign development', 'creative strategy'],
                'tools': ['hubspot', 'mailchimp', 'hootsuite', 'canva', 'photoshop']
            }
        }
        
        # Action verbs that ATS systems favor
        self.action_verbs = [
            'achieved', 'administered', 'analyzed', 'built', 'collaborated', 'created',
            'delivered', 'developed', 'directed', 'established', 'executed', 'generated',
            'implemented', 'improved', 'increased', 'led', 'managed', 'optimized',
            'organized', 'planned', 'produced', 'reduced', 'resolved', 'streamlined'
        ]
        
        # Quantifiable metrics patterns
        self.metrics_patterns = [
            r'\d+%',  # percentages
            r'\$\d+',  # dollar amounts
            r'\d+\s*(million|thousand|k|m)',  # large numbers
            r'\d+\s*(years?|months?|weeks?)',  # time periods
            r'\d+\s*(people|team|members|employees)',  # team sizes
            r'\d+\s*(projects?|clients?|customers?)'  # quantities
        ]
    
    def _has_required_resume_sections(self, parsed_resume: Dict[str, Any]) -> bool:
        """True only if document has resume sections: education, skills, projects, experience, certifications, awards, internships, and contact (email/phone/address)."""
        raw_text = (parsed_resume.get('raw_text') or '').lower()
        personal = parsed_resume.get('personal_info') or {}

        # Contact info: email, phone, or address
        has_email = bool(personal.get('email'))
        has_phone = bool(personal.get('phone'))
        has_address = bool(personal.get('address')) or 'address' in raw_text[:500]  # address often near top
        has_contact = has_email or has_phone or has_address

        # Count resume sections with real content
        education = parsed_resume.get('education') or []
        education_ok = len(education) > 0 and any(len(str(e.get('degree', '') or '').strip()) > 2 for e in education if isinstance(e, dict))

        skills = parsed_resume.get('skills') or {}
        skill_count = sum(len(v) for v in (skills.values() if isinstance(skills, dict) else []))
        skills_ok = skill_count >= 2

        projects = parsed_resume.get('projects') or []
        projects_ok = len(projects) > 0

        experience = parsed_resume.get('experience') or []
        exp_content = ' '.join(str(e.get('description', '') or '') for e in experience if isinstance(e, dict))
        experience_ok = len(experience) > 0 and len(exp_content.strip()) > 15

        certifications = parsed_resume.get('certifications') or []
        certifications_ok = len(certifications) > 0

        achievements = parsed_resume.get('achievements') or []
        achievements_ok = len(achievements) > 0

        # Internships: in experience or as section in raw text
        has_internship_section = 'internship' in raw_text
        internships_ok = has_internship_section or experience_ok  # experience can include internships

        resume_sections = [education_ok, skills_ok, projects_ok, experience_ok, certifications_ok, achievements_ok]
        section_count = sum(1 for x in resume_sections if x)

        # Require: at least 3 resume sections (of education, skills, projects, experience, certifications, awards) AND contact info
        return section_count >= 3 and has_contact

    def _is_research_paper(self, parsed_resume: Dict[str, Any]) -> bool:
        """True if document looks like a research paper (abstract, methodology, references, etc.)."""
        raw_text = (parsed_resume.get('raw_text') or '').lower()
        lines = [line.strip().lower() for line in raw_text.split('\n') if line.strip()]
        research_phrases = ['abstract', 'introduction', 'methodology', 'references', 'literature review', 'citation', 'research paper', 'journal', 'conference paper', 'keywords:', 'index terms']
        hits = sum(1 for p in research_phrases if p in raw_text)
        # Section-like: phrase at start of line (common in papers)
        section_hits = sum(1 for line in lines[:50] for p in ['abstract', 'introduction', 'methodology', 'references', 'literature review'] if line.startswith(p) or line == p)
        return hits >= 2 or section_hits >= 2

    def _is_likely_certificate_or_not_resume(self, parsed_resume: Dict[str, Any]) -> bool:
        """True if document looks like a certificate / not a resume (format and completeness should be low)."""
        raw_text = (parsed_resume.get('raw_text') or '').lower()
        word_count = len(raw_text.split()) if raw_text else 0
        cert_phrases = [
            'certificate', 'certification', 'certified', 'certifies that',
            'awarded to', 'this is to certify', 'successfully completed', 'has completed',
            'course completion', 'credential', 'license', 'licensure',
            'in recognition of', 'is hereby awarded', 'certificate of completion',
            'certificate of achievement', 'professional certificate',
            'completion', 'issued to', 'valid from', 'completed the course', 'completed the training',
            'skill badge', 'digital credential', 'has earned', 'badge', 'earned this',
            'completed on', 'completion date', 'date of completion'
        ]
        cert_hits = sum(1 for p in cert_phrases if p in raw_text)
        has_cert_language_strong = cert_hits >= 2
        has_any_cert_language = cert_hits >= 1
        experience = parsed_resume.get('experience') or []
        experience_content = ' '.join(
            str(e.get('description', '')) for e in experience if isinstance(e, dict)
        ) if isinstance(experience, list) else ''
        skills = parsed_resume.get('skills') or {}
        skill_count = sum(len(v) for v in (skills.values() if isinstance(skills, dict) else []))
        has_resume_structure = (
            (len(experience) >= 1 and len(experience_content.strip()) > 80) or
            skill_count >= 5
        )
        # Two+ cert phrases and no resume structure → certificate
        if has_cert_language_strong and not has_resume_structure:
            return True
        # Short document (e.g. single-page cert) with any cert phrase → treat as certificate
        if has_any_cert_language and word_count < 350 and not has_resume_structure:
            return True
        # Very short with one cert phrase (e.g. IBM Cloud badge PDF)
        if has_any_cert_language and word_count < 200:
            return True
        return False
    
    def is_not_resume(self, parsed_resume: Dict[str, Any], filename: str = '') -> bool:
        """True if document is not a resume. ATS score only for docs with resume sections: education, skills, projects, experience, certifications, awards, internships, and contact."""
        raw_text = (parsed_resume.get('raw_text') or '').lower()
        filename_lower = (filename or '').lower()

        # Research paper (abstract, methodology, references, etc.) — check first
        if self._is_research_paper(parsed_resume):
            return True

        # PRIMARY: Only give ATS when document has required resume sections
        if not self._has_required_resume_sections(parsed_resume):
            return True

        # Filename suggests application form
        if 'application' in filename_lower and 'form' in filename_lower:
            return True
        if 'application_form' in filename_lower or 'applicationform' in filename_lower:
            return True
        if filename_lower.endswith('application form.pdf') or ' job application' in filename_lower:
            return True

        # Filename suggests certificate
        if 'cert' in filename_lower or 'certificate' in filename_lower or 'certification' in filename_lower or 'badge' in filename_lower:
            return True

        # Certificate / application form (content)
        if self._is_likely_certificate_or_not_resume(parsed_resume):
            return True
        app_form_phrases = [
            'application form', 'job application', 'application for the post', 'application for the position',
            'position applied', 'date of application', 'place :', 'place:', 'signature', 'declaration',
            'i hereby declare', 'applied for', 'reference no', 'post applied', 'registration no',
            'application number', 'candidate name', 'father\'s name', 'mother\'s name',
            'personal details', 'educational qualification', 'expected salary', 'experience in years',
            'current salary', 'notice period', 'reference', 'declaration', 'i hereby'
        ]
        app_form_hits = sum(1 for p in app_form_phrases if p in raw_text)
        experience = parsed_resume.get('experience') or []
        experience_content = ' '.join(str(e.get('description', '')) for e in experience if isinstance(e, dict))
        skills = parsed_resume.get('skills') or {}
        skill_count = sum(len(v) for v in (skills.values() if isinstance(skills, dict) else []))
        has_resume_structure = (len(experience) >= 1 and len(experience_content.strip()) > 100) or skill_count >= 6
        if app_form_hits >= 1 and not has_resume_structure:
            return True
        if app_form_hits >= 2:
            return True
        return False
    
    def calculate_ats_score(self, parsed_resume: Dict[str, Any], job_description: str = None) -> Dict[str, Any]:
        """Calculate comprehensive ATS score for a resume. Certificates get low format/completeness."""
        
        # Individual component scores
        keyword_score = self._calculate_keyword_score(parsed_resume, job_description)
        format_score = self._calculate_format_score(parsed_resume)
        content_score = self._calculate_content_score(parsed_resume)
        completeness_score = self._calculate_completeness_score(parsed_resume)
        
        is_certificate = self._is_likely_certificate_or_not_resume(parsed_resume)
        if is_certificate:
            format_score = {
                'score': 20.0,
                'details': {
                    'issues': ['This appears to be a certificate or non-resume document. Upload a resume for format scoring.'],
                    'good_practices': [],
                    'present_sections': []
                },
                'weight': 30
            }
            completeness_score = {
                'score': 25.0,
                'details': {
                    'present_sections': [],
                    'missing_sections': ['experience', 'skills', 'summary', 'education', 'personal_info'],
                    'completeness_percentage': 25.0
                },
                'weight': 10
            }
        
        # Weighted final score
        weights = {
            'keywords': 0.4,
            'format': 0.3,
            'content': 0.2,
            'completeness': 0.1
        }
        
        final_score = (
            keyword_score['score'] * weights['keywords'] +
            format_score['score'] * weights['format'] +
            content_score['score'] * weights['content'] +
            completeness_score['score'] * weights['completeness']
        )
        
        # Detailed analysis
        recommendations = self._generate_recommendations(
            keyword_score, format_score, content_score, completeness_score
        )
        if is_certificate:
            recommendations.insert(0, 'This looks like a certificate, not a resume. Upload a proper resume (experience, skills, education) for ATS analysis and job matches.')
        
        analysis = {
            'overall_score': round(final_score, 1),
            'component_scores': {
                'keywords': keyword_score,
                'format': format_score,
                'content': content_score,
                'completeness': completeness_score
            },
            'recommendations': recommendations,
            'strengths': self._identify_strengths(
                keyword_score, format_score, content_score, completeness_score
            ),
            'improvement_areas': self._identify_improvement_areas(
                keyword_score, format_score, content_score, completeness_score
            )
        }
        
        return analysis
    
    def _calculate_keyword_score(self, parsed_resume: Dict[str, Any], job_description: str = None) -> Dict[str, Any]:
        """Calculate keyword relevance score"""
        
        # Extract all text from resume
        resume_text = self._extract_all_text(parsed_resume).lower()
        
        if job_description:
            # Score based on job description keywords
            job_keywords = self._extract_job_keywords(job_description.lower())
            matched_keywords = []
            total_keywords = len(job_keywords)
            
            for keyword in job_keywords:
                if keyword in resume_text:
                    matched_keywords.append(keyword)
            
            match_percentage = (len(matched_keywords) / total_keywords * 100) if total_keywords > 0 else 0
            score = min(match_percentage, 100)
            
            details = {
                'matched_keywords': matched_keywords,
                'missing_keywords': [kw for kw in job_keywords if kw not in matched_keywords],
                'match_percentage': round(match_percentage, 1)
            }
        else:
            # Score based on general industry keywords
            industry_score = self._calculate_industry_keyword_score(resume_text)
            score = industry_score['score']
            details = industry_score['details']
        
        return {
            'score': round(score, 1),
            'details': details,
            'weight': 40
        }
    
    def _calculate_format_score(self, parsed_resume: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate format compatibility score"""
        
        raw_text = parsed_resume.get('raw_text', '')
        score = 100  # Start with perfect score and deduct points
        issues = []
        good_practices = []
        
        # Check for standard sections
        required_sections = ['experience', 'education', 'skills']
        present_sections = []
        
        for section in required_sections:
            if section in parsed_resume and parsed_resume[section]:
                present_sections.append(section)
            else:
                score -= 15
                issues.append(f"Missing {section} section")
        
        if len(present_sections) >= 3:
            good_practices.append("Contains all standard resume sections")
        
        # Check for bullet points usage
        bullet_count = sum(raw_text.count(bullet) for bullet in self.format_rules['bullet_points'])
        if bullet_count > 5:
            good_practices.append("Good use of bullet points for readability")
        else:
            score -= 10
            issues.append("Limited use of bullet points")
        
        # Check for consistent formatting (simple heuristic)
        lines = raw_text.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        
        if len(non_empty_lines) > 20:  # Reasonable length
            good_practices.append("Appropriate resume length")
        else:
            score -= 5
            issues.append("Resume may be too short")
        
        # Check for special characters that might cause parsing issues
        problematic_chars = ['©', '®', '™', '§', '¶']
        if any(char in raw_text for char in problematic_chars):
            score -= 5
            issues.append("Contains special characters that may cause parsing issues")
        
        # Check for excessive formatting
        if raw_text.count('\t') > 10:  # Too many tabs
            score -= 5
            issues.append("Excessive use of tabs may cause formatting issues")
        
        score = max(score, 0)  # Ensure score doesn't go below 0
        
        return {
            'score': round(score, 1),
            'details': {
                'issues': issues,
                'good_practices': good_practices,
                'present_sections': present_sections
            },
            'weight': 30
        }
    
    def _calculate_content_score(self, parsed_resume: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate content quality score"""
        
        score = 0
        max_score = 100
        details = {
            'action_verbs_count': 0,
            'quantified_achievements': 0,
            'content_strengths': [],
            'content_weaknesses': []
        }
        
        # Extract all text for analysis
        all_text = self._extract_all_text(parsed_resume).lower()
        
        # Check for action verbs
        action_verb_count = sum(1 for verb in self.action_verbs if verb in all_text)
        details['action_verbs_count'] = action_verb_count
        
        if action_verb_count >= 10:
            score += 25
            details['content_strengths'].append("Strong use of action verbs")
        elif action_verb_count >= 5:
            score += 15
            details['content_strengths'].append("Good use of action verbs")
        else:
            details['content_weaknesses'].append("Limited use of action verbs")
        
        # Check for quantified achievements
        quantified_count = 0
        for pattern in self.metrics_patterns:
            quantified_count += len(re.findall(pattern, all_text, re.IGNORECASE))
        
        details['quantified_achievements'] = quantified_count
        
        if quantified_count >= 5:
            score += 25
            details['content_strengths'].append("Good use of quantified achievements")
        elif quantified_count >= 2:
            score += 15
            details['content_strengths'].append("Some quantified achievements present")
        else:
            details['content_weaknesses'].append("Lacks quantified achievements")
        
        # Check experience descriptions quality
        experience = parsed_resume.get('experience', [])
        if experience:
            avg_description_length = sum(len(exp.get('description', '')) for exp in experience) / len(experience)
            if avg_description_length > 100:
                score += 20
                details['content_strengths'].append("Detailed experience descriptions")
            elif avg_description_length > 50:
                score += 10
            else:
                details['content_weaknesses'].append("Experience descriptions too brief")
        
        # Check for professional summary
        summary = parsed_resume.get('summary', '')
        if summary and len(summary) > 50:
            score += 15
            details['content_strengths'].append("Includes professional summary")
        else:
            details['content_weaknesses'].append("Missing or weak professional summary")
        
        # Check skills diversity
        skills = parsed_resume.get('skills', {})
        skill_categories = len(skills.keys()) if skills else 0
        total_skills = sum(len(skill_list) for skill_list in skills.values()) if skills else 0
        
        if total_skills >= 10 and skill_categories >= 3:
            score += 15
            details['content_strengths'].append("Diverse skill set")
        elif total_skills >= 5:
            score += 10
        else:
            details['content_weaknesses'].append("Limited skills listed")
        
        return {
            'score': round(score, 1),
            'details': details,
            'weight': 20
        }
    
    def _calculate_completeness_score(self, parsed_resume: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate resume completeness score"""
        
        score = 0
        max_score = 100
        details = {
            'present_sections': [],
            'missing_sections': [],
            'completeness_percentage': 0
        }
        
        # Essential sections
        essential_sections = {
            'personal_info': 20,
            'experience': 30,
            'education': 20,
            'skills': 20,
            'summary': 10
        }
        
        for section, weight in essential_sections.items():
            if section in parsed_resume and parsed_resume[section]:
                # Check if section has meaningful content
                if section == 'personal_info':
                    info = parsed_resume[section]
                    if info.get('email') or info.get('phone') or info.get('name'):
                        score += weight
                        details['present_sections'].append(section)
                    else:
                        details['missing_sections'].append(section)
                elif section == 'skills':
                    skills = parsed_resume[section]
                    if isinstance(skills, dict) and any(skills.values()):
                        score += weight
                        details['present_sections'].append(section)
                    else:
                        details['missing_sections'].append(section)
                elif isinstance(parsed_resume[section], list) and parsed_resume[section]:
                    score += weight
                    details['present_sections'].append(section)
                elif isinstance(parsed_resume[section], str) and parsed_resume[section].strip():
                    score += weight
                    details['present_sections'].append(section)
                else:
                    details['missing_sections'].append(section)
            else:
                details['missing_sections'].append(section)
        
        details['completeness_percentage'] = round(score, 1)
        
        return {
            'score': round(score, 1),
            'details': details,
            'weight': 10
        }
    
    def _extract_all_text(self, parsed_resume: Dict[str, Any]) -> str:
        """Extract all text content from parsed resume"""
        text_parts = []
        
        # Add raw text if available
        if 'raw_text' in parsed_resume:
            text_parts.append(parsed_resume['raw_text'])
        
        # Add structured content
        for section, content in parsed_resume.items():
            if section == 'raw_text':
                continue
            
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, list):
                for item in content:
                    if isinstance(item, dict):
                        text_parts.extend(item.values())
                    else:
                        text_parts.append(str(item))
            elif isinstance(content, dict):
                text_parts.extend(str(v) for v in content.values())
        
        return ' '.join(text_parts)
    
    def _extract_job_keywords(self, job_description: str) -> List[str]:
        """Extract important keywords from job description"""
        # Simple keyword extraction - in a real implementation, 
        # this would use more sophisticated NLP
        
        # Remove common stop words
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'}
        
        # Extract words that appear multiple times or are in caps
        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#.]*\b', job_description)
        word_counts = Counter(word.lower() for word in words if word.lower() not in stop_words)
        
        # Get words that appear more than once or are technical terms
        keywords = []
        for word, count in word_counts.items():
            if count > 1 or any(char.isupper() for char in word) or len(word) > 6:
                keywords.append(word)
        
        return keywords[:20]  # Return top 20 keywords
    
    def _calculate_industry_keyword_score(self, resume_text: str) -> Dict[str, Any]:
        """Calculate score based on industry keywords"""
        
        total_score = 0
        category_scores = {}
        matched_keywords = []
        
        for industry, categories in self.industry_keywords.items():
            industry_score = 0
            industry_matches = []
            
            for category, keywords in categories.items():
                category_matches = [kw for kw in keywords if kw in resume_text]
                industry_matches.extend(category_matches)
                
                # Score based on keyword density
                if category_matches:
                    category_score = min(len(category_matches) * 10, 50)  # Max 50 per category
                    industry_score += category_score
            
            category_scores[industry] = {
                'score': min(industry_score, 100),
                'matched_keywords': industry_matches
            }
            matched_keywords.extend(industry_matches)
        
        # Calculate overall score (average of industry scores)
        if category_scores:
            total_score = sum(scores['score'] for scores in category_scores.values()) / len(category_scores)
        
        return {
            'score': min(total_score, 100),
            'details': {
                'category_scores': category_scores,
                'total_matched_keywords': len(set(matched_keywords)),
                'matched_keywords': list(set(matched_keywords))
            }
        }
    
    def _generate_recommendations(self, keyword_score, format_score, content_score, completeness_score) -> List[str]:
        """Generate specific recommendations based on scores"""
        recommendations = []
        
        if keyword_score['score'] < 70:
            recommendations.append("Include more relevant industry keywords and technical skills")
        
        if format_score['score'] < 80:
            recommendations.append("Improve resume formatting for better ATS compatibility")
            if format_score['details']['issues']:
                recommendations.extend(format_score['details']['issues'])
        
        if content_score['score'] < 70:
            recommendations.append("Enhance content quality with more action verbs and quantified achievements")
            if content_score['details']['content_weaknesses']:
                recommendations.extend(content_score['details']['content_weaknesses'])
        
        if completeness_score['score'] < 80:
            recommendations.append("Add missing resume sections for completeness")
            if completeness_score['details']['missing_sections']:
                missing = completeness_score['details']['missing_sections']
                recommendations.append(f"Add missing sections: {', '.join(missing)}")
        
        return recommendations
    
    def _identify_strengths(self, keyword_score, format_score, content_score, completeness_score) -> List[str]:
        """Identify resume strengths"""
        strengths = []
        
        if keyword_score['score'] >= 80:
            strengths.append("Strong keyword optimization")
        
        if format_score['score'] >= 85:
            strengths.append("Excellent ATS-friendly formatting")
        
        if content_score['score'] >= 80:
            strengths.append("High-quality content with strong achievements")
        
        if completeness_score['score'] >= 90:
            strengths.append("Complete and comprehensive resume")
        
        # Add specific strengths from component details
        if format_score['details']['good_practices']:
            strengths.extend(format_score['details']['good_practices'])
        
        if content_score['details']['content_strengths']:
            strengths.extend(content_score['details']['content_strengths'])
        
        return strengths
    
    def _identify_improvement_areas(self, keyword_score, format_score, content_score, completeness_score) -> List[str]:
        """Identify areas for improvement"""
        improvements = []
        
        if keyword_score['score'] < 60:
            improvements.append("Keyword optimization needs significant improvement")
        
        if format_score['score'] < 70:
            improvements.append("Format compatibility requires attention")
        
        if content_score['score'] < 60:
            improvements.append("Content quality needs enhancement")
        
        if completeness_score['score'] < 70:
            improvements.append("Resume completeness needs improvement")
        
        return improvements

