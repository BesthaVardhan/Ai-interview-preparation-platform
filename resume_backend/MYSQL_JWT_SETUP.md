# 🗄️ MySQL + JWT Authentication Setup Guide

## 🎯 **Overview**
This guide helps you set up MySQL for user authentication with JWT tokens while keeping SQLite for resume data.

## 📋 **Prerequisites**

### **1. Install MySQL Server**
- **Windows:** Download from [MySQL官网](https://dev.mysql.com/downloads/mysql/)
- **macOS:** `brew install mysql`
- **Ubuntu:** `sudo apt-get install mysql-server`

### **2. Install Python MySQL Connector**
```bash
pip install mysql-connector-python
```

## 🔧 **Setup Steps**

### **Step 1: Configure Environment Variables**

Create or update your `.env` file:
```bash
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=interview_app_users

# JWT Secret Key (change this in production!)
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### **Step 2: Install Python Dependencies**
```bash
cd resume_backend
pip install -r requirements.txt
```

### **Step 3: Create MySQL Database**
```bash
python setup_mysql.py
```

This script will:
- ✅ Create the database `interview_app_users`
- ✅ Create the `users` table
- ✅ Create a sample admin user
- ✅ Test the connection

### **Step 4: Update Frontend for JWT**

Update your frontend login to use JWT endpoints:

**Register User:**
```javascript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123"
}
```

**Login:**
```javascript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 🏗️ **Database Architecture**

### **MySQL (User Authentication)**
- **Purpose:** User accounts, authentication, JWT tokens
- **Database:** `interview_app_users`
- **Table:** `users`

### **SQLite (Resume Data)**
- **Purpose:** Resume analysis, job recommendations
- **Database:** `app.db` (unchanged)
- **Tables:** `resumes`, `job_recommendations`, `improvement_suggestions`

## 🔐 **JWT Authentication Features**

### **Security Features:**
- ✅ **Password hashing** with Werkzeug
- ✅ **Account lockout** after 5 failed attempts
- ✅ **JWT tokens** with expiration
- ✅ **Token verification** middleware
- ✅ **Password change** functionality

### **Authentication Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/logout` - Logout (client-side)
- `POST /api/auth/verify-token` - Verify token validity

## 🚀 **Usage Examples**

### **Frontend Integration:**
```javascript
// Login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  } else {
    throw new Error(data.error);
  }
};

// Protected API call
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

## 🔍 **Database Schema**

### **MySQL Users Table:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL
);
```

## 🛠️ **Testing**

### **Test the Setup:**
1. **Start the backend:** `python src/main.py`
2. **Register a user:** Use the register endpoint
3. **Login:** Use the login endpoint
4. **Access protected routes:** Use JWT token

### **Sample cURL Commands:**
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## 🎉 **Benefits**

### **✅ Security Improvements:**
- No more localStorage passwords
- Secure JWT authentication
- Account lockout protection
- Password hashing

### **✅ Scalability:**
- MySQL handles concurrent users better
- Separate databases for different purposes
- Better performance for authentication

### **✅ Professional Setup:**
- Industry-standard authentication
- JWT tokens for API security
- Proper database architecture

## 🔧 **Troubleshooting**

### **Common Issues:**
1. **Connection refused:** Check MySQL server is running
2. **Access denied:** Verify MySQL credentials
3. **Database doesn't exist:** Run setup script
4. **Token invalid:** Check JWT secret key

### **Debug Commands:**
```bash
# Check MySQL status
sudo systemctl status mysql

# Connect to MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Show tables
USE interview_app_users;
SHOW TABLES;
```

**🎉 Your MySQL + JWT authentication is now ready!**
