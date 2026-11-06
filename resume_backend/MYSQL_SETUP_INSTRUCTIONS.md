# MySQL Database Setup Instructions

## Method 1: Using MySQL Command Line

1. **Open MySQL Command Line:**
   ```bash
   mysql -u root -p
   ```

2. **Create Database:**
   ```sql
   CREATE DATABASE IF NOT EXISTS resume_db;
   USE resume_db;
   ```

3. **Run the SQL Script:**
   ```sql
   -- Copy and paste the contents of recruitment_tables.sql
   SOURCE recruitment_tables.sql;
   ```

## Method 2: Using MySQL Workbench

1. **Open MySQL Workbench**
2. **Connect to your MySQL server**
3. **Create new schema:**
   - Schema name: `resume_db`
4. **Execute the SQL script:**
   - Open `recruitment_tables.sql`
   - Execute all queries

## Method 3: Update Python Script

1. **Edit setup_mysql_clean.py:**
   ```python
   connection = pymysql.connect(
       host='localhost',
       user='your_username',      # Change this
       password='your_password',   # Change this
       database='resume_db'
   )
   ```

2. **Run the script:**
   ```bash
   python setup_mysql_clean.py
   ```

## What Gets Created

### Tables:
1. **aptitude_tests** - Store aptitude test results
2. **group_discussions** - Store GD evaluation results
3. **hr_interviews** - Store HR interview results
4. **candidate_profiles** - Store candidate information
5. **recruitment_pipelines** - Track recruitment stages

### Features:
- ✅ Complete MySQL storage for all recruitment data
- ✅ JSON fields for flexible data storage
- ✅ Foreign key relationships
- ✅ Automatic timestamps
- ✅ Score calculations

## Verification

After setup, verify tables exist:
```sql
USE resume_db;
SHOW TABLES;
DESCRIBE aptitude_tests;
DESCRIBE group_discussions;
DESCRIBE hr_interviews;
DESCRIBE candidate_profiles;
DESCRIBE recruitment_pipelines;
```

## Next Steps

1. **Start your Flask backend:**
   ```bash
   python src/main.py
   ```

2. **Test the APIs:**
   - POST /api/recruitment/aptitude/submit
   - POST /api/recruitment/gd/submit
   - POST /api/recruitment/hr-interview/submit
   - POST /api/recruitment/profile

3. **Use the frontend:**
   - Navigate to http://localhost:5173
   - Test recruitment features
