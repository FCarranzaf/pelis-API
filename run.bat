IF NOT EXIST "./node_modules" (
   call npm install
)

call node config.js
call node server.js