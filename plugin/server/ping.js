// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin: Ping
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { fakeQuoted } from "../../engine/lib/fake.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const reactFrames = ["🕛", "🕞", "🕕", "🕤", "🕛", "✅"];

const TOTAL = 10;
const FILL = "▰";
const EMPTY = "▱";

function bar(step) {
  const filled = FILL.repeat(step);
  const empty = EMPTY.repeat(TOTAL - step);
  const percent = Math.floor((step / TOTAL) * 100);
  return `Loading...\n[${filled}${empty}] ${percent}%`;
}

export default {
  meta: {
    name: "ping",
    command: ["ping", "p"],
    category: "server",
    section: "🌐 SERVER",           // ← grup
    description: "Cek kecepatan bot",
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m) {
    const start = Date.now();

    for (const emoji of reactFrames) {
      try {
        await sock.sendMessage(m.chat, {
          react: { text: emoji, key: m.key }
        });
        await sleep(250);
      } catch {}
    }

    const sent = await sock.sendMessage(
      m.chat,
      { text: bar(0) },
      { quoted: fakeQuoted(m.text) }
    );

    for (let i = 1; i <= TOTAL; i++) {
      await sleep(150);
      try {
        await sock.sendMessage(m.chat, {
          text: bar(i),
          edit: sent.key
        });
      } catch {}
    }

    const latency = Date.now() - start;

    const hasil =
`🏓 *Pong!*

⚡ Respons : *${latency}ms*
🤖 Bot     : Lolpop MD
👤 User    : *${m.pushName || m.senderNumber}*
✅ Status  : *Online*`;

    await sock.sendMessage(m.chat, {
      text: hasil,
      edit: sent.key
    });
  }
};