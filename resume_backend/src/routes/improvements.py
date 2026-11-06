from flask import Blueprint, request, jsonify
from src.models.resume import db, Resume, ImprovementSuggestion
from src.services.improvement_engine import ImprovementEngine

improvements_bp = Blueprint('improvements', __name__)

@improvements_bp.route('/generate/<int:resume_id>', methods=['POST'])
def generate_improvements(resume_id):
    """Generate comprehensive improvement suggestions for a resume"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get request data
        data = request.get_json() or {}
        target_role = data.get('target_role')
        regenerate = data.get('regenerate', False)
        
        # Get parsed resume data and ATS analysis
        parsed_data = resume.get_parsed_data()
        ats_analysis = resume.get_ats_analysis()
        
        # Initialize improvement engine
        engine = ImprovementEngine()
        
        # Generate comprehensive suggestions
        suggestions = engine.generate_comprehensive_suggestions(
            parsed_data, ats_analysis, target_role
        )
        
        # Clear existing suggestions if regenerating
        if regenerate:
            ImprovementSuggestion.query.filter_by(resume_id=resume_id).delete()
        
        # Save suggestions to database
        saved_suggestions = []
        for suggestion_data in suggestions:
            suggestion = ImprovementSuggestion(
                resume_id=resume_id,
                category=suggestion_data['category'],
                priority=suggestion_data['priority'],
                suggestion=suggestion_data['suggestion'],
                explanation=suggestion_data['explanation']
            )
            db.session.add(suggestion)
            saved_suggestions.append(suggestion)
        
        db.session.commit()
        
        # Generate improvement plan
        improvement_plan = engine.generate_improvement_plan(suggestions)
        
        return jsonify({
            'message': 'Improvement suggestions generated successfully',
            'suggestions': [s.to_dict() for s in saved_suggestions],
            'improvement_plan': improvement_plan,
            'target_role': target_role
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error generating improvements: {str(e)}'}), 500

@improvements_bp.route('/plan/<int:resume_id>', methods=['GET'])
def get_improvement_plan(resume_id):
    """Get structured improvement plan for a resume"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get existing suggestions
        suggestions = ImprovementSuggestion.query.filter_by(resume_id=resume_id).all()
        
        if not suggestions:
            return jsonify({'error': 'No suggestions found. Generate suggestions first.'}), 404
        
        # Convert to format expected by improvement engine
        suggestion_data = []
        for suggestion in suggestions:
            suggestion_data.append({
                'category': suggestion.category,
                'priority': suggestion.priority,
                'suggestion': suggestion.suggestion,
                'explanation': suggestion.explanation,
                'type': 'saved',
                'is_implemented': suggestion.is_implemented
            })
        
        # Generate improvement plan
        engine = ImprovementEngine()
        improvement_plan = engine.generate_improvement_plan(suggestion_data)
        
        # Add implementation status
        improvement_plan['implementation_status'] = {
            'total_suggestions': len(suggestions),
            'implemented': len([s for s in suggestions if s.is_implemented]),
            'pending': len([s for s in suggestions if not s.is_implemented]),
            'completion_percentage': round(
                (len([s for s in suggestions if s.is_implemented]) / len(suggestions)) * 100, 1
            ) if suggestions else 0
        }
        
        return jsonify(improvement_plan), 200
        
    except Exception as e:
        return jsonify({'error': f'Error getting improvement plan: {str(e)}'}), 500

