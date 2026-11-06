
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os

# Import unified database instance
from src.config.database_unified import db


def get_jwt_secret():
    """Get JWT secret from environment variables."""
    secret_key = os.getenv('JWT_SECRET_KEY')

    if not secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing from environment variables"
        )

    return secret_key


class User(db.Model):
    __bind_key__ = 'mysql'
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime)

    def set_password(self, password):
        """Hash and set password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Check if password matches."""
        return check_password_hash(self.password_hash, password)

    def is_locked(self):
        """Check if account is locked."""
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False

    def lock_account(self, hours=24):
        """Lock account for specified hours."""
        self.locked_until = datetime.utcnow() + timedelta(hours=hours)
        self.login_attempts = 0

    def reset_login_attempts(self):
        """Reset failed login attempts."""
        self.login_attempts = 0
        self.last_login = datetime.utcnow()

    def increment_login_attempts(self):
        """Increment failed login attempts."""
        self.login_attempts += 1
        if self.login_attempts >= 5:
            self.lock_account()

    def generate_jwt(self, expires_in_hours=24):
        """Generate JWT token."""
        payload = {
            'user_id': self.id,
            'email': self.email,
            'username': self.username,
            'name': self.name,
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iat': datetime.utcnow()
        }

        secret_key = get_jwt_secret()
        return jwt.encode(payload, secret_key, algorithm='HS256')

    @staticmethod
    def verify_jwt(token):
        """Verify JWT token and return user data."""
        try:
            secret_key = get_jwt_secret()
            payload = jwt.decode(
                token,
                secret_key,
                algorithms=['HS256']
            )
            return payload

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def to_dict(self):
        """Convert user to dictionary (excluding sensitive data)."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'name': self.name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.username} ({self.email})>'
