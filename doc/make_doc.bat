set JSDOC=C:\apps\jsdoc-toolkit

java -jar %JSDOC%\jsrun.jar %JSDOC%\app\run.js -v -a -t=%JSDOC%\templates\jsdoc -d=jsdoc ..\src\arcade.js\ ..\src\rip-off\

pause