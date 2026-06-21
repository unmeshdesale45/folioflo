import sqlite3
import sys
try:
    conn = sqlite3.connect('researchhub.db')
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()
    print("TABLES:", tables)
except Exception as e:
    print(e)
