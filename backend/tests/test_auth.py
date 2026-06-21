import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post(
        "/api/auth/register",
        json={"username": "test_user", "email": "test@example.com", "password": "testpassword", "full_name": "Test User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "login_user", "email": "login@example.com", "password": "loginpassword"}
    )
    
    response = await client.post(
        "/api/auth/login",
        data={"username": "login@example.com", "password": "loginpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_read_users_me(client: AsyncClient):
    await client.post(
        "/api/auth/register",
        json={"username": "me_user", "email": "me@example.com", "password": "mypassword"}
    )
    login_response = await client.post(
        "/api/auth/login",
        data={"username": "me@example.com", "password": "mypassword"}
    )
    token = login_response.json()["access_token"]
    
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@example.com"
