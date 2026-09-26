<p align="center">
  <img src="media/thumbnail.jpg" width="280" alt="Anya MD Thumbnail"/>
</p>

<h1 align="center">🌸 ANYA MD 🌸</h1>

<p align="center">
  <b>Smart • Cute • Powerful WhatsApp Bot</b>
</p>

<p align="center">
  <i>Anime style WhatsApp Multi-Device Bot dengan sistem plugin fleksibel.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Creator-Hamm-ff69b4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Recode%20By-Kurumi-9b59b6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Type-WhatsApp%20Bot-25D366?style=for-the-badge" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/himanackerman/kurumi-MD?style=for-the-badge" />
  <img src="https://img.shields.io/github/forks/himanackerman/kurumi-MD?style=for-the-badge" />
  <img src="https://img.shields.io/github/license/himanackerman/kurumi-MD?style=for-the-badge" />
</p>

---

## 🌸 Tentang Anya MD

**Anya MD** adalah WhatsApp Bot modern bertema anime yang dibuat untuk membantu kebutuhan grup, personal, hiburan, downloader, AI, hingga tools otomatisasi.

Bot ini menggunakan sistem plugin yang ringan, rapi, dan mudah dikembangkan ulang sesuai kebutuhan.

> 🌙 **Recode by Kurumi**  
> ✨ Dikembangkan ulang dengan tema **Anya MD** oleh **Hamm**

---

## ✨ Highlight

- 🌸 Tampilan bot bertema **Anya Anime Style**
- 🤖 AI Chat & Auto Response
- 🎵 Downloader musik dan video
- 📥 TikTok, Instagram, YouTube Downloader
- 👥 Tools admin dan manajemen grup
- 🎮 Game, fun menu, dan RPG ringan
- 🖼️ Sticker, image tools, dan maker
- ⚙️ Sistem plugin fleksibel
- 🚀 Ringan, cepat, dan cocok untuk VPS

---

## 📦 Features

| Category | Description |
|---|---|
| 🤖 AI | Chat AI, auto reply, AI tools |
| 🎵 Downloader | YouTube, TikTok, Instagram, media downloader |
| 👥 Group | Welcome, hidetag, tagall, anti-link, admin tools |
| 🎮 Game | Tebak-tebakan, RPG, fun games |
| 🖼️ Sticker | Sticker maker, smeme, brat, to sticker |
| 🛠️ Tools | To URL, screenshot web, shortlink, converter |
| 👑 Owner | Eval, broadcast, backup, control bot |

---

## 🚀 Installation

```bash
git clone https://github.com/himanackerman/kurumi-MD.git
cd kurumi-MD
npm install
npm start
```

---

## ⚙️ Configuration

Edit bagian `config.js`, lalu sesuaikan owner dan pengaturan bot.

```js
global.owner = [['628xxxx', 'Hamm', true]]
global.mods = []
global.prems = []

global.namebot = 'Anya MD'
global.author = 'Hamm'
global.wm = '❀ ᴀɴʏᴀ ᴍᴅ ❀'
```

---

## 🧩 Plugin System

Simpan plugin di folder:

```bash
/plugins
```

Contoh struktur plugin:

```js
let handler = async (m, { conn, text, usedPrefix, command }) => {
  m.reply('Waku waku~ Anya siap membantu!')
}

handler.help = ['anya']
handler.tags = ['main']
handler.command = /^anya$/i

export default handler
```

---

## 🌸 Preview Style

```txt
╭─「 ANYA MD 」
│ Haii, aku Anya~ 🌸
│ Smart, cute, dan siap bantu grup kamu!
╰───────────────
```

---

## 🙏 Special Thanks

- Allah SWT
- My Parents
- Hamm
- Kurumi MD
- AgusXzz
- ChiiMD
- Semua creator plugin
- Teman-teman yang selalu support ❤️

---

## 📌 Notes

Bot ini dibuat untuk pembelajaran dan pengembangan pribadi.  
Gunakan dengan bijak, jangan spam, dan jangan diperjualbelikan tanpa izin.

---

<p align="center">
  <b>🌸 Anya MD — Cute Outside, Powerful Inside 🌸</b>
</p>

<p align="center">
  <i>Recode by Kurumi • Theme by Anya MD • Created by Hamm</i>
</p>
