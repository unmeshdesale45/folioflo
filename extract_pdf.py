import sys
try:
    import fitz # PyMuPDF
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pymupdf"])
    import fitz

doc = fitz.open("ResearchHub_ProjectDevelopment_FINAL.pdf")
text = ""
for page in doc:
    text += page.get_text()

with open("pdf_content.md", "w", encoding="utf-8") as out:
    out.write(text)
