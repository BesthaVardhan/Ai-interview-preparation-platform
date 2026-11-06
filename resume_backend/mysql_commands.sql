-- MySQL Database Setup Commands
-- Run these commands in MySQL to create the database and user table

-- 1. Create the database
CREATE DATABASE IF NOT EXISTS interview_app_users 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 2. Switch to the created database
USE interview_app_users;

-- 3. Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. (Optional) Create a sample admin user
-- Note: This uses a temporary hash. The Python app will handle proper password hashing
INSERT IGNORE INTO users (username, email, password_hash, name) 
VALUES ('admin', 'admin@example.com', 'temp_hash', 'Admin User');

-- 5. Verify the setup
SELECT DATABASE() as current_database;
SHOW TABLES;
DESCRIBE users;
SELECT COUNT(*) as user_count FROM users;
