#!/usr/bin/env python3
"""
Database migration script for adding liked/disliked columns
"""

from app.db.connection import get_database_connection


def main():
    print("Starting database migration...")
    try:
        conn = get_database_connection()
        conn.create_tables()
        print("✅ Database tables created/updated successfully")
        print("✅ liked/disliked columns should now be available")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return 1
    return 0


if __name__ == "__main__":
    exit(main())
