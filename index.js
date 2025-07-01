const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const axios = require('axios');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const path = './auth_info.json';

const { state, saveState } = useSingleFileAuthState(path);

async function connectToWhatsApp() {
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (text) {
      console.log(`[INCOMING] ${text} from ${sender}`);

      // Send to your n8n webhook
      const response = await axios.post('https://n8n-vaslin.onrender.com/webhook/whatsapp', {
        message: text,
        sender: sender
      });

      const reply = response.data.reply;
      await sock.sendMessage(sender, { text: reply });
    }
  });
}

connectToWhatsApp();
