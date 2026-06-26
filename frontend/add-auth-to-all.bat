@echo off
echo Adding auth-manager.js to all pages...

REM Add to about.html
powershell -Command "(gc 'pages\about.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\about.html'"
powershell -Command "(gc 'pages\about.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\about.html'"

REM Add to materials.html
powershell -Command "(gc 'pages\materials.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\materials.html'"
powershell -Command "(gc 'pages\materials.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\materials.html'"

REM Add to community.html
powershell -Command "(gc 'pages\community.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\community.html'"
powershell -Command "(gc 'pages\community.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\community.html'"

REM Add to resources.html
powershell -Command "(gc 'pages\resources.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\resources.html'"
powershell -Command "(gc 'pages\resources.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\resources.html'"

REM Add to get-started.html
powershell -Command "(gc 'pages\get-started.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\get-started.html'"
powershell -Command "(gc 'pages\get-started.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\get-started.html'"

REM Add to index-dashboard.html
powershell -Command "(gc 'pages\index-dashboard.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\index-dashboard.html'"
powershell -Command "(gc 'pages\index-dashboard.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\index-dashboard.html'"

REM Add to KnowNook.html
powershell -Command "(gc 'pages\KnowNook.html') -replace '    <script src=\"../assets/js/script.js\"></script>', '    <script src=\"../assets/js/auth-manager.js\"></script>$([Environment]::NewLine)    <script src=\"../assets/js/script.js\"></script>' | Set-Content 'pages\KnowNook.html'"
powershell -Command "(gc 'pages\KnowNook.html') -replace '<a href=\"login.html\" class=\"btn btn-primary btn-sm\">Login</a>', '<a href=\"login.html\" class=\"btn btn-primary btn-sm login-btn\">Login</a>' | Set-Content 'pages\KnowNook.html'"

echo Done! Auth-manager added to all pages.
pause
