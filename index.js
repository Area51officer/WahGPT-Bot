import ws from '@whiskeysockets/baileys';
import { remove } from 'fs-extra';
import { serialize } from './lib/waClient.js';
import axios from 'axios';
import P from 'pino';

const start = async () => {
    console.log('\x1b[36m%s\x1b[0m', '╭───────────────────────────────────────╮');
    console.log('\x1b[36m%s\x1b[0m', '│         🤖  \x1b[35mWahGpt-Bot\x1b[0m  🤖            │');
    console.log('\x1b[36m%s\x1b[0m', '│                                       │');
    console.log('\x1b[36m%s\x1b[0m', '│  \x1b[35mWhatsApp Chat Bot with ChatGPT    \x1b[0m   │');
    console.log('\x1b[36m%s\x1b[0m', '│             \x1b[35mIntegration\x1b[0m               │');
    console.log('\x1b[36m%s\x1b[0m', '│                                       │');
    console.log('\x1b[36m%s\x1b[0m', '╰───────────────────────────────────────╯');

    const { useMultiFileAuthState, fetchLatestBaileysVersion } = ws;
    const { default: makeWASocket } = ws;

    const { state, saveCreds } = await useMultiFileAuthState("session");
    const client = makeWASocket({
        version: (await fetchLatestBaileysVersion()).version,
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: true
    });

    const colors = {
        user: '\x1b[36m', // Cyan color for user messages
        bot: '\x1b[35m',  // Magenta color for bot messages
        reset: '\x1b[0m'  // Reset color
    };

    client.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;
    if (qr) console.log(`📱 Scan the QR code!!`);
    if (connection === 'connecting') console.log('🔗 Connecting to WhatsApp!!');
    if (connection === 'open') console.log('✅ Connected to WhatsApp');
});

    client.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const M = serialize(JSON.parse(JSON.stringify(messages[0])), client);

        let response = '';
        if (M.quoted) {
            response += `Quoted message: ${M.quoted.body}\n\n`;
        }

        try {
            const text = await axios.get(`https://oni-chan-unique-api.vercel.app/gpt4?text=answer me in genz slang: ${M.body}`);
            const botResponse = text.data.result;
            response += `*🤖Bot:* ${botResponse}`;;

            console.log(`${colors.user}👤 User: ${M.body}${colors.reset}`);
            console.log(`${colors.bot}🤖 Bot: ${botResponse}${colors.reset}`);

            M.reply(response);
        } catch (error) {
            console.error('❌ Error:', error.message);
            M.reply('Sorry, an error occurred while processing your request.');
        }
    });

    client.ev.on('creds.update', saveCreds);
};

start();
