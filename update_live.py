import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

CONFIG_PATH = Path("live/live-config.json")

SOLANA_WALLET = "5sc1W9g5VVyBW9EhU5oYhhDF49K751mKjZWo92iemTji"

SOCIAL_LINKS = {
    "instagram": "https://www.instagram.com/clochard_coin?igsh=ZGxnbGV1aWs3OGpr",
    "telegram": "https://t.me/+2WX7IXU1CzBlNzc0",
    "tiktok": "#",
    "terminal": "https://terminal.clochardcoin.it",
    "live": "https://live.clochardcoin.it"
}


def ask(prompt, default=""):
    value = input(f"{prompt} ")
    if value.strip() == "":
        return default
    return value.strip()


def ask_int(prompt, default):
    value = input(f"{prompt} [{default}]: ")
    if value.strip() == "":
        return default

    try:
        return int(value)
    except ValueError:
        print("Valore non valido. Uso il valore precedente.")
        return default


def generate_logs(objective, command):
    if command:
        command_line = f"Mat legge un comando selezionato dalla community: “{command}”."
    else:
        command_line = "Mat controlla terminal.clochardcoin.it in attesa di un comando utile dalla community."

    return {
        "06": {
            "category": "BOOT",
            "text": (
                f"Mat si accende. Obiettivo caricato: {objective}. "
                "La giornata inizia dal terminale."
            )
        },
        "09": {
            "category": "USER_SIGNAL",
            "text": (
                f"{command_line} "
                "Il segnale viene trasformato in direzione operativa."
            )
        },
        "12": {
            "category": "SCAN",
            "text": (
                f"Check centrale. Mat analizza i primi segnali collegati all'obiettivo: {objective}. "
                "La missione continua."
            )
        },
        "15": {
            "category": "RESULT",
            "text": (
                "Mat organizza ciò che ha raccolto. "
                "I dati diventano tracce, le tracce diventano contenuto."
            )
        },
        "18": {
            "category": "MAT",
            "text": (
                "Ultimo log operativo. Mat chiude il lavoro della giornata "
                "e prepara il report finale."
            )
        },
        "20": {
            "category": "REPORT",
            "text": (
                f"Riassunto della giornata: Mat ha lavorato sull'obiettivo “{objective}”. "
                "Il percorso continua domani con un nuovo input."
            )
        }
    }


def run_git_commands(date):
    try:
        subprocess.run(["git", "add", "live/live-config.json"], check=True)
        subprocess.run(
            ["git", "commit", "-m", f"Update Mat live config {date}"],
            check=True
        )
        subprocess.run(["git", "push"], check=True)
        print("\n✅ Configurazione inviata su GitHub.")
    except subprocess.CalledProcessError:
        print("\n⚠️ File aggiornato, ma git push non completato.")
        print("Probabilmente devi fare login GitHub con token.")


def main():
    print("\n==============================")
    print(" MAT CLOCHARD LIVE CONFIG")
    print("==============================\n")

    tomorrow = datetime.now() + timedelta(days=1)
    default_date = tomorrow.strftime("%Y-%m-%d")

    date = ask("Data live:", default_date)

    objective = ask("\nObiettivo del giorno:")
    while not objective:
        print("L'obiettivo è obbligatorio.")
        objective = ask("Obiettivo del giorno:")

    instagram = ask_int("\nFollower Instagram", 142)
    telegram = ask_int("Utenti Telegram", 7)
    tiktok = ask_int("Follower TikTok", 2)

    youtube = ask("Stato YouTube [non ancora attivo]:", "non ancora attivo")

    command = ask("\nComando community selezionato opzionale:", "")

    selected_commands = []
    if command:
        selected_commands.append(command)

    config = {
        "date": date,
        "dailyObjective": objective,
        "instagramFollowers": instagram,
        "telegramUsers": telegram,
        "tiktokFollowers": tiktok,
        "youtubeStatus": youtube,
        "solanaWallet": SOLANA_WALLET,
        "minimumDonation": "0.01 SOL",
        "socialLinks": SOCIAL_LINKS,
        "selectedCommands": selected_commands,
        "logs": generate_logs(objective, command)
    }

    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)

    with CONFIG_PATH.open("w", encoding="utf-8") as file:
        json.dump(config, file, ensure_ascii=False, indent=2)

    print("\n✅ live-config.json generato correttamente.")
    print(f"📅 Data: {date}")
    print(f"🎯 Obiettivo: {objective}")
    print(f"📸 Instagram: {instagram}")
    print(f"💬 Telegram: {telegram}")
    print(f"🎵 TikTok: {tiktok}")

    push = ask("\nVuoi inviare subito su GitHub? sì/no:", "sì").lower()

    if push in ["sì", "si", "s", "yes", "y"]:
        run_git_commands(date)
    else:
        print("\nFile salvato. Push non eseguito.")


if __name__ == "__main__":
    main()
