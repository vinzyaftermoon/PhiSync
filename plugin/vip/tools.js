// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Plugin Tools: Vip Tools
//  (Placeholder — command nanti ditambah)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default {
  meta: {
    name: "vipTools",
    command: ["viptools"],
    category: "tools",
    section: "⚔️ TOOLS",
    description: "Fitur khusus VIP & Premium",
    vip: true,              // ← khusus vip + premium
    premiumLimit: 10,       // ← premium kena -10 limit
    owner: false,
    premium: false,
    group: false,
    private: false
  },

  async run(sock, m) {
    await m.reply(
      `⚔️ *VIP TOOLS*\n\n` +
      `Fitur ini masih dalam pengembangan.\n` +
      `Nanti bakal ada command-command keren di sini 😹\n\n` +
      `> Plan kamu: *${String(m.plan).toUpperCase()}*\n` +
      `${m.plan === "vip" ? "> Akses: *GRATIS* ✅" : "> Akses: *-10 limit* per command"}`
    );
  }
};