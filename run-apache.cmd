@echo off
setlocal enableextensions enabledelayedexpansion 

set ServerRoot=%USERPROFILE%\Downloads\httpd-2.4.37-win64-VC15\Apache24
set ModulesDir=%ServerRoot%\modules
set InstanceRoot=%~dp0.
set ErrorLog=%InstanceRoot%\logs\error.log
set ApplicationHost=%COMPUTERNAME%
if /I "%ApplicationHost%" equ "ubi-25" set ApplicationHost=ubi-62

if not exist "%InstanceRoot%\logs" (
    mkdir "%InstanceRoot%\logs"
)
if exist "%ErrorLog%" (
    del /f/q "%ErrorLog%"
)

"%ServerRoot%\bin\httpd.exe" -w -X -d "%ServerRoot%" -f "%InstanceRoot%\conf\httpd.conf" -E "%ErrorLog%" -DWindows %*
