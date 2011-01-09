cd ..\src
tabfix -tx --no-backup arcade.js\arcade.js
tabfix -tx --no-backup arcade.js\arcade-controls.js
tabfix -tx --no-backup lina.js\lina.js
cd ..\src\demos
tabfix -tx --no-backup -r -m*.js -m*.html -m*.css
cd ..\..\doc
pause