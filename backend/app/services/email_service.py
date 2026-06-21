import smtplib
from email.mime.text import MIMEText
from app.config import settings

def send_invite_email(to_email: str, project_name: str, inviter_username: str) -> bool:
    """
    Sends an invitation email to the invited user via Gmail SMTP.
    
    If sending fails for any reason, the exception is caught, logged/printed, and
    False is returned. It will not block or fail the caller.
    """
    gmail_address = settings.GMAIL_ADDRESS
    gmail_password = settings.GMAIL_APP_PASSWORD

    if not gmail_address or not gmail_password:
        print("ERROR: Gmail credentials not configured in environment/settings.")
        return False

    # Email content
    subject = "You've been invited to a project on FolioFlo"
    body = (
        f"Hi,\n\n"
        f"{inviter_username} has invited you to collaborate on the project '{project_name}' on FolioFlo.\n\n"
        f"Please log in to FolioFlo to view the project.\n\n"
        f"Best regards,\n"
        f"The FolioFlo Team"
    )

    # Prepare message
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = gmail_address
    msg["To"] = to_email

    try:
        # Connect to smtp.gmail.com on port 587 with timeout
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(gmail_address, gmail_password)
        server.sendmail(gmail_address, [to_email], msg.as_string())
        server.quit()
        print(f"Successfully sent invitation email to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email} due to error: {e}")
        import traceback
        traceback.print_exc()
        return False
