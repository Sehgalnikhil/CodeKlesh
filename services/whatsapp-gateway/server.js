const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  Browsers,
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5005;
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

let sock = null;
let qrRaw = null;
let qrDataUrl = null;
let qrTimestamp = null;
let connectionStatus = 'INITIALIZING';
let connectedPhone = null;
let isStarting = false;

async function startWhatsApp() {
  if (isStarting) return;
  isStarting = true;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version, isLatest } = await fetchLatestWaWebVersion().catch(() => ({
      version: [2, 3000, 1047967752],
      isLatest: true,
    }));
    console.log(`Using WhatsApp Web v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrRaw = qr;
        qrTimestamp = Date.now();
        connectionStatus = 'SCAN_QR';
        try {
          qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 7 });
          console.log('\n=============================================');
          console.log('📱 FRESH WHATSAPP QR CODE GENERATED:');
          console.log('=============================================');
          qrcodeTerminal.generate(qr, { small: true });
          console.log('=============================================\n');
        } catch (err) {
          console.error('Error generating QR data URL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`Connection closed (status: ${statusCode}), reconnecting: ${shouldReconnect}`);
        connectionStatus = 'DISCONNECTED';
        connectedPhone = null;
        qrRaw = null;
        qrDataUrl = null;

        if (shouldReconnect) {
          setTimeout(() => {
            isStarting = false;
            startWhatsApp();
          }, 3000);
        } else {
          // Logged out - clean auth folder
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch {}
          setTimeout(() => {
            isStarting = false;
            startWhatsApp();
          }, 2000);
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

    // Listen for incoming messages
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

            const cleanText = text.trim().toLowerCase();
            if (cleanText === '1' || cleanText === 'c' || cleanText.includes('confirm') || cleanText.includes('yes')) {
              try {
                await sock.sendMessage(msg.key.remoteJid, {
                  text: '🏥 *SlotSure Clinic* ✅\n\nThank you! Your appointment attendance has been successfully *CONFIRMED*.\n\n📍 *Location:* SlotSure Central Clinic\nWe look forward to seeing you!'
                });
                console.log(`📤 Auto-replied confirmation to +${sender}`);
              } catch (e) {
                console.error('Error auto-replying confirmation:', e);
              }
            } else if (cleanText === '2' || cleanText === 'r' || cleanText.includes('reschedule') || cleanText.includes('cancel')) {
              try {
                await sock.sendMessage(msg.key.remoteJid, {
                  text: '🏥 *SlotSure Clinic* 🗓️\n\nYour appointment has been marked for *RESCHEDULING* and queued for slot recovery.\n\nOur clinic coordination desk will contact you shortly with upcoming openings.'
                });
                console.log(`📤 Auto-replied reschedule/cancellation to +${sender}`);
              } catch (e) {
                console.error('Error auto-replying reschedule:', e);
              }
            }
          }
        }
      }
    });
  } catch (error) {
    console.error('Error starting WhatsApp client:', error);
    setTimeout(() => {
      isStarting = false;
      startWhatsApp();
    }, 5000);
  } finally {
    isStarting = false;
  }
}

// Endpoints
app.get('/status', (req, res) => {
  const ageSeconds = qrTimestamp ? Math.round((Date.now() - qrTimestamp) / 1000) : 0;
  res.json({
    status: connectionStatus,
    phone: connectedPhone ? `+${connectedPhone}` : null,
    qr_image: qrDataUrl,
    has_qr: !!qrDataUrl,
    qr_age_seconds: ageSeconds,
    is_expired: ageSeconds > 25,
  });
});

app.post('/refresh-qr', async (req, res) => {
  console.log('User requested fresh QR code...');
  try {
    // If not connected, restart socket to generate fresh QR immediately
    if (connectionStatus !== 'CONNECTED') {
      try {
        if (sock) sock.end(new Error('Refreshing QR'));
      } catch {}
      isStarting = false;
      setTimeout(startWhatsApp, 1000);
      return res.json({ success: true, message: 'Generating fresh QR...' });
    }
    return res.json({ success: false, message: 'Already connected' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
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
        error: 'WhatsApp gateway is not connected yet. Please link your WhatsApp first.',
        status: connectionStatus,
      });
    }

    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      clean = '91' + clean;
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
