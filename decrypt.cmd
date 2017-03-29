@ECHO OFF
set en_suffix=_encrypt

For /f "eol=# tokens=1* delims==" %%i in (encryptinfo.txt) do (
If "%%i"=="key" set key="%%j"
If "%%i"=="iv" set iv="%%j"
If "%%i"=="alt" set alt="%%j"
If "%%i"=="ep" set encryptTool="%%j"
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
			    %encryptTool% -1 -de -file "!path!%en_suffix%" -alt %alt% -key !key! -iv !iv! -out "!path!" -ver 0
			)
		)
	) else echo not exist "!path!"
)
goto :eof

:folder
for /R %1 %%a in (*) do (
	if exist "%%a%en_suffix%" (
		echo decrypt "%%a%en_suffix%"
		%encryptTool% -1 -de -file "%%a%en_suffix%" -alt %alt% -key !key! -iv !iv! -out "%%a" -ver 0
	)
)

:eof
setlocal DisableDelayedExpansion