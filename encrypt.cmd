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
			if exist "!path!" (
				echo encrypt "!path!"
			    %encryptTool% -1 -en -file "!path!" -alt %alt% -key !key! -iv !iv! -out "!path!%en_suffix%" -ver 0
			) else echo Not exist "!path!" 
		)
	) else echo Not exist "!path!" 
)
goto :eof

:folder
for /R %1 %%a in (*) do (
	set file=%%a
	if "!file:%en_suffix%=!"=="!file!" (
		echo encrypt "%%a"
		%encryptTool% -1 -en -file "%%a" -alt %alt% -key !key! -iv !iv! -out "%%a%en_suffix%" -ver 0
	) else echo skip to encrypt "%%a"
)

:eof
setlocal DisableDelayedExpansion