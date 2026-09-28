@echo off
title TERRA-GUARD Platform
echo ========================================================
echo Starting TERRA-GUARD Combined Frontend ^& Backend Platform
echo ========================================================
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" run.py %*
) else (
    python run.py %*
)
pause
