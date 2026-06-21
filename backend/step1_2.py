import sqlite3
conn = sqlite3.connect('researchhub.db')
c = conn.cursor()
try:
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print('ALL TABLES:', c.fetchall())
    c.execute('SELECT * FROM projects')
    print('ALL PROJECTS:', c.fetchall())
    c.execute('SELECT * FROM project_members')
    print('ALL MEMBERS:', c.fetchall())
except Exception as e:
    print('Error:', e)
conn.close()
