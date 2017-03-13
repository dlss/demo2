@ECHO OFF
set en_suffix=_encrypt

For /f "eol=# tokens=1* delims=:" %%i in (encryptinfo.txt) do (
If "%%i"=="key" set key=%%j
If "%%i"=="iv" set iv=%%j
If "%%i"=="method" set alt=%%j
If "%%i"=="encrypttool" set encryptTool=%%j
)

setlocal EnableDelayedExpansion
For /f "eol=#" %%i in (encryptlist.txt) do (
set file=%cd%\%%i
if exist "!file!" (
	ECHO encrypt "!file!"
	%encryptTool% -1 -en -f "!file!" -t %alt% -key !key! -iv !iv! -o "!file!%en_suffix%"
	)
)
setlocal DisableDelayedExpansion