#!/bin/bash
if [ ! -d "./node_modules" ]; then
    npm install
fi

node config.js
node server.js