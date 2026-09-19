const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;

let sock = null;
let qrRaw = null;
let qrDataUrl = null;
let connectionStatus = 'INITIALIZING';
let connectedPhone = null;

async function startWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: ['SlotSure Clinic', 'Chrome', '120.0.0.0'],
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrRaw = qr;
        connectionStatus = 'SCAN_QR';
        try {
          qrDataUrl = await qrcode.toDataURL(qr);
          console.log('\n=============================================');
          console.log('📱 SCAN THIS QR CODE IN WHATSAPP TO LINK:');
          console.log('=============================================');
          qrcodeTerminal.generate(qr, { small: true });
          console.log('=============================================\n');
        } catch (err) {
          console.error('Error generating QR data URL:', err);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
        connectionStatus = 'DISCONNECTED';
        connectedPhone = null;
        qrRaw = null;
        qrDataUrl = null;

        if (shouldReconnect) {
          setTimeout(startWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        console.log('✅ SlotSure WhatsApp Gateway is CONNECTED & READY!');
        connectionStatus = 'CONNECTED';
        qrRaw = null;
        qrDataUrl = null;

        if (sock.user && sock.user.id) {
          connectedPhone = sock.user.id.split(':')[0];
          console.log(`Linked Phone Number: +${connectedPhone}`);
        }
      }
    });

    // Listen for incoming messages (e.g. patients replying "1" or "2")
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type === 'notify') {
        for (const msg of messages) {
          if (!msg.key.fromMe && msg.message) {
            const sender = msg.key.remoteJid.split('@')[0];
            const text =
              msg.message.conversation ||
              msg.message.extendedTextMessage?.text ||
              '';
            console.log(`📩 Received WhatsApp reply from +${sender}: "${text}"`);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error starting WhatsApp client:', error);
    setTimeout(startWhatsApp, 5000);
  }
}

// REST Endpoints
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    phone: connectedPhone ? `+${connectedPhone}` : null,
    qr_image: qrDataUrl,
    has_qr: !!qrDataUrl,
  });
});

app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message are required' });
    }

    if (connectionStatus !== 'CONNECTED' || !sock) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp gateway is not connected yet. Please scan the QR code first.',
        status: connectionStatus,
      });
    }

    // Clean phone number to E.164 without leading '+' or special chars
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = '91' + clean; // Default to India (+91) if 10 digits
    }

    const jid = `${clean}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, { text: message });

    console.log(`📤 Dispatched WhatsApp message to ${jid} (ID: ${result.key.id})`);

    return res.json({
      success: true,
      recipient: `+${clean}`,
      message_id: result.key.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 SlotSure WhatsApp Gateway running on http://127.0.0.1:${PORT}`);
  startWhatsApp();
});
