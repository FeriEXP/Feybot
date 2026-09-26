process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

import fs from 'fs';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { format } from 'util';
import { parentPort } from 'worker_threads';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import { createRequire } from 'module';

import chalk from 'chalk';
import pino from 'pino';
import syntaxerror from 'syntax-error';
import { Low, JSONFile } from 'lowdb';

import { makeWASocket, protoType, serialize } from './lib/simple.js';
import {
    useMultiFileAuthState,
    Browsers,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

/* ============================================================
 * JADIBOT LIBRARY
 * ============================================================ */
import {
    startSubBot, stopSubBot, restoreSubBots, getSubBot,
    hasSubBot, getSubBots, getSubBotCount
} from './lib/jadibot.js';

/* ============================================================
 * GLOBAL PATH
 * ============================================================ */
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix
        ? (/file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL)
        : pathToFileURL(pathURL).toString();
};

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};

global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

const __dirname = global.__dirname(import.meta.url);

/* ============================================================
 * GLOBAL
 * ============================================================ */
global.opts = global.opts || {};
global.prefix = global.prefix || /^[./#!]/;
global.stopped = false;

/* ============================================================
 * CONFIG
 * ============================================================ */
try {
    if (fs.existsSync('./config.js')) {
        await import('./config.js');
        console.log('Config loaded');
    } else {
        console.log('config.js tidak ditemukan! Membuat default...');
        global.pairingNumber = '628xxx';
        fs.writeFileSync('./config.js', `
global.pairingNumber = '628xxx';
global.owner = ['628xxx'];
global.anticall = true;
`);
    }
} catch (e) {
    console.log('Error loading config:', e.message);
    global.pairingNumber = '628xxx';
}

/* ============================================================
 * BAILEYS PROTOTYPE
 * ============================================================ */
protoType();
serialize();

/* ============================================================
 * DATABASE
 * ============================================================ */
global.db = new Low(new JSONFile('database.json'));

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise(resolve => {
            const timer = setInterval(async () => {
                if (!global.db.READ) {
                    clearInterval(timer);
                    resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
                }
            }, 1000);
        });
    }

    if (global.db.data !== null) return;

    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.READ = null;

    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(global.db.data || {})
    };
};

await global.loadDatabase();

/* ============================================================
 * DATABASE REPAIR
 * ============================================================ */
console.log('Repairing database...');
let repaired = 0;

for (const id in global.db.data.users) {
    const user = global.db.data.users[id];
    if (!user) continue;

    if (!Number.isFinite(user.exp)) { user.exp = 0; repaired++; }
    if (!Number.isFinite(user.level)) { user.level = 0; repaired++; }
    if (!Number.isFinite(user.money)) { user.money = 0; repaired++; }
    if (!Number.isFinite(user.limit)) { user.limit = 50; repaired++; }

    user.premiumTime ??= 0;
    user.lastclaim ??= 0;
    user.lastWarn ??= 0;
}

console.log(`Repair selesai (${repaired} field diperbaiki)`);

/* ============================================================
 * MAIN AUTH
 * ============================================================ */
const { state, saveCreds } = await useMultiFileAuthState('sessions');
const { version } = await fetchLatestBaileysVersion();

/* ============================================================
 * CONNECTION OPTIONS
 * ============================================================ */
const connectionOptions = {
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal', stream: 'store' }))
    },
    version,
    logger: pino({ level: 'silent' }),
    browser: Browsers.ubuntu('Edge'),
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5
};

/* ============================================================
 * MAIN CONNECTION
 * ============================================================ */
global.conn = makeWASocket(connectionOptions);

/* ============================================================
 * CHECK SESSION
 * ============================================================ */
if (fs.existsSync('./sessions/creds.json') && !global.conn.authState.creds.registered) {
    console.log(chalk.yellow('WARNING: creds.json rusak, hapus folder sessions'));
}

/* ============================================================
 * PAIRING MAIN BOT
 * ============================================================ */
if (!global.conn.authState.creds.registered) {
    console.log(chalk.bgWhite(chalk.blue('Generating pairing code...')));

    setTimeout(async () => {
        try {
            if (global.pairingNumber) {
                let code = await global.conn.requestPairingCode(global.pairingNumber);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.black(chalk.bgGreen('Pairing Code: ')), chalk.black(chalk.white(code)));
            } else {
                console.log(chalk.red('pairingNumber tidak diatur di config.js'));
                console.log(chalk.yellow('Scan QR Code manual:'));
                const qr = await global.conn.requestPairingCode();
                console.log(chalk.green(`QR Code: ${qr}`));
            }
        } catch (e) {
            console.log(chalk.red('Error pairing:', e.message));
            parentPort?.postMessage('restart');
        }
    }, 3000);
}

/* ============================================================
 * DATABASE AUTO SAVE
 * ============================================================ */
if (global.db) {
    setInterval(async () => {
        if (global.db.data) await global.db.write().catch(console.error);
        
        if ((global.support || {}).find) {
            const tmp = [tmpdir(), 'tmp'];
            tmp.forEach(filename => {
                spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete']);
            });
        }
    }, 2000);
}

