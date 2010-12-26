cd ..\src
tabfix -t --no-backup arcade.js\arcade.js
tabfix -t --no-backup arcade.js\arcade-control.js
tabfix -t --no-backup lina.js\lina.js
cd ..\src\demos
tabfix -t --no-backup -r -m*.js -m*.html -m*.css
cd ..\..\doc
pause