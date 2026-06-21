import pytest
from unittest.mock import MagicMock, patch
from app.services.email_service import send_invite_email
from app.config import settings

def test_send_invite_email_success():
    with patch("smtplib.SMTP") as mock_smtp:
        mock_server = MagicMock()
        mock_smtp.return_value = mock_server
        
        to_email = "collaborator@example.com"
        project_name = "Super Project"
        inviter_username = "owner_user"
        
        success = send_invite_email(to_email, project_name, inviter_username)
        
        assert success is True
        mock_smtp.assert_called_once_with("smtp.gmail.com", 587, timeout=10)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with(settings.GMAIL_ADDRESS, settings.GMAIL_APP_PASSWORD)
        mock_server.sendmail.assert_called_once()
        mock_server.quit.assert_called_once()

def test_send_invite_email_failure():
    with patch("smtplib.SMTP") as mock_smtp:
        mock_smtp.side_effect = Exception("SMTP connection error")
        
        success = send_invite_email("collaborator@example.com", "Super Project", "owner_user")
        
        assert success is False