/* ============================================================
 * CHANNEL FOLLOW
 * ============================================================ */
const anu = [
    "120363409623385879@newsletter",
    "120363403527946427@newsletter", 
    "120363412837402275@newsletter", 
    "120363430072738476@newsletter"
];
let followed = false;

/* ============================================================
 * JADIBOT RESTORE FLAG
 * ============================================================ */
let jadibotRestored = false;

/* ============================================================
 * CONNECTION UPDATE
 * ============================================================ */
async function connectionUpdate(update) {
    const { receivedPendingNotifications, connection, lastDisconnect, isOnline } = update;
    global.stopped = connection;

    if (connection === 'connecting') {
        console.log(chalk.redBright('Mengaktifkan Bot, Mohon tunggu sebentar...'));
    } else if (connection === 'open') {
        console.log(chalk.green('Tersambung'));

        if (!jadibotRestored) {
            jadibotRestored = true;
            try {
                await restoreSubBots(global.conn);
            } catch (e) {
                console.error(chalk.red('[JADIBOT] Gagal restore:'), e);
            }
        }

        if (!followed) {
            followed = true;
            for (let id of anu) {
                try {
                    if (global.conn && typeof global.conn.newsletterFollow === 'function') {
                        await global.conn.newsletterFollow(id);
                        console.log(chalk.green(`Follow newsletter: ${id}`));
                    }
                } catch (e) {
                    console.log(chalk.red(`Gagal follow newsletter: ${e.message}`));
                }
            }
        }
    }

    if (isOnline === true) console.log(chalk.green('Status Aktif'));
    else if (isOnline === false) console.log(chalk.red('Status Mati'));

    if (receivedPendingNotifications) console.log(chalk.yellow('Menunggu Pesan Baru'));

    if (connection === 'close') {
        console.log(chalk.red('Koneksi terputus & mencoba menyambung ulang...'));
    }

    if (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.payload) {
        console.log(chalk.red(lastDisconnect.error.output.payload.message));
        await global.reloadHandler(true);
    }

    if (global.db.data == null) await global.loadDatabase();
}

/* ============================================================
 * ERROR HANDLER
 * ============================================================ */
process.on('uncaughtException', console.error);

/* ============================================================
 * HANDLER
 * ============================================================ */
let isInit = true;
let handler = await import('./handler.js');

/* ============================================================
 * RELOAD HANDLER
 * ============================================================ */
global.reloadHandler = async function (restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
    } catch (e) {
        console.error(e);
    }

    if (restatConn) {
        const oldChats = global.conn.chats;
        try { global.conn.ws.close(); } catch {}
        global.conn.ev.removeAllListeners();
        global.conn = makeWASocket(connectionOptions, { chats: oldChats });
        isInit = true;
    }

    if (!isInit) {
        global.conn.ev.off('messages.upsert', global.conn.handler);
        global.conn.ev.off('group-participants.update', global.conn.participantsUpdate);
        global.conn.ev.off('groups.update', global.conn.groupsUpdate);
        global.conn.ev.off('message.delete', global.conn.onDelete);
        global.conn.ev.off('connection.update', global.conn.connectionUpdate);
        global.conn.ev.off('creds.update', global.conn.credsUpdate);
    }

    /* ====================================================
     * WELCOME
     * ==================================================== */
    global.conn.welcome = '✦━━━━━━[ WELCOME ]━━━━━━✦\n\n┏––––––━━━━━━━━•\n│⫹⫺ @subject\n┣━━━━━━━━┅┅┅\n│( 👋 Hallo @user)\n├[ INTRO ]—\n│ Nama: \n│ Umur: \n│ Gender:\n┗––––––━━┅┅┅\n\n––––––┅┅ DESCRIPTION ┅┅––––––\n@desc';
    global.conn.bye = '✦━━━━━━[ GOOD BYE ]━━━━━━✦\nSayonara @user 👋( ╹▽╹ )';
    global.conn.spromote = '@user sekarang admin!';
    global.conn.sdemote = '@user sekarang bukan admin!';
    global.conn.sDesc = 'Deskripsi telah diubah ke \n@desc';
    global.conn.sSubject = 'Judul grup telah diubah ke \n@subject';
    global.conn.sIcon = 'Icon grup telah diubah!';
    global.conn.sRevoke = 'Link group telah diubah ke \n@revoke';

    /* ====================================================
     * HANDLER BIND
     * ==================================================== */
    global.conn.handler = handler.handler.bind(global.conn);
    global.conn.participantsUpdate = handler.participantsUpdate.bind(global.conn);
    global.conn.groupsUpdate = handler.groupsUpdate.bind(global.conn);
    global.conn.onDelete = handler.deleteUpdate.bind(global.conn);
    global.conn.connectionUpdate = connectionUpdate.bind(global.conn);
    global.conn.credsUpdate = saveCreds.bind(global.conn);

    /* ====================================================
     * ANTICALL
     * ==================================================== */
    global.conn.ev.on('call', async calls => {
        for (const call of calls) {
            const { id, from, status } = call;
            const settings = global.db.data.settings?.[global.conn.user?.jid];

            if (status === 'offer' && settings?.anticall) {
                try {
                    await global.conn.rejectCall(id, from);
                    console.log('Menolak panggilan dari', from);
                } catch (e) {}
            }
        }
    });

    /* ====================================================
     * EVENTS
     * ==================================================== */
    global.conn.ev.on('messages.upsert', global.conn.handler);
    global.conn.ev.on('group-participants.update', global.conn.participantsUpdate);
    global.conn.ev.on('groups.update', global.conn.groupsUpdate);
    global.conn.ev.on('message.delete', global.conn.onDelete);
    global.conn.ev.on('connection.update', global.conn.connectionUpdate);
    global.conn.ev.on('creds.update', global.conn.credsUpdate);

    isInit = false;
    return true;
};

