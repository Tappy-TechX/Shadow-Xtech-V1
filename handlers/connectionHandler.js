const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../database/config");
const { totalCommands } = require("../handlers/commandHandler");

const botName = process.env.BOTNAME || "Toxic-MD";
const whatsappChannelLink = "https://whatsapp.com/channel/0029VasHgfG4tRrwjAUyTs10"; // replace with your actual channel link

let hasSentStartMessage = false;
let hasFollowedNewsletter = false;

/* ================= LIFE QUOTES ================= */
const lifeQuotes = {
  morning: ["Rise and shine ☀️","Coffee first, conquer day ☕","New day, new goals 🌅","Smile, it's a blessing 😊","Start fresh, stay motivated ✨"],
  afternoon: ["Keep pushing forward 🚀","Stay focused, achieve goals 🎯","Midday break, breathe 🌿","Fuel up, stay energized 🔋","Embrace moment, stay present ⏳"],
  evening: ["Reflect, relax, feel peace 🌌","Wind down, recharge body 🌙","Enjoy sunset, stay calm 🌆","Peaceful moments, breathe deeply 🕯️","Cherish today, welcome night 🌟"],
  night: ["Good night, sleep well 😴","Dream big, rest easy 🛌","Stars shine, stay hopeful ✨","Relax mind, body rests 💤","Tomorrow comes, be ready 🌙"]
};

const timeOfDayEmojis = {
  morning: ['☀️','☕','🌸','🌅','✨'],
  afternoon: ['🔆','💡','🌿','🚀','🔋'],
  evening: ['🌆','🌙','🌟','🌌','🌒'],
  night: ['🌃','😴','🌠','🦉','💤']
};

/* ================= CONNECTION MESSAGES ================= */
const connectionMessages = [
  "System online. Ready to serve! 😊",
  "I'm live! Let the automation begin! 🚀",
  "Connection established. All systems nominal. 🛰️",
  "Hello world! Your friendly bot is here. 👋",
  "Powered up and ready to go! ✨",
  "XEON-XTECH is awake and active! ⚡",
  "Your digital assistant has arrived! 🤖",
  "Online and buzzing with energy! 🐝",
  "Welcome aboard! Dear User 🎉",
  "The network is humming & online! 🎶",
  "Ready to process your requests! ⚙️",
  "Your virtual companion is online! 🌟"
];

/* ================= QUOTED CONTACT ================= */
const quotedContact = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "⚙️ Shadow-Xtech | Connected 🚀",
      vcard: `BEGIN:VCARD
VERSION:3.0
FN:SCIFI
ORG:Shadow-Xtech BOT;
TEL;type=CELL;type=VOICE;waid=254700000001:+254 700 000001
END:VCARD`
    }
  }
};

/* ================= HELPERS ================= */
function getTimeCategory() {
  const hour = DateTime.now().setZone("Africa/Nairobi").hour;
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function getRandomQuote() {
  const time = getTimeCategory();
  const quotes = lifeQuotes[time];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function getRandomEmoji() {
  const time = getTimeCategory();
  const emojis = timeOfDayEmojis[time];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

function getRandomConnectionMessage() {
  return connectionMessages[Math.floor(Math.random() * connectionMessages.length)];
}

function getCurrentTime() {
  return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
}

function toFancyFont(text) {
  const fonts = {
    a:'𝙖',b:'𝙗',c:'𝙘',d:'𝙙',e:'𝙚',f:'𝙛',g:'𝙜',h:'𝙝',i:'𝙞',j:'𝙟',
    k:'𝙠',l:'𝙡',m:'𝙢',n:'𝙣',o:'𝙤',p:'𝙥',q:'𝙦',r:'𝙧',s:'𝙨',t:'𝙩',
    u:'𝙪',v:'𝙫',w:'𝙬',x:'𝙭',y:'𝙮',z:'𝙯'
  };
  return text.toLowerCase().split('').map(c => fonts[c] || c).join('');
}

/* ================= CONNECTION HANDLER ================= */
async function connectionHandler(socket, connectionUpdate) {
  const { connection, lastDisconnect } = connectionUpdate;

  if (connection === "connecting") return;

  if (connection === "close") {
    const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
    if (statusCode === DisconnectReason.loggedOut) {
      hasSentStartMessage = false;
      hasFollowedNewsletter = false;
    }
    return;
  }

  if (connection === "open") {
    console.clear();
    await new Promise(r => setTimeout(r, 3000));

    try { await socket.groupAcceptInvite("GDcJihbSIYM0GzQJWKA6gS"); } catch {}
    if (!hasFollowedNewsletter) {
      try { await socket.newsletterFollow("120363322461279856@newsletter"); hasFollowedNewsletter = true; } catch {}
    }

    const userId = socket.user.id.split(":")[0].split("@")[0];
    const settings = await getSettings();
    const sudoUsers = await getSudoUsers();

    if (!hasSentStartMessage && settings.startmessage) {
      const isNewUser = !sudoUsers.includes(userId);
      if (isNewUser) await addSudoUser(userId);

      const quote = getRandomQuote();
      const emoji = getRandomEmoji();
      const connectionMsg = getRandomConnectionMessage();

      const firstMessageWithButtons = `
╭───( ${botName} )───
├ 🔔 ${connectionMsg}
├ ${emoji} *${quote}*
│
├ ✨ *Bot*: ${botName}
├ 🔧 *Mode*: ${settings.mode}
├ ➡️ *Prefix*: ${settings.prefix}
├ 📋 *Commands*: ${totalCommands}
├ 🕒 *Time*: ${getCurrentTime()}
│
├ ${isNewUser ? "👤 *New user added to sudo*" : "✅ *Welcome back!*"}
╰──────────────────☉
© Powered By xh_clinton
`.trim();

      try {
        await socket.sendMessage(socket.user.id, {
          text: firstMessageWithButtons,
          buttons: [
            { buttonId: `${settings.prefix}settings`, buttonText: { displayText: `⚙️ ${toFancyFont("settings")}` }, type: 1 },
            { buttonId: `${settings.prefix}menu`, buttonText: { displayText: `📖 ${toFancyFont("menu")}` }, type: 1 },
            { buttonId: `${settings.prefix}startmessage off`, buttonText: { displayText: `❌ ${toFancyFont("disable")}` }, type: 1 }
          ],
          headerType: 1,
          contextInfo: {
            mentionedJid: [userId + "@s.whatsapp.net"],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363369453603973@newsletter',
              newsletterName: "𝐒ʜᴀᴅᴏᴡ 𝐗ᴛᴇᴄʜ",
              serverMessageId: 143
            },
            externalAdReply: {
              title: "⚙️ Shadow-Xtech | System Pulse",
              body: "Speed • Stability • Sync",
              thumbnailUrl: 'https://files.catbox.moe/3l3qgq.jpg',
              sourceUrl: whatsappChannelLink,
              mediaType: 1,
              renderLargerThumbnail: false
            }
          },
          quoted: quotedContact
        });
      } catch (e) { console.log(e); }

      hasSentStartMessage = true;
    }
  }
}

module.exports = connectionHandler;