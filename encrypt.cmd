@ECHO OFF
set filepath=%cd%\senarioes\data\

For /f "tokens=1* delims=:" %%i in ('Type encryptinfo.txt^|Findstr /n ".*"') do (
If "%%i"=="1" set key=%%j
If "%%i"=="2" set iv=%%j
If "%%i"=="3" set alt=%%j
If "%%i"=="4" set encryptTool=%%j
)

ECHO %encryptTool% -1 -en -f "%filepath%sensitiveData.js" -t %alt% -key %key% -iv %iv% -o "%filepath%sensitiveData_Encrypt.js"
%encryptTool% -1 -en -f "%filepath%sensitiveData.js" -t %alt% -key %key% -iv %iv% -o "%filepath%sensitiveData_Encrypt.js"