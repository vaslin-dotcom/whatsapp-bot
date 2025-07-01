const { default: makeWASocket, useMultiFileAuthState } = require('baileys');
const axios = require('axios');
const P = require('pino');

async function connectToWhatsApp() {
  // Use MultiFile Auth State
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Listen to incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text) {
      console.log(`[INCOMING] ${text} from ${sender}`);

      try {
        // Call your n8n webhook
        const response = await axios.post('https://n8n-vaslin.onrender.com/webhook/whatsapp', {
          message: text,
          sender: sender
        });

        const reply = response.data.reply || "Sorry, I couldn't get a proper reply 😅";

        // Send reply back to sender
        await sock.sendMessage(sender, { text: reply });
      } catch (error) {
        console.error("Failed to get response from webhook:", error.message);
        await sock.sendMessage(sender, { text: "Oops! Something went wrong while getting reply 😬" });
      }
    }
  });
}

connectToWhatsApp();
