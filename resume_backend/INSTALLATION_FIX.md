# 🔧 Installation Fix for Python 3.9

## ❌ **Issues You Encountered:**

1. **Path Error:** You're already in `resume_backend`, don't `cd resume_backend` again
2. **Build Error:** `blis` package needs Microsoft Visual C++ Build Tools

## ✅ **Quick Fix Steps:**

### **1. Install Only Essential Packages First:**
```bash
# You're already in resume_backend folder, so just run:
pip install PyMySQL==1.0.2 cryptography==3.4.8 PyJWT==2.6.0 python-dotenv==1.0.0 Flask==3.1.1 Flask-SQLAlchemy==3.1.1 flask-cors==6.0.0
```

### **2. Test MySQL Connection:**
```bash
python setup_mysql.py
```

### **3. If Setup Script Fails, Use Manual SQL:**
```bash
mysql -u root -p
```

Then paste these SQL commands:
```sql
CREATE DATABASE IF NOT EXISTS interview_app_users 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE interview_app_users;

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
```

### **4. Create .env File:**
Create a `.env` file in `resume_backend` folder:
```bash
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=Sudharshan@1748
MYSQL_DATABASE=interview_app_users
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### **5. Start Backend:**
```bash
python src/main.py
```

## 🚀 **Alternative: Skip Problematic Packages**

If you want to skip the heavy NLP packages for now, create a minimal requirements file:

**Create `requirements_minimal.txt`:**
```
Flask==3.1.1
Flask-SQLAlchemy==3.1.1
PyMySQL==1.0.2
PyJWT==2.6.0
cryptography==3.4.8
python-dotenv==1.0.0
flask-cors==6.0.0
```

**Install minimal version:**
```bash
pip install -r requirements_minimal.txt
```

## 🔍 **Test the Setup:**

**Check if MySQL database was created:**
```bash
mysql -u root -p
SHOW DATABASES;
USE interview_app_users;
SHOW TABLES;
```

**Test the backend:**
```bash
python src/main.py
```

You should see the Flask server starting without errors.

## 🎯 **What This Gives You:**

✅ **MySQL + JWT Authentication** - User accounts stored in MySQL
✅ **SQLite for Resume Data** - Resume features unchanged  
✅ **No Auto-Login** - Users must authenticate each session
✅ **Professional Setup** - Industry-standard authentication

**🎉 This gets you working with MySQL + JWT without the heavy NLP dependencies!**
