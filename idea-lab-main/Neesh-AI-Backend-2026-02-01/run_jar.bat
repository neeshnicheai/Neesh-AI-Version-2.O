@echo off
setlocal enabledelayedexpansion

echo Loading environment variables from .env...
echo.

REM Parse .env file - skip comments and empty lines
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "key=%%a"
    set "value=%%b"
    REM Skip lines starting with #
    if not "!key:~0,1!"=="#" (
        if not "!key!"=="" if not "!value!"=="" (
            set "!key!=!value!"
            echo Set !key!
        )
    )
)

echo.
echo Starting Neesh AI Backend (JAR)...
echo Backend URL: http://localhost:8081
echo.

java -jar target/backend-0.0.1-SNAPSHOT.jar
