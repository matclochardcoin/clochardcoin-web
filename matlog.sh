#!/data/data/com.termux/files/usr/bin/bash

cd ~/clochardcoin-web || exit

OBJ="$1"
IG="$2"
TG="$3"
TT="$4"

if [ -z "$OBJ" ] || [ -z "$IG" ] || [ -z "$TG" ] || [ -z "$TT" ]; then
  echo "❌ Uso corretto:"
  echo './matlog.sh "Obiettivo del giorno" Instagram Telegram TikTok'
  echo 'Esempio: ./matlog.sh "Continuare a costruire" 141 7 3'
  exit 1
fi

python update_live.py "$OBJ" "$IG" "$TG" "$TT"

git pull origin main --rebase
git add .
git commit -m "Update Mat live: $OBJ" || echo "Nessuna modifica da committare"
git push origin main

echo "✅ Mat aggiornato e pubblicato."
echo "🎯 Obiettivo: $OBJ"
echo "📸 Instagram: $IG"
echo "💬 Telegram: $TG"
echo "🎵 TikTok: $TT"
