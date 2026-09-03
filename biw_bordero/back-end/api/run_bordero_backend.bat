@echo off
echo Iniciando servidor Node.js...
echo Log salvo em: server_log.txt
echo ========================================== >> server_log.txt
echo Log iniciado em: %date% %time% >> server_log.txt
echo ========================================== >> server_log.txt

node server.js >> server_log.txt 2>&1

echo.
echo Servidor finalizado. Log salvo em server_log.txt
pause