/* ============================================================
 * PLUGIN FOLDER
 * ============================================================ */
const pluginFolder = global.__dirname(join(__dirname, './plugins/index'));
const pluginFilter = filename => /\.js$/.test(filename);
global.plugins = {};

/* ============================================================
 * LOAD PLUGINS
 * ============================================================ */
async function filesInit() {
    try {
        if (fs.existsSync(pluginFolder)) {
            for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
                try {
                    let file = global.__filename(join(pluginFolder, filename));
                    const module = await import(file);
                    global.plugins[filename] = module.default || module;
                } catch (e) {
                    console.log(`Failed to load plugins ${filename}: ${e.message}`);
                    delete global.plugins[filename];
                }
            }
            console.log(`Successfully Loaded ${Object.keys(global.plugins).length} Plugins`);
        } else {
            console.log('Folder plugins tidak ditemukan, buat folder ./plugins/index');
        }
    } catch (e) {
        console.error('Error loading plugins:', e.message);
    }
}

await filesInit();

/* ============================================================
 * PLUGIN HOT RELOAD
 * ============================================================ */
global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        let dir = global.__filename(join(pluginFolder, filename), true);
        if (filename in global.plugins) {
            if (fs.existsSync(dir)) {
                console.log(`reload plugin '${filename}'`);
            } else {
                console.log(`deleted plugin '${filename}'`);
                return delete global.plugins[filename];
            }
        } else {
            console.log(`new plugin '${filename}'`);
        }

        let err = syntaxerror(fs.readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true
        });

        if (err) {
            console.error(`syntax error '${filename}'\n${format(err)}`);
        } else {
            try {
                const module = await import(`${global.__filename(dir)}?update=${Date.now()}`);
                global.plugins[filename] = module.default || module;
            } catch (e) {
                console.error(`error require plugin '${filename}\n${format(e)}'`);
            } finally {
                global.plugins = Object.fromEntries(
                    Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b))
                );
            }
        }
    }
};

/* ============================================================
 * WATCH PLUGIN
 * ============================================================ */
if (fs.existsSync(pluginFolder)) {
    fs.watch(pluginFolder, global.reload);
}

/* ============================================================
 * START HANDLER
 * ============================================================ */
await global.reloadHandler();

/* ============================================================
 * AUTO RESET LIMIT
 * ============================================================ */
console.log('Auto reset system aktif');

setInterval(async () => {
    if (!global.db?.data?.users) return;

    let now = new Date();
    let today = now.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    let jam = now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });

    if (jam !== '00.00' && jam !== '00:00') return;
    if (global.db.data.lastReset === today) return;

    global.db.data.lastReset = today;
    let jumlah = 50;
    let users = global.db.data.users;
    let total = 0;

    for (let jid in users) {
        let user = users[jid];
        if (!user) continue;
        if (user.premium || user.premiumTime > 0) continue;

        if (!Number.isFinite(user.limit) || user.limit < jumlah) {
            user.limit = jumlah;
        }
        total++;
    }

    await global.db.write().catch(console.error);
    console.log(`[AUTO RESET LIMIT]\nReset : ${total}\nLimit : ${jumlah}`);
}, 60000);

/* ============================================================
 * QUICK TEST
 * ============================================================ */
async function _quickTest() {
    let test = await Promise.all([
        spawn('ffmpeg'),
        spawn('ffprobe'),
        spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
        spawn('convert'),
        spawn('magick'),
        spawn('gm'),
        spawn('find', ['--version'])
    ].map(p => {
        return Promise.race([
            new Promise(resolve => p.on('close', code => resolve(code !== 127))),
            new Promise(resolve => p.on('error', () => resolve(false)))
        ]);
    }));

    let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
    global.support = { ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find };
    Object.freeze(global.support);

    if (!global.support.ffmpeg) console.log('Install ffmpeg (pkg install ffmpeg)');
    if (global.support.ffmpeg && !global.support.ffmpegWebp) console.log('Stickers may not animated without libwebp');
    if (!global.support.convert && !global.support.magick && !global.support.gm) console.log('Install imagemagick (pkg install imagemagick)');
}

await _quickTest();
console.log('Quick Test Done');

/* ============================================================
 * READY
 * ============================================================ */
console.log(chalk.green('Bot siap digunakan!'));
console.log(chalk.yellow('Scan QR atau masukkan pairing code di WhatsApp'));
