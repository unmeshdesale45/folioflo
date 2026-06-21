import pytest
from httpx import AsyncClient
from unittest.mock import patch

@pytest.mark.asyncio
async def test_project_crud(client: AsyncClient):
    # Register & Login to get token
    await client.post(
        "/api/auth/register",
        json={"username": "owner_user", "email": "owner@example.com", "password": "password123", "full_name": "Owner User"}
    )
    login_resp = await client.post(
        "/api/auth/login",
        data={"username": "owner@example.com", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Project
    response = await client.post(
        "/api/projects/",
        json={"name": "Test Project", "description": "Test Desc"},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    project_id = data["id"]
    
    # 2. Get Projects List
    response = await client.get("/api/projects/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1
    
    # 3. Get Single Project
    response = await client.get(f"/api/projects/{project_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Project"
    assert "papers" in data
    assert "documents" in data
    
    # 4. Update Project
    response = await client.put(
        f"/api/projects/{project_id}",
        json={"name": "Updated Project"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Project"
    
    # 5. Add Note
    response = await client.put(
        f"/api/projects/{project_id}/notes/",
        json={"content": "My Note"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["content"] == "My Note"
    
    # 6. Add Document
    response = await client.post(
        f"/api/projects/{project_id}/documents/",
        json={"title": "Doc1", "content": "Content1"},
        headers=headers
    )
    assert response.status_code == 200
    doc_id = response.json()["id"]
    
    # 7. Update Document
    response = await client.put(
        f"/api/projects/{project_id}/documents/{doc_id}",
        json={"title": "Updated Doc"},
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Doc"
    
    # 8. Delete Document
    response = await client.delete(f"/api/projects/{project_id}/documents/{doc_id}", headers=headers)
    assert response.status_code == 200
    
    # 9. Delete Project
    response = await client.delete(f"/api/projects/{project_id}", headers=headers)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_project_member_invite(client: AsyncClient):
    # Register Owner
    await client.post(
        "/api/auth/register",
        json={"username": "owner_user", "email": "owner@example.com", "password": "password123", "full_name": "Owner User"}
    )
    login_resp = await client.post(
        "/api/auth/login",
        data={"username": "owner@example.com", "password": "password123"}
    )
    owner_token = login_resp.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    
    # Register Collaborator to invite (must have account first)
    await client.post(
        "/api/auth/register",
        json={"username": "collab_user", "email": "collab@example.com", "password": "password456", "full_name": "Collab User"}
    )
    
    # Create Project
    proj_resp = await client.post(
        "/api/projects/",
        json={"name": "Collaborative Project", "description": "Desc"},
        headers=owner_headers
    )
    assert proj_resp.status_code == 200
    project_id = proj_resp.json()["id"]
    
    # Invite collaborator (mocking send_invite_email to return True)
    with patch("app.routers.project.send_invite_email") as mock_send_email:
        mock_send_email.return_value = True
        
        invite_resp = await client.post(
            f"/api/projects/{project_id}/members/",
            json={"email": "collab@example.com", "role": "collaborator"},
            headers=owner_headers
        )
        
        assert invite_resp.status_code == 200
        mock_send_email.assert_called_once_with(
            to_email="collab@example.com",
            project_name="Collaborative Project",
            inviter_username="owner_user"
        )
        
    # Invite another collaborator (mocking send_invite_email to throw exception)
    # Register another collaborator
    await client.post(
        "/api/auth/register",
        json={"username": "collab_user_2", "email": "collab2@example.com", "password": "password456", "full_name": "Collab User 2"}
    )
    
    with patch("app.routers.project.send_invite_email") as mock_send_email:
        mock_send_email.side_effect = Exception("SMTP error")
        
        invite_resp = await client.post(
            f"/api/projects/{project_id}/members/",
            json={"email": "collab2@example.com", "role": "collaborator"},
            headers=owner_headers
        )
        
        # The request should still succeed!
        assert invite_resp.status_code == 200
        mock_send_email.assert_called_once_with(
            to_email="collab2@example.com",
            project_name="Collaborative Project",
            inviter_username="owner_user"
        )
