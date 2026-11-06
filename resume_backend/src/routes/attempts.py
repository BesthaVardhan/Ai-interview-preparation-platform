from flask import Blueprint, request, jsonify
from datetime import datetime
from src.models.user import db
from src.models.attempt import Attempt


attempts_bp = Blueprint('attempts', __name__)


@attempts_bp.route('', methods=['POST'])
@attempts_bp.route('/', methods=['POST'])
def create_attempt():
    try:
        data = request.get_json() or {}
        user_email = data.get('user_email')
        step_id = data.get('step_id')
        score = data.get('score')
        feedback = data.get('feedback')
        strengths = data.get('strengths') or []
        improvements = data.get('improvements') or []
        completed_at_str = data.get('completed_at')

        if not user_email or not step_id or score is None:
            return jsonify({'error': 'user_email, step_id and score are required'}), 400

        completed_at = None
        if completed_at_str:
            try:
                completed_at = datetime.fromisoformat(completed_at_str.replace('Z', '+00:00'))
            except Exception:
                completed_at = datetime.utcnow()

        attempt = Attempt(
            user_email=user_email,
            step_id=step_id,
            score=score,
            feedback=feedback,
            strengths=strengths,
            improvements=improvements,
            completed_at=completed_at,
        )
        db.session.add(attempt)
        db.session.commit()

        return jsonify({'message': 'Attempt saved', 'attempt': attempt.to_dict()}), 201
    except Exception as e:
        return jsonify({'error': f'Error saving attempt: {str(e)}'}), 500


@attempts_bp.route('/<user_email>', methods=['GET'])
def list_attempts(user_email):
    try:
        attempts = Attempt.query.filter_by(user_email=user_email).order_by(Attempt.completed_at.desc()).all()
        return jsonify({'attempts': [a.to_dict() for a in attempts]}), 200
    except Exception as e:
        return jsonify({'error': f'Error fetching attempts: {str(e)}'}), 500



