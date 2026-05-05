@echo off
chcp 65001 > nul
title 春日手语园 · 本地服务器
cd /d "%~dp0"
echo.
echo  ✿ 春日手语园 · 启动中...
echo.
node server\server.mjs
echo.
echo  服务已退出。按任意键关闭窗口...
pause > nul
