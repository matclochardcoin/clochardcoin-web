#!/data/data/com.termux/files/usr/bin/bash

cd ~/clochardcoin-web

node script.js

git add .
git commit -m "auto log $(date '+%d-%m-%Y %H:%M')" || true
git push origin main
