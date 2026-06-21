@echo off
rem Opens a new terminal window for the backend:
cd "f:\Project Impl\Project Impl\backend"
call .\venv\Scripts\activate
start cmd /k "cd /d f:\Project Impl\Project Impl\backend && .\venv\Scripts\activate && uvicorn app.main:app --reload"

rem Opens a second new terminal window for the frontend:
start cmd /k "cd /d f:\Project Impl\Project Impl\frontend && npm run dev"

rem Waits 4 seconds then opens http://localhost:5173 in the default browser automatically:
timeout /t 4
start http://localhost:5173
