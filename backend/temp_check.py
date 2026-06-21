import sqlite3
conn = sqlite3.connect('researchhub.db')
c = conn.cursor()
try:
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print('Tables:', c.fetchall())
except Exception as e:
    print('Error on tables:', e)

try:
    c.execute("SELECT * FROM projects LIMIT 5")
    print('Projects:', c.fetchall())
except Exception as e:
    print('Error on projects:', e)

conn.close()
