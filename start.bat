@echo off
start "Backend" cmd /k "cd /d C:\Users\tiwar\Desktop\uttamcv\backend && python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 3
start "Frontend" cmd /k "cd /d C:\Users\tiwar\Desktop\uttamcv\frontend && npm start"