@improvements_bp.route('/implement/<int:suggestion_id>', methods=['PUT'])
def implement_suggestion(suggestion_id):
    """Mark a suggestion as implemented"""
    try:
        suggestion = ImprovementSuggestion.query.get(suggestion_id)
        if not suggestion:
            return jsonify({'error': 'Suggestion not found'}), 404
        
        suggestion.mark_implemented()
        db.session.commit()
        
        # Get updated implementation status
        all_suggestions = ImprovementSuggestion.query.filter_by(
            resume_id=suggestion.resume_id
        ).all()
        
        implemented_count = len([s for s in all_suggestions if s.is_implemented])
        total_count = len(all_suggestions)
        completion_percentage = round((implemented_count / total_count) * 100, 1) if total_count > 0 else 0
        
        return jsonify({
            'message': 'Suggestion marked as implemented',
            'suggestion': suggestion.to_dict(),
            'implementation_status': {
                'implemented': implemented_count,
                'total': total_count,
                'completion_percentage': completion_percentage
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error implementing suggestion: {str(e)}'}), 500

@improvements_bp.route('/batch-implement', methods=['PUT'])
def batch_implement_suggestions():
    """Mark multiple suggestions as implemented"""
    try:
        data = request.get_json()
        suggestion_ids = data.get('suggestion_ids', [])
        
        if not suggestion_ids:
            return jsonify({'error': 'No suggestion IDs provided'}), 400
        
        # Update suggestions
        updated_suggestions = []
        for suggestion_id in suggestion_ids:
            suggestion = ImprovementSuggestion.query.get(suggestion_id)
            if suggestion:
                suggestion.mark_implemented()
                updated_suggestions.append(suggestion)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully implemented {len(updated_suggestions)} suggestions',
            'implemented_suggestions': [s.to_dict() for s in updated_suggestions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error batch implementing suggestions: {str(e)}'}), 500

@improvements_bp.route('/analytics/<int:resume_id>', methods=['GET'])
def get_improvement_analytics(resume_id):
    """Get analytics on improvement suggestions and implementation"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        suggestions = ImprovementSuggestion.query.filter_by(resume_id=resume_id).all()
        
        if not suggestions:
            return jsonify({'error': 'No suggestions found'}), 404
        
        # Calculate analytics
        analytics = {
            'overview': {
                'total_suggestions': len(suggestions),
                'implemented': len([s for s in suggestions if s.is_implemented]),
                'pending': len([s for s in suggestions if not s.is_implemented]),
                'completion_rate': round(
                    (len([s for s in suggestions if s.is_implemented]) / len(suggestions)) * 100, 1
                ) if suggestions else 0
            },
            'by_category': {},
            'by_priority': {},
            'implementation_timeline': [],
            'estimated_impact': {
                'current_score': resume.ats_score or 0,
                'potential_improvement': 0,
                'confidence': 'medium'
            }
        }
        
        # Category breakdown
        categories = {}
        for suggestion in suggestions:
            category = suggestion.category
            if category not in categories:
                categories[category] = {'total': 0, 'implemented': 0}
            categories[category]['total'] += 1
            if suggestion.is_implemented:
                categories[category]['implemented'] += 1
        
        for category, data in categories.items():
            analytics['by_category'][category] = {
                'total': data['total'],
                'implemented': data['implemented'],
                'pending': data['total'] - data['implemented'],
                'completion_rate': round((data['implemented'] / data['total']) * 100, 1)
            }
        
        # Priority breakdown
        priorities = {}
        for suggestion in suggestions:
            priority = suggestion.priority
            if priority not in priorities:
                priorities[priority] = {'total': 0, 'implemented': 0}
            priorities[priority]['total'] += 1
            if suggestion.is_implemented:
                priorities[priority]['implemented'] += 1
        
        for priority, data in priorities.items():
            analytics['by_priority'][priority] = {
                'total': data['total'],
                'implemented': data['implemented'],
                'pending': data['total'] - data['implemented'],
                'completion_rate': round((data['implemented'] / data['total']) * 100, 1)
            }
        
        # Implementation timeline
        implemented_suggestions = [s for s in suggestions if s.is_implemented and s.implemented_at]
        implemented_suggestions.sort(key=lambda x: x.implemented_at)
        
        for suggestion in implemented_suggestions:
            analytics['implementation_timeline'].append({
                'date': suggestion.implemented_at.isoformat(),
                'suggestion': suggestion.suggestion,
                'category': suggestion.category,
                'priority': suggestion.priority
            })
        
        # Estimate potential improvement
        high_priority_pending = len([s for s in suggestions if s.priority == 'high' and not s.is_implemented])
        medium_priority_pending = len([s for s in suggestions if s.priority == 'medium' and not s.is_implemented])
        
        potential_improvement = (high_priority_pending * 3) + (medium_priority_pending * 2)
        analytics['estimated_impact']['potential_improvement'] = min(potential_improvement, 20)
        
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': f'Error getting improvement analytics: {str(e)}'}), 500

@improvements_bp.route('/suggestions/<int:resume_id>', methods=['GET'])
def get_suggestions(resume_id):
    """Get all suggestions for a resume with filtering options"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get query parameters for filtering
        category = request.args.get('category')
        priority = request.args.get('priority')
        implemented = request.args.get('implemented')
        
        # Build query
        query = ImprovementSuggestion.query.filter_by(resume_id=resume_id)
        
        if category:
            query = query.filter_by(category=category)
        
        if priority:
            query = query.filter_by(priority=priority)
        
        if implemented is not None:
            is_implemented = implemented.lower() == 'true'
            query = query.filter_by(is_implemented=is_implemented)
        
        suggestions = query.order_by(
            ImprovementSuggestion.priority.desc(),
            ImprovementSuggestion.created_at.desc()
        ).all()
        
        return jsonify({
            'suggestions': [s.to_dict() for s in suggestions],
            'total': len(suggestions),
            'filters': {
                'category': category,
                'priority': priority,
                'implemented': implemented
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error getting suggestions: {str(e)}'}), 500

@improvements_bp.route('/delete/<int:suggestion_id>', methods=['DELETE'])
def delete_suggestion(suggestion_id):
    """Delete a specific suggestion"""
    try:
        suggestion = ImprovementSuggestion.query.get(suggestion_id)
        if not suggestion:
            return jsonify({'error': 'Suggestion not found'}), 404
        
        db.session.delete(suggestion)
        db.session.commit()
        
        return jsonify({'message': 'Suggestion deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Error deleting suggestion: {str(e)}'}), 500

@improvements_bp.route('/export/<int:resume_id>', methods=['GET'])
def export_suggestions(resume_id):
    """Export suggestions as a structured report"""
    try:
        resume = Resume.query.get(resume_id)
        if not resume:
            return jsonify({'error': 'Resume not found'}), 404
        
        suggestions = ImprovementSuggestion.query.filter_by(resume_id=resume_id).all()
        
        if not suggestions:
            return jsonify({'error': 'No suggestions found'}), 404
        
        # Group suggestions by category
        categorized_suggestions = {}
        for suggestion in suggestions:
            category = suggestion.category
            if category not in categorized_suggestions:
                categorized_suggestions[category] = []
            categorized_suggestions[category].append(suggestion.to_dict())
        
        # Create export data
        export_data = {
            'resume_info': {
                'id': resume.id,
                'filename': resume.filename,
                'ats_score': resume.ats_score,
                'created_at': resume.created_at.isoformat() if resume.created_at else None
            },
            'suggestions_summary': {
                'total_suggestions': len(suggestions),
                'by_category': {
                    category: len(suggestions_list) 
                    for category, suggestions_list in categorized_suggestions.items()
                },
                'by_priority': {
                    'high': len([s for s in suggestions if s.priority == 'high']),
                    'medium': len([s for s in suggestions if s.priority == 'medium']),
                    'low': len([s for s in suggestions if s.priority == 'low'])
                },
                'implementation_status': {
                    'implemented': len([s for s in suggestions if s.is_implemented]),
                    'pending': len([s for s in suggestions if not s.is_implemented])
                }
            },
            'categorized_suggestions': categorized_suggestions,
            'export_timestamp': db.func.now()
        }
        
        return jsonify(export_data), 200
        
    except Exception as e:
        return jsonify({'error': f'Error exporting suggestions: {str(e)}'}), 500

