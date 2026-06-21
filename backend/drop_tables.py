import sqlite3
conn = sqlite3.connect('researchhub.db')
cursor = conn.cursor()
cursor.execute('DROP TABLE IF EXISTS project_papers;')
cursor.execute('DROP TABLE IF EXISTS project_documents;')
cursor.execute('DROP TABLE IF EXISTS project_notes;')
cursor.execute('DROP TABLE IF EXISTS projects;')
conn.commit()
print("Dropped successfully")
