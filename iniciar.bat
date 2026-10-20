@echo off
chcp 65001 >nul
title Proformas Instalaciones - Backend y Frontend
cd /d "%~dp0"
node start.mjs
pause
