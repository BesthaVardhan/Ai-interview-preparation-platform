import re
import json
from typing import Dict, List, Any, Tuple
from collections import Counter
import openai
import os

class ImprovementEngine:
    def __init__(self):
        # Initialize OpenAI client if API key is available
        self.openai_client = None
        if os.getenv('OPENAI_API_KEY'):
            self.openai_client = openai.OpenAI()
        
        # Improvement categories and their weights
        self.categories = {
            'content': {
                'weight': 0.4,
                'description': 'Content quality and effectiveness'
            },
            'format': {
                'weight': 0.3,
                'description': 'ATS-friendly formatting and structure'
            },
            'keywords': {
                'weight': 0.2,
                'description': 'Industry-relevant keywords and skills'
            },
            'completeness': {
                'weight': 0.1,
                'description': 'Resume completeness and sections'
            }
        }
        
        # Action verbs for different industries
        self.action_verbs = {
            'technology': [
                'developed', 'engineered', 'architected', 'implemented', 'optimized',
                'automated', 'deployed', 'integrated', 'debugged', 'refactored'
            ],
            'business': [
                'managed', 'led', 'directed', 'coordinated', 'executed',
                'strategized', 'negotiated', 'facilitated', 'streamlined', 'delivered'
            ],
            'marketing': [
                'launched', 'promoted', 'branded', 'campaigned', 'analyzed',
                'targeted', 'converted', 'engaged', 'influenced', 'measured'
            ],
            'sales': [
                'sold', 'closed', 'prospected', 'negotiated', 'exceeded',
                'achieved', 'generated', 'cultivated', 'converted', 'retained'
            ]
        }
        
        # Common resume mistakes and fixes
        self.common_mistakes = {
            'weak_verbs': {
                'pattern': r'\b(responsible for|duties included|worked on|helped with)\b',
                'suggestion': 'Replace weak phrases with strong action verbs',
                'priority': 'high'
            },
            'passive_voice': {
                'pattern': r'\b(was|were|been)\s+\w+ed\b',
                'suggestion': 'Use active voice instead of passive voice',
                'priority': 'medium'
            },
            'vague_descriptions': {
                'pattern': r'\b(various|several|many|some|multiple)\b',
                'suggestion': 'Be specific with numbers and details',
                'priority': 'high'
            },
            'personal_pronouns': {
                'pattern': r'\b(I|me|my|we|us|our)\b',
                'suggestion': 'Remove personal pronouns from resume content',
                'priority': 'medium'
            }
        }
        
        # Industry-specific keywords
        self.industry_keywords = {
            'software_engineering': [
                'agile', 'scrum', 'ci/cd', 'microservices', 'api', 'database',
                'cloud', 'devops', 'testing', 'debugging', 'optimization'
            ],
            'data_science': [
                'machine learning', 'statistical analysis', 'data visualization',
                'predictive modeling', 'big data', 'analytics', 'algorithms'
            ],
            'product_management': [
                'roadmap', 'stakeholder management', 'user experience', 'metrics',
                'a/b testing', 'market research', 'competitive analysis'
            ],
            'marketing': [
                'brand management', 'digital marketing', 'content strategy',
                'lead generation', 'conversion optimization', 'roi', 'analytics'
            ]
        }
    
    def generate_comprehensive_suggestions(self, parsed_resume: Dict[str, Any], 
                                         ats_analysis: Dict[str, Any],
                                         target_role: str = None) -> List[Dict[str, Any]]:
        """Generate improvement suggestions driven by this resume's ATS analysis and content."""
        
        suggestions = []
        component_scores = ats_analysis.get('component_scores', {})
        
        # 1. ATS-driven suggestions first (resume-specific: use actual scores and details)
        ats_suggestions = self._analyze_ats_issues(parsed_resume, ats_analysis)
        suggestions.extend(ats_suggestions)
        
        # 2. Content: only add if content score is low and we have specific weaknesses from ATS
        content_data = component_scores.get('content', {})
        if content_data.get('score', 100) < 75:
            content_suggestions = self._analyze_content_quality(parsed_resume, content_data)
            suggestions.extend(self._avoid_duplicates(suggestions, content_suggestions))
        
        # 3. Format: only add if not already covered by ATS format issues
        format_data = component_scores.get('format', {})
        if format_data.get('score', 100) < 80:
            format_suggestions = self._analyze_format_issues(parsed_resume, format_data)
            suggestions.extend(self._avoid_duplicates(suggestions, format_suggestions))
        
        # 4. Keywords: only if keyword score is low; ATS already may have added missing_keywords
        keyword_data = component_scores.get('keywords', {})
        if keyword_data.get('score', 100) < 75:
            keyword_suggestions = self._analyze_keyword_optimization(parsed_resume, keyword_data, target_role)
            suggestions.extend(self._avoid_duplicates(suggestions, keyword_suggestions))
        
        # 5. Completeness: only if completeness score is low
        completeness_data = component_scores.get('completeness', {})
        if completeness_data.get('score', 100) < 80:
            completeness_suggestions = self._analyze_completeness(parsed_resume, completeness_data)
            suggestions.extend(self._avoid_duplicates(suggestions, completeness_suggestions))
        
        # 6. At most one industry suggestion when target role given
        if target_role:
            industry_suggestions = self._generate_industry_suggestions(parsed_resume, target_role)
            suggestions.extend(self._avoid_duplicates(suggestions, industry_suggestions[:1]))
        
        # 7. AI suggestions only if we have few suggestions (to add tailored advice)
        if self.openai_client and len(suggestions) < 8:
            ai_suggestions = self._generate_ai_suggestions(parsed_resume, target_role)
            suggestions.extend(self._avoid_duplicates(suggestions, ai_suggestions))
        
        return self._prioritize_suggestions(suggestions)
    
    def _avoid_duplicates(self, existing: List[Dict], new_list: List[Dict]) -> List[Dict]:
        """Return only new suggestions that don't duplicate existing by type or key message."""
        existing_keys = {(s.get('type'), s.get('suggestion', '')[:50]) for s in existing}
        out = []
        for s in new_list:
            key = (s.get('type'), (s.get('suggestion') or '')[:50])
            if key not in existing_keys:
                existing_keys.add(key)
                out.append(s)
        return out
    
    def _analyze_content_quality(self, parsed_resume: Dict[str, Any], content_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Analyze content quality; only suggest issues that exist in this resume (resume-specific)."""
        suggestions = []
        content_weaknesses = (content_data or {}).get('details', {}).get('content_weaknesses', [])
        
        experience = parsed_resume.get('experience', [])
        roles_with_weak_verbs = []
        roles_with_few_numbers = []
        roles_with_passive = []
        
        for i, exp in enumerate(experience):
            description = exp.get('description', '')
            title = exp.get('title', f'Role {i+1}')
            if re.search(self.common_mistakes['weak_verbs']['pattern'], description, re.IGNORECASE):
                roles_with_weak_verbs.append(title or f"#{i+1}")
            numbers = re.findall(r'\d+', description)
            if len(numbers) < 2:
                roles_with_few_numbers.append(title or f"#{i+1}")
            if re.search(self.common_mistakes['passive_voice']['pattern'], description, re.IGNORECASE):
                roles_with_passive.append(title or f"#{i+1}")
        
        # One suggestion per issue type, with resume-specific roles listed
        if roles_with_weak_verbs and not any('action' in w.lower() for w in content_weaknesses):
            suggestions.append({
                'category': 'content',
                'priority': 'high',
                'type': 'weak_verbs',
                'suggestion': f"Replace weak phrases with action verbs in: {', '.join(roles_with_weak_verbs[:3])}",
                'explanation': "Phrases like 'responsible for' and 'duties included' are weak. Use verbs like 'managed', 'developed', 'led'.",
                'section': 'experience',
                'example': "Instead of 'Responsible for managing team' use 'Led cross-functional team of 8'"
            })
        if roles_with_few_numbers and not any('quantified' in w.lower() for w in content_weaknesses):
            suggestions.append({
                'category': 'content',
                'priority': 'high',
                'type': 'quantification',
                'suggestion': f"Add quantified achievements to: {', '.join(roles_with_few_numbers[:3])}",
                'explanation': "Include numbers, percentages, and metrics to show impact.",
                'section': 'experience',
                'example': "e.g. '25% increase in efficiency', 'managed budget of ₹X lakhs'"
            })
        if roles_with_passive:
            suggestions.append({
                'category': 'content',
                'priority': 'medium',
                'type': 'passive_voice',
                'suggestion': f"Use active voice in: {', '.join(roles_with_passive[:3])}",
                'explanation': "Active voice is more engaging and shows ownership.",
                'section': 'experience',
                'example': "Instead of 'Project was completed' use 'Completed project ahead of schedule'"
            })
        
        summary = parsed_resume.get('summary', '')
        if summary and len(summary.split()) < 20 and not any('summary' in w.lower() for w in content_weaknesses):
            suggestions.append({
                'category': 'content',
                'priority': 'medium',
                'type': 'summary_length',
                'suggestion': "Expand your professional summary (currently very brief)",
                'explanation': "A strong summary is 3-4 sentences with years of experience, key skills, and top achievements.",
                'section': 'summary',
                'example': "Include your experience level, domain, and 1-2 standout achievements"
            })
        
        return suggestions
    
    def _analyze_format_issues(self, parsed_resume: Dict[str, Any], format_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Analyze formatting issues; only suggest what ATS didn't already list."""
        suggestions = []
        ats_issues = (format_data or {}).get('details', {}).get('issues', [])
        raw_text = parsed_resume.get('raw_text', '')
        
        bullet_patterns = ['•', '-', '*', '◦']
        used_bullets = [p for p in bullet_patterns if raw_text.count(p) > 0]
        if len(used_bullets) > 1 and not any('bullet' in i.lower() for i in ats_issues):
            suggestions.append({
                'category': 'format',
                'priority': 'medium',
                'type': 'bullet_consistency',
                'suggestion': f"Use one bullet style throughout (you're using: {', '.join(used_bullets)})",
                'explanation': "One consistent bullet style improves ATS parsing and readability.",
                'section': 'format',
                'example': "Use only '•' or only '-' for all bullets"
            })
        
        if raw_text.count('\t') > 20 and not any('tab' in i.lower() or 'formatting' in i.lower() for i in ats_issues):
            suggestions.append({
                'category': 'format',
                'priority': 'medium',
                'type': 'excessive_tabs',
                'suggestion': "Reduce tabs and complex formatting",
                'explanation': "Heavy formatting can cause ATS parsing errors.",
                'section': 'format',
                'example': "Use simple spacing and alignment"
            })
        
        return suggestions
    
    def _analyze_keyword_optimization(self, parsed_resume: Dict[str, Any], keyword_data: Dict[str, Any] = None, target_role: str = None) -> List[Dict[str, Any]]:
        """Suggest keywords only when score is low and we have resume-specific gaps."""
        suggestions = []
        details = (keyword_data or {}).get('details', {})
        missing_from_ats = details.get('missing_keywords', [])
        
        current_skills = []
        skills_section = parsed_resume.get('skills', {})
        if isinstance(skills_section, dict):
            for skill_list in skills_section.values():
                if isinstance(skill_list, list):
                    current_skills.extend([s.lower() for s in skill_list])
        
        if target_role and not missing_from_ats:
            role_lower = target_role.lower()
            relevant = []
            for industry, keywords in self.industry_keywords.items():
                if any(term in role_lower for term in industry.split('_')):
                    relevant.extend(keywords)
            missing_role = [kw for kw in relevant if kw not in current_skills][:6]
            if missing_role:
                suggestions.append({
                    'category': 'keywords',
                    'priority': 'high',
                    'type': 'missing_keywords',
                    'suggestion': f"For {target_role}, consider adding: {', '.join(missing_role)}",
                    'explanation': "These terms are commonly expected for this role and help ATS match.",
                    'section': 'skills',
                    'example': f"Add to skills or weave into experience: {', '.join(missing_role[:3])}"
                })
        
        if len(current_skills) < 6 and keyword_data.get('score', 100) < 70:
            suggestions.append({
                'category': 'keywords',
                'priority': 'medium',
                'type': 'skills_diversity',
                'suggestion': f"Expand skills section (you have {len(current_skills)} listed)",
                'explanation': "More relevant skills improve ATS match and recruiter scan.",
                'section': 'skills',
                'example': "Add tools, languages, and soft skills from your target job descriptions"
            })
        
        return suggestions
    
    def _analyze_completeness(self, parsed_resume: Dict[str, Any], completeness_data: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Suggest only what's actually missing (avoid duplicating ATS missing_sections)."""
        suggestions = []
        ats_missing = (completeness_data or {}).get('details', {}).get('missing_sections', [])
        
        personal_info = parsed_resume.get('personal_info', {})
        missing_contact = [f for f in ['email', 'phone'] if not personal_info.get(f)]
        if missing_contact and 'personal_info' not in ats_missing:
            suggestions.append({
                'category': 'completeness',
                'priority': 'high',
                'type': 'missing_contact',
                'suggestion': f"Add contact details: {', '.join(missing_contact)}",
                'explanation': "Employers need these to contact you.",
                'section': 'contact',
                'example': "Add a professional email and phone number at the top"
            })
        
        if not parsed_resume.get('summary') and 'summary' not in ats_missing:
            suggestions.append({
                'category': 'completeness',
                'priority': 'medium',
                'type': 'missing_summary',
                'suggestion': "Add a professional summary at the top",
                'explanation': "A 2-3 sentence summary helps recruiters quickly see your fit.",
                'section': 'summary',
                'example': "Include years of experience, domain, and one key achievement"
            })
        
        if not parsed_resume.get('education') and 'education' not in ats_missing:
            suggestions.append({
                'category': 'completeness',
                'priority': 'medium',
                'type': 'missing_education',
                'suggestion': "Add an education section",
                'explanation': "List degree, institution, and year for ATS and recruiters.",
                'section': 'education',
                'example': "e.g. B.Tech, ABC College, 2020"
            })
        
        return suggestions
    
    def _analyze_ats_issues(self, parsed_resume: Dict[str, Any], ats_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate resume-specific suggestions from ATS component scores and their details."""
        suggestions = []
        component_scores = ats_analysis.get('component_scores', {})
        
        # Keywords: use actual missing keywords from ATS or infer from industry
        keyword_data = component_scores.get('keywords', {})
        score = keyword_data.get('score', 0)
        details = keyword_data.get('details', {})
        if score < 75:
            missing = details.get('missing_keywords', [])
            if not missing and parsed_resume:
                resume_text = self._extract_resume_text_for_keywords(parsed_resume)
                missing = self._get_missing_industry_keywords(resume_text)
            if missing:
                top_missing = missing[:8]
                suggestions.append({
                    'category': 'keywords',
                    'priority': 'high',
                    'type': 'ats_keywords',
                    'suggestion': f"Add these keywords to improve ATS match: {', '.join(top_missing)}",
                    'explanation': f"Your resume's keyword score is {score:.0f}%. Including terms like these (from your industry) helps ATS rank you higher.",
                    'section': 'skills',
                    'example': f"Add to Skills or experience: {', '.join(top_missing[:4])}"
                })
            else:
                suggestions.append({
                    'category': 'keywords',
                    'priority': 'high',
                    'type': 'ats_keywords',
                    'suggestion': "Strengthen keyword usage in your resume",
                    'explanation': f"Your keyword score is {score:.0f}%. Weave relevant role and industry terms into your summary and experience bullets.",
                    'section': 'content',
                    'example': "Use job description language in your bullet points where accurate"
                })
        
        # Format: use actual issues from ATS
        format_data = component_scores.get('format', {})
        score = format_data.get('score', 0)
        details = format_data.get('details', {})
        if score < 80:
            issues = details.get('issues', [])
            if issues:
                suggestions.append({
                    'category': 'format',
                    'priority': 'high',
                    'type': 'ats_format',
                    'suggestion': f"Address these format issues: {'; '.join(issues)}",
                    'explanation': f"Your format score is {score:.0f}%. Fixing these helps ATS parse your resume correctly.",
                    'section': 'format',
                    'example': "Use clear section headers (Experience, Education, Skills), one bullet style, and avoid tables/graphics"
                })
            else:
                suggestions.append({
                    'category': 'format',
                    'priority': 'medium',
                    'type': 'ats_format',
                    'suggestion': "Improve formatting for ATS compatibility",
                    'explanation': f"Your format score is {score:.0f}%. Use standard headers and consistent bullets.",
                    'section': 'format',
                    'example': "Use simple fonts (Arial, Calibri), clear section headers, and consistent bullet points"
                })
        
        # Content: use actual weaknesses from ATS (one suggestion listing specific issues)
        content_data = component_scores.get('content', {})
        score = content_data.get('score', 0)
        details = content_data.get('details', {})
        if score < 75:
            weaknesses = details.get('content_weaknesses', [])
            if weaknesses:
                suggestions.append({
                    'category': 'content',
                    'priority': 'high',
                    'type': 'ats_content',
                    'suggestion': f"Address these content issues: {'; '.join(weaknesses)}",
                    'explanation': f"Your content score is {score:.0f}%. Fixing these will strengthen your resume.",
                    'section': 'experience',
                    'example': "Add action verbs (Led, Delivered, Improved) and numbers (%, ₹, team size, time saved)"
                })
            else:
                suggestions.append({
                    'category': 'content',
                    'priority': 'medium',
                    'type': 'ats_content',
                    'suggestion': "Enhance content quality",
                    'explanation': f"Your content score is {score:.0f}%. Add action verbs and quantified achievements.",
                    'section': 'experience',
                    'example': "e.g. 'Increased sales by 20%' or 'Led team of 5'"
                })
        
        # Completeness: use actual missing sections from ATS
        completeness_data = component_scores.get('completeness', {})
        score = completeness_data.get('score', 0)
        details = completeness_data.get('details', {})
        if score < 80:
            missing_sections = details.get('missing_sections', [])
            if missing_sections:
                human = [s.replace('_', ' ').title() for s in missing_sections]
                suggestions.append({
                    'category': 'completeness',
                    'priority': 'high',
                    'type': 'ats_completeness',
                    'suggestion': f"Add missing sections: {', '.join(human)}",
                    'explanation': f"Your completeness score is {score:.0f}%. These sections are expected by recruiters and ATS.",
                    'section': 'structure',
                    'example': f"Add clear headings and content for: {', '.join(human)}"
                })
            else:
                suggestions.append({
                    'category': 'completeness',
                    'priority': 'medium',
                    'type': 'ats_completeness',
                    'suggestion': "Complete missing resume sections",
                    'explanation': f"Your completeness score is {score:.0f}%. Ensure Experience, Education, Skills, and contact info are present.",
                    'section': 'structure',
                    'example': "Include Professional Summary, Work Experience, Education, Skills, and Contact details"
                })
        
        return suggestions
    
    def _extract_resume_text_for_keywords(self, parsed_resume: Dict[str, Any]) -> str:
        """Extract all text from resume for keyword comparison."""
        parts = []
        if parsed_resume.get('raw_text'):
            parts.append(parsed_resume['raw_text'])
        for key in ['summary', 'experience', 'skills']:
            val = parsed_resume.get(key)
            if isinstance(val, str):
                parts.append(val)
            elif isinstance(val, list):
                for item in val:
                    if isinstance(item, dict) and item.get('description'):
                        parts.append(item['description'])
            elif isinstance(val, dict):
                for v in val.values():
                    if isinstance(v, list):
                        parts.extend(str(s) for s in v)
        return ' '.join(parts).lower()
    
    def _get_missing_industry_keywords(self, resume_text: str) -> List[str]:
        """Return industry keywords that are missing from resume text."""
        missing = []
        for industry, keywords in self.industry_keywords.items():
            for kw in keywords:
                if kw.lower() not in resume_text and kw not in missing:
                    missing.append(kw)
        return missing[:15]
    
    def _generate_industry_suggestions(self, parsed_resume: Dict[str, Any], target_role: str) -> List[Dict[str, Any]]:
        """Generate industry-specific suggestions"""
        suggestions = []
        
        role_lower = target_role.lower()
        
        # Technology roles
        if any(term in role_lower for term in ['engineer', 'developer', 'programmer', 'software']):
            suggestions.append({
                'category': 'content',
                'priority': 'medium',
                'type': 'tech_projects',
                'suggestion': "Highlight technical projects and contributions",
                'explanation': "Include specific technologies used and problems solved.",
                'section': 'experience',
                'example': "Mention programming languages, frameworks, and project outcomes"
            })
        
        # Management roles
        if any(term in role_lower for term in ['manager', 'director', 'lead', 'supervisor']):
            suggestions.append({
                'category': 'content',
                'priority': 'high',
                'type': 'leadership',
                'suggestion': "Emphasize leadership and team management experience",
                'explanation': "Highlight team sizes, budget responsibility, and leadership achievements.",
                'section': 'experience',
                'example': "Include metrics like 'Led team of 12' or 'Managed $500K budget'"
            })
        
        # Sales roles
        if any(term in role_lower for term in ['sales', 'account', 'business development']):
            suggestions.append({
                'category': 'content',
                'priority': 'high',
                'type': 'sales_metrics',
                'suggestion': "Include sales metrics and achievements",
                'explanation': "Quantify your sales performance with specific numbers.",
                'section': 'experience',
                'example': "Add metrics like 'Exceeded quota by 125%' or 'Generated $2M in revenue'"
            })
        
        return suggestions
    
    def _generate_ai_suggestions(self, parsed_resume: Dict[str, Any], target_role: str = None) -> List[Dict[str, Any]]:
        """Generate AI-powered suggestions using OpenAI"""
        suggestions = []
        
        try:
            # Prepare resume summary for AI analysis
            resume_summary = self._create_resume_summary(parsed_resume)
            
            prompt = f"""
            Analyze this resume and provide 3 specific, actionable improvement suggestions:
            
            Resume Summary:
            {resume_summary}
            
            Target Role: {target_role or 'General'}
            
            Please provide suggestions in this format:
            1. [Category]: [Specific suggestion] - [Brief explanation]
            2. [Category]: [Specific suggestion] - [Brief explanation]
            3. [Category]: [Specific suggestion] - [Brief explanation]
            
            Focus on content quality, keyword optimization, and industry-specific improvements.
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            # Parse AI response into structured suggestions
            ai_suggestions = self._parse_ai_response(ai_response)
            suggestions.extend(ai_suggestions)
            
        except Exception as e:
            print(f"Error generating AI suggestions: {str(e)}")
        
        return suggestions
    
    def _create_resume_summary(self, parsed_resume: Dict[str, Any]) -> str:
        """Create a concise summary of the resume for AI analysis"""
        summary_parts = []
        
        # Add professional summary
        if parsed_resume.get('summary'):
            summary_parts.append(f"Summary: {parsed_resume['summary']}")
        
        # Add experience count
        experience = parsed_resume.get('experience', [])
        summary_parts.append(f"Experience: {len(experience)} positions")
        
        # Add skills
        skills = parsed_resume.get('skills', {})
        if skills:
            all_skills = []
            for skill_list in skills.values():
                if isinstance(skill_list, list):
                    all_skills.extend(skill_list)
            summary_parts.append(f"Skills: {', '.join(all_skills[:10])}")
        
        # Add education
        education = parsed_resume.get('education', [])
        if education:
            summary_parts.append(f"Education: {len(education)} entries")
        
        return '\n'.join(summary_parts)
    
    def _parse_ai_response(self, ai_response: str) -> List[Dict[str, Any]]:
        """Parse AI response into structured suggestions"""
        suggestions = []
        
        lines = ai_response.strip().split('\n')
        for line in lines:
            if re.match(r'^\d+\.', line.strip()):
                # Extract suggestion from numbered line
                content = re.sub(r'^\d+\.\s*', '', line.strip())
                
                # Try to extract category
                category = 'content'  # default
                if 'keyword' in content.lower() or 'skill' in content.lower():
                    category = 'keywords'
                elif 'format' in content.lower() or 'structure' in content.lower():
                    category = 'format'
                
                suggestions.append({
                    'category': category,
                    'priority': 'medium',
                    'type': 'ai_generated',
                    'suggestion': content,
                    'explanation': "AI-generated suggestion based on resume analysis",
                    'section': 'general',
                    'example': ""
                })
        
        return suggestions
    
    def _prioritize_suggestions(self, suggestions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Prioritize and deduplicate suggestions"""
        
        # Remove duplicates based on suggestion text
        seen_suggestions = set()
        unique_suggestions = []
        
        for suggestion in suggestions:
            suggestion_key = suggestion['suggestion'].lower()
            if suggestion_key not in seen_suggestions:
                seen_suggestions.add(suggestion_key)
                unique_suggestions.append(suggestion)
        
        # Sort by priority and category weight
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        category_weights = self.categories
        
        def sort_key(suggestion):
            priority_score = priority_order.get(suggestion['priority'], 1)
            category_weight = category_weights.get(suggestion['category'], {}).get('weight', 0.1)
            return priority_score * category_weight
        
        unique_suggestions.sort(key=sort_key, reverse=True)
        
        # Limit to top 15 suggestions to avoid overwhelming the user
        return unique_suggestions[:15]
    
    def generate_improvement_plan(self, suggestions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate a structured improvement plan"""
        
        # Group suggestions by category
        categorized = {}
        for suggestion in suggestions:
            category = suggestion['category']
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(suggestion)
        
        # Create improvement plan
        plan = {
            'total_suggestions': len(suggestions),
            'categories': {},
            'quick_wins': [],
            'long_term_goals': [],
            'estimated_impact': self._calculate_estimated_impact(suggestions)
        }
        
        for category, category_suggestions in categorized.items():
            plan['categories'][category] = {
                'count': len(category_suggestions),
                'description': self.categories.get(category, {}).get('description', ''),
                'suggestions': category_suggestions
            }
            
            # Identify quick wins (high priority, easy to implement)
            for suggestion in category_suggestions:
                if suggestion['priority'] == 'high' and suggestion['type'] in ['missing_contact', 'bullet_consistency']:
                    plan['quick_wins'].append(suggestion)
                elif suggestion['priority'] in ['medium', 'low']:
                    plan['long_term_goals'].append(suggestion)
        
        return plan
    
    def _calculate_estimated_impact(self, suggestions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate estimated impact of implementing suggestions"""
        
        total_impact = 0
        category_impacts = {}
        
        for suggestion in suggestions:
            category = suggestion['category']
            priority = suggestion['priority']
            
            # Calculate impact score
            impact_score = 0
            if priority == 'high':
                impact_score = 15
            elif priority == 'medium':
                impact_score = 10
            else:
                impact_score = 5
            
            # Weight by category importance
            category_weight = self.categories.get(category, {}).get('weight', 0.1)
            weighted_impact = impact_score * category_weight
            
            total_impact += weighted_impact
            
            if category not in category_impacts:
                category_impacts[category] = 0
            category_impacts[category] += weighted_impact
        
        return {
            'total_score_improvement': round(min(total_impact, 25), 1),  # Cap at 25 points
            'category_improvements': {k: round(v, 1) for k, v in category_impacts.items()},
            'confidence': 'high' if total_impact > 15 else 'medium' if total_impact > 8 else 'low'
        }

