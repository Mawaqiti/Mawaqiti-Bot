# 🕌 Mawaqiti — Islamic Prayer Discord Bot

**Mawaqiti** is an Islamic Discord bot designed to help Muslims stay connected to their daily prayers through **voice reminders** and **visual prayer schedules**.

---

## ✨ Features

### 🔊 Prayer Voice Reminders

Mawaqiti automatically reminds users shortly before each prayer.

* Automatically detects **active voice channels**
* Joins voice channels that currently contain members
* Announces when there are **5 minutes remaining until Adhan**
* Supports all **five daily prayers**:

  * Fajr
  * Dhuhr
  * Asr
  * Maghrib
  * Isha
* Leaves the voice channel after the reminder is finished

---

### 🖼️ Daily Prayer Times Image

Users can request a visual schedule containing the day's prayer times.

* Generates a clean and beautiful **prayer time image**
* Clearly displays the daily prayer schedule
* Can be requested directly through a Discord command
* Perfect for sharing in server text channels

---

## ⚙️ How It Works

1. The bot calculates prayer times based on the configured location.
2. It continuously checks the upcoming prayer time.
3. **5 minutes before Adhan**, the bot:

   * Finds voice channels containing active members
   * Joins the relevant voice channels
   * Plays an audio reminder
4. Users can also request an image containing the full daily prayer schedule.

---

## 📦 Requirements

Before running the bot, make sure you have the following installed:

* [Node.js](https://nodejs.org/)
* npm
* **FFmpeg**
* A Discord Bot application and token

### FFmpeg

FFmpeg is required for playing audio inside Discord voice channels.

Make sure FFmpeg is installed and available in your system's `PATH`.

You can verify your installation with:

```bash
ffmpeg -version
```

---

## 🔐 Environment Variables

Create a `.env` file in the project directory and add your Discord credentials:

```env
TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_CLIENT_ID
```

> ⚠️ Never share your `.env` file or Discord bot token publicly.

It is recommended to add `.env` to your `.gitignore`:

```gitignore
.env
node_modules/
```

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/Mawaqiti/Mawaqiti-Bot.git
cd ./Mawaqiti-Bot
```

Install the required Node.js dependencies:

```bash
npm install
```

Make sure your `.env` file contains both:

```env
TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_CLIENT_ID
```

Then start the bot:

```bash
node index.js
```

---

## 🤖 Discord Bot Permissions

The bot may require permissions such as:

* View Channels
* Send Messages
* Connect
* Speak
* Use Application Commands

Make sure these permissions are enabled when inviting the bot to your Discord server.

---

## 📁 Example Project Structure

```text
Mawaqiti-Bot/
├── cla.js
├── package.json
├── package-lock.json
├── .env
└── README.md
```

---

## 🕌 Purpose

The goal of **Mawaqiti** is simple:

> Help Muslim communities on Discord remember their prayers in a convenient and engaging way.

May Allah make it beneficial. 🤍