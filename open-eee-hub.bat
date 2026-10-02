@echo off
setlocal
set "EEE_HUB_URL=%EEE_HUB_URL%"
if not defined EEE_HUB_URL set /p "EEE_HUB_URL=Enter the hosted EEE Hub URL: "
if not defined EEE_HUB_URL (
	echo A hosted EEE Hub URL is required.
	pause
	exit /b 1
)
start "" "%EEE_HUB_URL%"
endlocal
