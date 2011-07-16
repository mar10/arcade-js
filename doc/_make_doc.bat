set JSDOC=C:\apps\jsdoc-toolkit-2.4.0

rem java -jar %JSDOC%\jsrun.jar %JSDOC%\app\run.js -v -a -t=%JSDOC%\templates\jsdoc -d=jsdoc ..\src\lina.js\ ..\src\arcade.js\ ..\src\rip-off\

java -jar %JSDOC%\jsrun.jar %JSDOC%\app\run.js -v -a -t=%JSDOC%\templates\jsdoc -d=..\..\arcade-js-docs\lina.js\jsdoc ..\src\lina.js\ 
java -jar %JSDOC%\jsrun.jar %JSDOC%\app\run.js -v -a -t=%JSDOC%\templates\jsdoc -d=..\..\arcade-js-docs\arcade.js\jsdoc ..\src\arcade.js\ 
java -jar %JSDOC%\jsrun.jar %JSDOC%\app\run.js -v -a -t=%JSDOC%\templates\jsdoc -d=..\..\arcade-js-docs\demos\jsdoc ..\src\demos\asteroids\ ..\src\demos\rip-off\ ..\src\demos\billards\ 

pause