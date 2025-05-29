@echo off
setlocal enabledelayedexpansion

set PYTHON_SCRIPT=%~dp0extract_and_store.py
set PYTHON_EXEC=python

set PDF_PATH=%1
set PROJECT=%2
set SENDER=%3

%PYTHON_EXEC% "%PYTHON_SCRIPT%" "%PDF_PATH%" "%PROJECT%" "%SENDER%"

endlocal