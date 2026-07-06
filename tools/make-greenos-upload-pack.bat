@echo off
chcp 65001 >nul
setlocal

REM Quick upload pack for GreenOS + updated assets (run on your PC).
REM 1) Install FileZilla or use cPanel File Manager -> Upload
REM 2) Upload everything inside the "upload-pack" folder to public_html (merge/replace)

set ROOT=%~dp0..
set OUT=%~dp0upload-pack

if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"
mkdir "%OUT%\assets\js"
mkdir "%OUT%\assets\css"

copy /Y "%ROOT%\greenos.html" "%OUT%\"
copy /Y "%ROOT%\greenos-dashboard.html" "%OUT%\"
copy /Y "%ROOT%\assets\js\greenos.js" "%OUT%\assets\js\"
copy /Y "%ROOT%\assets\js\greenos-config.js" "%OUT%\assets\js\"
copy /Y "%ROOT%\assets\css\styles.css" "%OUT%\assets\css\"

echo.
echo Created: %OUT%
echo Upload this folder contents into public_html in cPanel File Manager.
echo.
pause
