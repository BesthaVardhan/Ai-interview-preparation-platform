
#!/usr/bin/env python3
"""
MySQL Database Setup Script for Interview App
Creates the MySQL database and users table.
Does not create a default admin account.
"""

import os
import re
import pymysql
from pymysql import Error
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()


def get_database_config():
    """Read database settings from environment variables."""
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": os.getenv("MYSQL_DATABASE", "interview_app_users")
    }


def create_database():
    """Create the database and users table."""
    connection = None
    cursor = None

    try:
        config = get_database_config()
        db_name = config["database"]

        # Validate database name before using it in SQL.
        if not re.fullmatch(r"[A-Za-z0-9_]+", db_name):
            raise ValueError("Invalid database name in MYSQL_DATABASE")

        connection = pymysql.connect(
            host=config["host"],
            user=config["user"],
            password=config["password"]
        )

        cursor = connection.cursor()

        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )

        cursor.execute(f"USE `{db_name}`")

        create_table_query = """
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
          COLLATE=utf8mb4_unicode_ci
        """

        cursor.execute(create_table_query)
        connection.commit()

        print("Database and users table created or already exist.")
        print("No default admin account was created.")

        return True

    except (Error, ValueError) as error:
        print(f"Database setup failed: {error}")
        return False

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("MySQL connection closed.")


def test_connection():
    """Test the MySQL database connection."""
    connection = None
    cursor = None

    try:
        config = get_database_config()

        connection = pymysql.connect(
            host=config["host"],
            user=config["user"],
            password=config["password"],
            database=config["database"]
        )

        cursor = connection.cursor()

        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        print(f"Successfully connected to database: {db_name}")

        cursor.execute("SHOW TABLES LIKE 'users'")

        if cursor.fetchone():
            print("Users table exists.")

            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            print(f"Current user count: {user_count}")
        else:
            print("Users table does not exist.")
            return False

        return True

    except Error as error:
        print(f"Connection test failed: {error}")
        return False

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


if __name__ == "__main__":
    print("MySQL Database Setup for Interview App")
    print("---------------------------------------")

    required_vars = [
        "MYSQL_HOST",
        "MYSQL_USER",
        "MYSQL_DATABASE"
    ]

    missing_vars = [
        variable for variable in required_vars
        if not os.getenv(variable)
    ]

    if missing_vars:
        print("Missing environment variables:", ", ".join(missing_vars))
        print("Please check your .env file.")
        raise SystemExit(1)

    print("Host:", os.getenv("MYSQL_HOST"))
    print("User:", os.getenv("MYSQL_USER"))
    print("Database:", os.getenv("MYSQL_DATABASE"))

    if create_database():
        print("\nTesting database connection...")
        test_connection()
    else:
        raise SystemExit(1)
