// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Settings
//  Author : Vinzy Nightly
//  Version: 1.0
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  // ── Info Bot ──
  botName: "Lolpop MD",
  version: "1.0",
  author: "Vinzy Nightly",

  // ── Owner ──
  owner: ["6282374633884"],

  // ── Owner Profile ──
  ownerProfile: {
    name: "Vinzy Nightly",
    status: "Owner & Developer",
    channel: {
      name: "Vinzy Nightly Official",
      url: "https://whatsapp.com/channel/0029VbDTXq68F2pKDsEB9M2c"
    },
    donasi: {
      url: "https://saweria.co/vinzyofficial"
    }
  },

  // ── Prefix & Mode ──
  prefix: ".",
  selfMode: false,

  // ── Session ──
  sessionDir: "./session",

  // ── Connection ──
  autoReconnect: true,
  maxRetry: 1,

  // ── Log ──
  logMessage: true,

  // ── Canvas ──
  canvas: true,

  // ── Pairing ──
  pairingNumber: "",

  // ── Newsletter (saluran WA) ──
  newsletter: {
    id: "0029VbDTXq68F2pKDsEB9M2c@newsletter",
    name: "Vinzy Nightly Official"
  },

  // ── Website / Link ──
  website: "https://wa.me/6282374633884",

  // ── Media & Aset ──
  media: {
    menu: {
      video: "./assets/menu/menu.mp4",
      thumb: "./assets/menu/menu-thumb.jpg",
      audio: "./assets/menu/menu.mp3"
    }
  },

  // ── Limit (default per plan) ──
  limit: {
    free: 20,
    basic: 100,
    premium: 500,
    vip: 9999
  },

  // ── Cooldown (ms) ──
  cooldown: {
    spam: 3000,
    command: 2000
  },

  // ── Fitur Auto ──
  autoFeatures: {
    read: false,
    typing: true,
    react: false
  },

  // ── Group Default ──
  groupDefaults: {
    welcome: false,
    antiLink: false,
    antiBadword: false,
    antiSpam: false,
    mute: false,
    onlyAdmin: false
  },

  // ── Sewa (toggle) ──
  sewa: {
    enabled: false,       // ← false = sistem sewa OFF (buat testing)
    autoKick: false       // ← false = auto-kick grup asing OFF
  },

  // ── Pesan ──
  messages: {
    ownerOnly: "❌ Fitur ini khusus owner.",
    premiumOnly: "❌ Fitur ini khusus premium.",
    groupOnly: "❌ Fitur ini hanya untuk grup.",
    privateOnly: "❌ Fitur ini hanya untuk private chat.",
    error: "❌ Terjadi error.",
    wait: "⏳ Mohon tunggu..."
  }
};