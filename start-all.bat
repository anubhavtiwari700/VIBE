@echo off
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npm run dev"
echo Both servers are starting... Follow the instructions in the new windows.
pause
