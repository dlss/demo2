@ECHO OFF
set en_suffix=_encrypt

For /f "eol=# tokens=1* delims=:" %%i in (encryptinfo.txt) do (
If "%%i"=="key" set key=%%j
If "%%i"=="iv" set iv=%%j
If "%%i"=="method" set alt=%%j
If "%%i"=="encrypttool" set encryptTool=%%j
)

setlocal EnableDelayedExpansion
for /f "eol=#" %%i in (encryptlist.txt) do (
	set path=%cd%\%%i
	SET FileAttrib=%%~ai 
	if exist "!path!" (
		if "!FileAttrib:~0,1!"=="d" (
			call:folder "!path!"
		) else (
			if exist "!path!%en_suffix%" (
				echo decrypt "!path!%en_suffix%"
			    %encryptTool% -1 -de -f "!path!%en_suffix%" -t %alt% -key !key! -iv !iv! -o "!path!" -ver 0
			)
		)
	) else echo not exist "!path!"
)
goto :eof

:folder
for /R %1 %%a in (*) do (
	if exist "%%a%en_suffix%" (
		echo decrypt "%%a%en_suffix%"
		%encryptTool% -1 -de -f "%%a%en_suffix%" -t %alt% -key !key! -iv !iv! -o "%%a" -ver 0
	)
)

:eof
setlocal DisableDelayedExpansion