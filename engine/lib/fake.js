// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Lolpop MD — Fake Helper
//  Author : Vinzy Nightly
//  Version: 1.0
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const genId = () => "Q" + Date.now().toString(36).toUpperCase();
const now = () => Math.floor(Date.now() / 1000);

export function fakeQuoted(text = "") {
  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      participant: "0@s.whatsapp.net",
      id: genId()
    },
    message: { conversation: `💬 ${text}` },
    messageTimestamp: now()
  };
}

export function fakeText(text = "") {
  return { conversation: text };
}

export function fakeProduct(title = "Lolpop MD", body = "Product") {
  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      participant: "0@s.whatsapp.net",
      id: genId()
    },
    message: {
      productMessage: {
        product: {
          productImage: { url: "https://example.com/img.jpg" },
          productId: "LOLPOP-MD",
          title, description: body,
          currencyCode: "IDR",
          priceAmount1000: 0,
          retailerId: "LOLPOP",
          productImageCount: 1
        },
        businessOwnerJid: "0@s.whatsapp.net"
      }
    },
    messageTimestamp: now()
  };
}

export function fakeStatus(text = "") {
  return {
    key: {
      remoteJid: "status@broadcast",
      fromMe: false,
      participant: "0@s.whatsapp.net",
      id: genId()
    },
    message: {
      extendedTextMessage: {
        text,
        contextInfo: { mentionedJid: [], isForwarded: true }
      }
    },
    messageTimestamp: now()
  };
}

export default { fakeQuoted, fakeText, fakeProduct, fakeStatus };