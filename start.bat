@echo off
echo Doküman NLP Platformu Başlatılıyor...
echo.

echo 1. Bağımlılıklar yükleniyor...
call npm run install-all

echo.
echo 2. Uygulama başlatılıyor...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.

call npm run dev

pause 