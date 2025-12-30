@echo off
echo.
echo ========================================
echo   Validador de Tiquetes - Baloto
echo ========================================
echo.
echo Iniciando servidor...
echo.
echo Cuando veas el mensaje de exito:
echo 1. Abre tu navegador
echo 2. Ve a http://localhost:3000
echo 3. Usa la aplicacion!
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

cd /d "%~dp0.."
npm start
pause
