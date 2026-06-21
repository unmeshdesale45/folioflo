import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, HRFlowable
import json
from bs4 import BeautifulSoup

def strip_html_tags(html_content: str) -> str:
    """Converts HTML to plain text for ReportLab."""
    if not html_content:
        return ""
    soup = BeautifulSoup(html_content, "html.parser")
    return soup.get_text(separator="\n")

def generate_project_pdf(project, papers, note, documents):
    buffer = io.BytesIO()
    
    # Setup document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Styles matching user request
    # Helvetica is standard
    style_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=20,
        alignment=1 # Center
    )
    
    style_logo = ParagraphStyle(
        'LogoText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=150,
        alignment=1
    )
    
    style_desc = ParagraphStyle(
        'CoverDesc',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=14,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=200,
        alignment=1
    )
    
    style_date = ParagraphStyle(
        'CoverDate',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#6B7280'),
        alignment=1
    )
    
    style_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        textColor=colors.HexColor('#2563EB'),
        spaceAfter=15,
        spaceBefore=20
    )
    
    style_paper_title = ParagraphStyle(
        'PaperTitle',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=5
    )
    
    style_body = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor('#1F2937'),
        spaceAfter=10,
        leading=16
    )
    
    style_meta = ParagraphStyle(
        'MetaData',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#4B5563'),
        spaceAfter=10
    )
    
    story = []
    
    # ==========================================
    # PAGE 1 - COVER PAGE
    # ==========================================
    story.append(Spacer(1, 1 * inch))
    story.append(Paragraph("ResearchHub", style_logo))
    story.append(Paragraph(project.name, style_title))
    if project.description:
        story.append(Paragraph(project.description, style_desc))
    else:
        story.append(Spacer(1, 200))
        
    date_str = datetime.now().strftime("%B %d, %Y")
    story.append(Paragraph(f"Generated on: {date_str}", style_date))
    story.append(PageBreak())
    
    # ==========================================
    # PAGE 2 - RESEARCH PAPERS
    # ==========================================
    story.append(Paragraph("<u>Research Papers</u>", style_heading))
    
    if not papers:
        story.append(Paragraph("No papers attached to this project.", style_body))
    else:
        for p in papers:
            story.append(Paragraph(p["title"], style_paper_title))
            authors_str = ", ".join(p["authors"]) if p["authors"] else "Unknown Authors"
            year = ""
            if p["published_date"]:
                year = p["published_date"].split("-")[0]
            
            meta_str = f"{authors_str} | {year} | {p['source'].upper()}"
            story.append(Paragraph(meta_str, style_meta))
            
            if p["ai_summary"]:
                story.append(Paragraph(p["ai_summary"], style_body))
            elif p["abstract"]:
                story.append(Paragraph(p["abstract"], style_body))
                
            story.append(Spacer(1, 10))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E5E7EB'), spaceAfter=15))
            
    story.append(PageBreak())
    
    # ==========================================
    # PAGE 4 - NOTES
    # ==========================================
    story.append(Paragraph("<u>Project Notes</u>", style_heading))
    if note and note.content and note.content.strip():
        # Remove HTML tags if it has rich text
        clean_note = strip_html_tags(note.content)
        # Using simple lines 
        for line in clean_note.split("\n"):
            if line.strip():
                story.append(Paragraph(line.strip(), style_body))
    else:
        story.append(Paragraph("No notes added to this project.", style_body))
        
    story.append(PageBreak())
    
    # ==========================================
    # PAGE 5+ - DOCUMENTS
    # ==========================================
    if not documents:
        story.append(Paragraph("<u>Project Documents</u>", style_heading))
        story.append(Paragraph("No documents in this project.", style_body))
    else:
        for idx, doc_obj in enumerate(documents):
            story.append(Paragraph(f"<u>{doc_obj.title}</u>", style_heading))
            if doc_obj.content:
                clean_doc = strip_html_tags(doc_obj.content)
                for line in clean_doc.split("\n"):
                    if line.strip():
                        story.append(Paragraph(line.strip(), style_body))
            if idx < len(documents) - 1:
                story.append(PageBreak())
                
    # Add page numbers
    def add_page_number(canvas, doc):
        page_num = canvas.getPageNumber()
        if page_num > 1:
            text = f"Page {page_num}"
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor('#6B7280'))
            canvas.drawCentredString(letter[0] / 2.0, 0.5 * inch, text)
            canvas.restoreState()

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    
    buffer.seek(0)
    return buffer
