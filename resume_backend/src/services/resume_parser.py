import os
import re
import PyPDF2
from docx import Document
from typing import Dict, List, Optional, Any
from datetime import datetime

try:
    import spacy
    _SPACY_AVAILABLE = True
except ImportError:
    _SPACY_AVAILABLE = False
    spacy = None

class ResumeParser:
    def __init__(self):
        # Load spaCy model for NLP processing (optional; works without it)
        self.nlp = None
        if _SPACY_AVAILABLE and spacy is not None:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                pass
        
        # Common section headers
        # Note: keep experience pattern narrow so we don't treat
        # "Professional Summary" / "Career Objective" as work experience.
        self.section_patterns = {
            'contact': r'(contact|personal|information)',
            'summary': r'(summary|objective|profile|about|professional summary|career objective)',
            'experience': r'(experience|employment|work experience|work history|internship|internships)',
            'education': r'(education|academic|qualification|degree)',
            'skills': r'(skills|competencies|technical|technologies)',
            'projects': r'(projects|portfolio|work samples)',
            'certifications': r'(certifications?|licenses?|credentials)',
            'achievements': r'(achievements?|awards?|honors?|accomplishments?)',
            'volunteer': r'(volunteer|community|service)'
        }
        
        # Common skill keywords
        self.skill_keywords = {
            'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift'],
            'web': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask'],
            'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'sqlite'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform'],
            'data': ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'tableau', 'power bi'],
            'tools': ['git', 'jenkins', 'jira', 'confluence', 'slack', 'trello']
        }
    
    def parse_file(self, file_path: str, file_type: str) -> Dict[str, Any]:
        """Parse resume file and extract structured information"""
        try:
            # Extract raw text based on file type
            if file_type.lower() == 'pdf':
                raw_text = self._extract_pdf_text(file_path)
            elif file_type.lower() in ['docx', 'doc']:
                raw_text = self._extract_docx_text(file_path)
            elif file_type.lower() == 'txt':
                raw_text = self._extract_txt_text(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Parse structured information
            parsed_data = self._parse_text_content(raw_text)
            parsed_data['raw_text'] = raw_text
            
            return parsed_data
            
        except Exception as e:
            raise Exception(f"Error parsing resume: {str(e)}")
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = None
                    try:
                        page_text = page.extract_text()
                    except Exception:
                        page_text = None
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")
        return text
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            doc = Document(file_path)
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            raise Exception(f"Error reading DOCX: {str(e)}")
    
    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"Error reading TXT: {str(e)}")
    
    def _parse_text_content(self, text: str) -> Dict[str, Any]:
        """Parse text content and extract structured information"""
        parsed_data = {
            'personal_info': self._extract_personal_info(text),
            'summary': self._extract_summary(text),
            'experience': self._extract_experience(text),
            'education': self._extract_education(text),
            'skills': self._extract_skills(text),
            'projects': self._extract_projects(text),
            'certifications': self._extract_certifications(text),
            'achievements': self._extract_achievements(text)
        }
        
        return parsed_data
    
    def _extract_personal_info(self, text: str) -> Dict[str, str]:
        """Extract personal information like name, email, phone"""
        info = {}
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            info['email'] = emails[0]
        
        # Extract phone number
        phone_pattern = r'(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'
        phones = re.findall(phone_pattern, text)
        if phones:
            info['phone'] = ''.join(phones[0])
        
        # Extract name (first few words before email or at the beginning)
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line = line.strip()
            if line and not re.search(r'@|phone|email|address', line.lower()):
                # Simple heuristic: if line has 2-4 words and looks like a name
                words = line.split()
                if 2 <= len(words) <= 4 and all(word.isalpha() or word.replace('.', '').isalpha() for word in words):
                    info['name'] = line
                    break
        
        return info
    
    def _extract_summary(self, text: str) -> str:
        """Extract professional summary or objective"""
        sections = self._split_into_sections(text)
        for section_name, content in sections.items():
            if re.search(self.section_patterns['summary'], section_name, re.IGNORECASE):
                return content.strip()
        return ""
    
    def _extract_experience(self, text: str) -> List[Dict[str, str]]:
        """Extract work experience"""
        experience = []
        sections = self._split_into_sections(text)
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['experience'], section_name, re.IGNORECASE):
                # Split experience entries (usually separated by job titles or companies)
                entries = self._parse_experience_entries(content)
                experience.extend(entries)
        
        return experience
    
    def _extract_education(self, text: str) -> List[Dict[str, str]]:
        """Extract education information"""
        education = []
        sections = self._split_into_sections(text)
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['education'], section_name, re.IGNORECASE):
                entries = self._parse_education_entries(content)
                education.extend(entries)
        
        return education
    
    def _extract_skills(self, text: str) -> Dict[str, List[str]]:
        """Extract skills categorized by type"""
        skills = {category: [] for category in self.skill_keywords.keys()}
        skills['other'] = []
        
        # Find skills section
        sections = self._split_into_sections(text)
        skills_text = ""
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['skills'], section_name, re.IGNORECASE):
                skills_text = content
                break
        
        # If no dedicated skills section, search entire text
        if not skills_text:
            skills_text = text
        
        # Extract skills by category
        text_lower = skills_text.lower()
        for category, keywords in self.skill_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    skills[category].append(keyword.title())
        
        # Extract other skills (words that appear to be technical terms)
        words = re.findall(r'\b[A-Za-z][A-Za-z0-9+#.]*\b', skills_text)
        for word in words:
            if (len(word) > 2 and 
                word.lower() not in [skill.lower() for category_skills in skills.values() for skill in category_skills] and
                not word.lower() in ['and', 'or', 'with', 'using', 'including', 'such', 'as']):
                # Simple heuristic for technical terms
                if any(char.isupper() for char in word) or any(char.isdigit() for char in word):
                    skills['other'].append(word)
        
        # Remove duplicates and empty categories
        for category in skills:
            skills[category] = list(set(skills[category]))
        
        return {k: v for k, v in skills.items() if v}
    
    def _extract_projects(self, text: str) -> List[Dict[str, str]]:
        """Extract project information"""
        projects = []
        sections = self._split_into_sections(text)
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['projects'], section_name, re.IGNORECASE):
                entries = self._parse_project_entries(content)
                projects.extend(entries)
        
        return projects
    
    def _extract_certifications(self, text: str) -> List[str]:
        """Extract certifications and licenses"""
        certifications = []
        sections = self._split_into_sections(text)
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['certifications'], section_name, re.IGNORECASE):
                # Split by lines and clean up
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                certifications.extend(lines)
        
        return certifications
    
    def _extract_achievements(self, text: str) -> List[str]:
        """Extract achievements and awards"""
        achievements = []
        sections = self._split_into_sections(text)
        
        for section_name, content in sections.items():
            if re.search(self.section_patterns['achievements'], section_name, re.IGNORECASE):
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                achievements.extend(lines)
        
        return achievements
    
    def _split_into_sections(self, text: str) -> Dict[str, str]:
        """Split resume text into sections based on headers"""
        sections = {}
        lines = text.split('\n')
        current_section = "header"
        current_content = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if line is a section header
            is_header = False
            for pattern_name, pattern in self.section_patterns.items():
                if re.search(pattern, line, re.IGNORECASE) and len(line.split()) <= 3:
                    # Save previous section
                    if current_content:
                        sections[current_section] = '\n'.join(current_content)
                    
                    # Start new section
                    current_section = line
                    current_content = []
                    is_header = True
                    break
            
            if not is_header:
                current_content.append(line)
        
        # Save last section
        if current_content:
            sections[current_section] = '\n'.join(current_content)
        
        return sections
    
    def _parse_experience_entries(self, content: str) -> List[Dict[str, str]]:
        """Parse individual work experience entries"""
        entries = []
        
        # Split by potential job entries (lines that might be job titles)
        lines = content.split('\n')
        current_entry = {}
        current_description = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Heuristic: if line contains dates, it might be a job header
            date_pattern = r'\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b|\bpresent\b'
            if re.search(date_pattern, line, re.IGNORECASE):
                # Save previous entry
                if current_entry:
                    current_entry['description'] = '\n'.join(current_description)
                    entries.append(current_entry)
                
                # Start new entry
                current_entry = {'title': line}
                current_description = []
            else:
                # Add to description
                current_description.append(line)
        
        # Save last entry
        if current_entry:
            current_entry['description'] = '\n'.join(current_description)
            entries.append(current_entry)
        
        return entries
    
    def _parse_education_entries(self, content: str) -> List[Dict[str, str]]:
        """Parse education entries"""
        entries = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]
        
        for line in lines:
            # Simple parsing - each line as an education entry
            if len(line) > 10:  # Filter out very short lines
                entries.append({'degree': line})
        
        return entries
    
    def _parse_project_entries(self, content: str) -> List[Dict[str, str]]:
        """Parse project entries"""
        entries = []
        lines = content.split('\n')
        current_project = {}
        current_description = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Heuristic: if line looks like a project title (short, no bullet points)
            if len(line.split()) <= 8 and not line.startswith('•') and not line.startswith('-'):
                # Save previous project
                if current_project:
                    current_project['description'] = '\n'.join(current_description)
                    entries.append(current_project)
                
                # Start new project
                current_project = {'title': line}
                current_description = []
            else:
                current_description.append(line)
        
        # Save last project
        if current_project:
            current_project['description'] = '\n'.join(current_description)
            entries.append(current_project)
        
        return entries

