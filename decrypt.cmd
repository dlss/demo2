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
set file=%cd%\%%i%en_suffix%
if exist "!file!" (
	ECHO decrypt "!file!"
    %encryptTool% -1 -de -f "!file!" -t %alt% -key !key! -iv !iv! -o "%%i"
	)
)
setlocal DisableDelayedExpansion
