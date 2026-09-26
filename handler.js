import { smsg } from './lib/simple.js';
import { generateWAMessageFromContent, proto } from 'baileys'
import { format } from 'util';
import { fileURLToPath } from 'url';
import path from 'path';
import { unwatchFile, watchFile } from 'fs';
import chalk from 'chalk';
import { createWelcomeCard } from './lib/welcome.js'

const isNumber = (x) => typeof x === 'number' && !isNaN(x);
const cleanJid = jid => {
  if (!jid) return ''
  if (typeof jid !== 'string') jid = String(jid)

  return jid
    .replace(/:\d+@/g, '@')
    .replace('@lid', '@s.whatsapp.net')
}

const sameUser = (a, b) => {
  a = cleanJid(a).split('@')[0]
  b = cleanJid(b).split('@')[0]
  return a && b && a === b
}

const findParticipant = (participants = [], jid = '') => {
  jid = cleanJid(jid)

  return participants.find(v => {
    let ids = [
      v.id,
      v.jid,
      v.lid,
      v.phoneNumber
    ].filter(Boolean).map(cleanJid)

    return ids.some(x => sameUser(x, jid))
  }) || {}
}

/**
 * Handle messages upsert
 * @param {import('baileys').BaileysEventMap<unknown>['messages.upsert']} groupsUpdate
 */
export async function handler(chatUpdate) {
	if (!chatUpdate) return;
	this.pushMessage(chatUpdate.messages).catch(console.error);
	let m = chatUpdate.messages[chatUpdate.messages.length - 1];
	if (!m) return;
	if (global.db.data == null) await global.loadDatabase();
	try {
	m = smsg(this, m) || m;
if (!m) return;

// ==================
// ❌ ANTI BUG
// ==================
if (m.chat === 'status@broadcast') return
if (!m.message) return
if (m.key.fromMe && !m.text?.startsWith('.')) return
if (m.isBaileys) return

// ==================
// 👑 OWNER SYSTEM (WAJIB PALING ATAS)
// ==================
const isROwner = [this.decodeJid(this.user.id), ...global.owner.map(([id]) => id + '@s.whatsapp.net')]
  .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
  .includes(m.sender)

const isOwner = isROwner || m.fromMe
const isMods = isOwner || global.mods?.some(v => m.sender.includes(v))

// ==================
// 📊 DATABASE INIT
// ==================
global.db.data.users[m.sender] ||= {}
global.db.data.chats[m.chat] ||= {}

let userData = global.db.data.users[m.sender]

// Default field
userData.exp ??= 0
userData.level ??= 0
userData.money ??= 0
userData.limit ??= 50
userData.premiumTime ??= 0
userData.lastclaim ??= 0
userData.lastWarn ??= 0

// Repair database lama
if (!Number.isFinite(userData.exp))
    userData.exp = 0

if (!Number.isFinite(userData.level))
    userData.level = 0

if (!Number.isFinite(userData.money))
    userData.money = 0

if (!Number.isFinite(userData.limit))
    userData.limit = 50

// ==================
// 🧠 BASIC INFO
// ==================
const isGroup = m.key?.remoteJid?.endsWith('@g.us')

// ==================
// 💎 PREMIUM
// ==================
const isPrems = isROwner || userData.premiumTime > 0

// ==================
// 🚫 SKIP STATUS / STORY
// ==================
const isStatus = m.key?.remoteJid === 'status@broadcast' || m.key?.participant === 'status@broadcast'
if (isStatus) return

// ==================
// 🚫 PRIVATE CHAT
// ==================
const prefix = /^[.!#/$]/

if (!isGroup) {
  const body = typeof m.text === 'string' ? m.text.trim() : ''

  // harus diawali prefix
  if (!prefix.test(body)) return

  // ambil command setelah prefix
  const cmd = body.slice(1).trim()

  // kalau cuma "." atau "!" dll → skip
  if (!cmd) return

  // cek premium
  if (!isPrems) {
    // if (!userData.lastWarn || Date.now() - userData.lastWarn > 10000) {
      // userData.lastWarn = Date.now()
      // await m.reply('🚫 Private chat hanya untuk user premium!')
    return
  }
}

// ==================
// 🚫 GC / PC ONLY
// ==================
if (global.opts?.gconly && !isGroup) return
if (global.opts?.pconly && isGroup) return

// ==================
// ⚙️ EXP LIMIT
// ==================
m.exp = 0;
m.limit = false;

		if (m.sender.endsWith('@broadcast') || m.sender.endsWith('@newsletter')) return;
		await (await import(`./lib/database.js?v=${Date.now()}`)).default(m, this);

		if (typeof m.text !== 'string') m.text = '';

	if (!global.db.data.settings[this.user.jid].public && !m.fromMe) return;
if (m.isBaileys) return;
m.exp += Math.ceil(Math.random() * 10);

		let usedPrefix;
		let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender];

		const groupMetadata = m.isGroup ? await conn.groupMetadata(m.chat).catch(() => ({})) : {}
        const participants = m.isGroup ?(groupMetadata.participants || []) : []
        
const botJid = cleanJid(this.user?.id || conn.user?.id)

const groupUser = m.isGroup
  ? findParticipant(participants, m.sender || m.key?.participant)
  : {}

const bot = m.isGroup
  ? findParticipant(participants, botJid)
  : {}

const isRAdmin = groupUser?.admin === 'superadmin'
const isAdmin = isRAdmin || groupUser?.admin === 'admin'
const isBotAdmin = ['admin', 'superadmin'].includes(bot?.admin)
		
// ==================
//  ADMIN ONLY
// ==================
let chat = global.db.data.chats[m.chat]

// deteksi command dari awal
const isCmd = prefix.test(m.text || '')

if (m.isGroup && chat.adminOnly && !isAdmin && !isOwner && isCmd) {
  return m.reply('🚫 Fitur hanya untuk admin grup!')
}

		const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
		for (let name in global.plugins) {
    if (global.opts?.gconly && !isGroup) continue
    if (global.opts?.pconly && isGroup) continue
			let plugin = global.plugins[name];
			if (!plugin) continue;
			if (plugin.disabled) continue;
			const __filename = path.join(___dirname, name);
			if (typeof plugin.all === 'function') {
				try {
					await plugin.all.call(this, m, {
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					});
				} catch (e) {
					// if (typeof e === 'string') continue
					console.error(e);
					for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
						let data = (await conn.onWhatsApp(jid))[0] || {};
						if (data.exists) m.reply(`*Plugin:* ${name}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${m.text}\n\n\`\`\`${format(e)}\`\`\``.trim(), data.jid);
					}
				}
			}
			if (plugin.tags && plugin.tags.includes('admin')) {
				// global.dfail('restrict', m, this)
				continue;
			}
			const str2Regex = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
			let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix;
			let match = (
				_prefix instanceof RegExp // RegExp Mode?
					? [[_prefix.exec(m.text), _prefix]]
					: Array.isArray(_prefix) // Array?
						? _prefix.map((p) => {
								let re =
									p instanceof RegExp // RegExp in Array?
										? p
										: new RegExp(str2Regex(p));
								return [re.exec(m.text), re];
							})
						: typeof _prefix === 'string' // String?
							? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
							: [[[], new RegExp()]]
			).find((p) => p[1]);
			if (typeof plugin.before === 'function') {
				if (
					await plugin.before.call(this, m, {
						match,
						conn: this,
						participants,
						groupMetadata,
						user: groupUser ,
						bot,
						isROwner,
						isOwner,
						isRAdmin,
						isAdmin,
						isBotAdmin,
						isPrems,
						chatUpdate,
						__dirname: ___dirname,
						__filename,
					})
				)
					continue;
			}
			if (typeof plugin !== 'function') continue;
			if ((usedPrefix = (match[0] || '')[0])) {
				let noPrefix = m.text.replace(usedPrefix, '');
				let [command, ...args] = noPrefix.trim().split` `.filter((v) => v);
				args = args || [];
				let _args = noPrefix.trim().split` `.slice(1);
				let text = _args.join` `;
				command = (command || '').toLowerCase();
				let fail = plugin.fail || global.dfail; // When failed
				let isAccept =
					plugin.command instanceof RegExp // RegExp Mode?
						? plugin.command.test(command)
						: Array.isArray(plugin.command) // Array?
							? plugin.command.some((cmd) =>
									cmd instanceof RegExp // RegExp in Array?
										? cmd.test(command)
										: cmd === command
								)
							: typeof plugin.command === 'string' // String?
								? plugin.command === command
								: false;

				if (!isAccept) continue;
				m.plugin = name;
				if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
					let chat = global.db.data.chats[m.chat];
					let user = global.db.data.users[m.sender];
					if (name != 'owner-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'tools-delete.js' && chat?.isBanned) return; // Except this
					if (name != 'owner-unbanuser.js' && user?.banned) return;
				}
				if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
					// Both Owner
					fail('owner', m, this);
					continue;
				}
				if (plugin.rowner && !isROwner) {
					// Real Owner
					fail('rowner', m, this);
					continue;
				}
				if (plugin.owner && !isOwner) {
					// Number Owner
					fail('owner', m, this);
					continue;
				}
				if (plugin.mods && !isMods) {
					// Moderator
					fail('mods', m, this);
					continue;
				}
				if (plugin.premium && !isPrems) {
					// Premium
					fail('premium', m, this);
					continue;
				}
				if (plugin.group && !m.isGroup) {
					// Group Only
					fail('group', m, this);
					continue;
				} else if (plugin.botAdmin && !isBotAdmin) {
					// You Admin
					fail('botAdmin', m, this);
					continue;
				} else if (plugin.admin && !isAdmin) {
					// User Admin
					fail('admin', m, this);
					continue;
				}
				if (plugin.private && m.isGroup) {
					// Private Chat Only
					fail('private', m, this);
					continue;
				}
				if (plugin.register == true && _user.registered == false) {
					// Butuh daftar?
					fail('unreg', m, this);
					continue;
				}
				m.isCommand = true;
				let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17; // XP Earning per command
				if (xp > 200)
					m.reply('Ngecit -_-'); // Hehehe
				else m.exp += xp;
				if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
					this.reply(m.chat, `[❗] Limit anda habis, silahkan beli melalui *${usedPrefix}buy limit*`, m);
					continue; // Limit habis
				}
				if (plugin.level > _user.level) {
					this.reply(m.chat, `[💬] Diperlukan level ${plugin.level} untuk menggunakan perintah ini\n*Level mu:* ${_user.level} 📊`, m);
					continue; // If the level has not been reached
				}
				let extra = {
					match,
					usedPrefix,
					noPrefix,
					_args,
					args,
					command,
					text,
					conn: this,
					participants,
					groupMetadata,
					user: groupUser ,
					bot,
					isROwner,
					isOwner,
					isRAdmin,
					isAdmin,
					isBotAdmin,
					isPrems,
					chatUpdate,
					__dirname: ___dirname,
					__filename,
				};
				try {
					await plugin.call(this, m, extra);
					if (!isPrems) m.limit = m.limit || plugin.limit || false;
				} catch (e) {
					// Error occured
					m.error = e;
					console.error(e);
					if (e) {
						let text = format(e);
						if (e.name)
							for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
								let data = (await conn.onWhatsApp(jid))[0] || {};
								if (data.exists)
									m.reply(
										`*🗂️ Plugin:* ${m.plugin}\n*👤 Sender:* ${m.sender}\n*💬 Chat:* ${m.chat}\n*💻 Command:* ${usedPrefix}${command} ${args.join(' ')}\n📄 *Error Logs:*\n\n\`\`\`${text}\`\`\``.trim(),
										data.jid
									);
							}
						m.reply(text);
					}
				} finally {
					// m.reply(util.format(_user))
					if (typeof plugin.after === 'function') {
						try {
							await plugin.after.call(this, m, extra);
						} catch (e) {
							console.error(e);
						}
					}
					if (m.limit) m.reply(+m.limit + ' Limit terpakai ✔️');
				}
				break;
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		//console.log(global.db.data.users[m.sender])
		let user,
			stats = global.db.data.stats;
		if (m) {
			if (m.sender && (user = global.db.data.users[m.sender])) {

    // Repair data rusak
    if (!Number.isFinite(user.exp))
        user.exp = 0

    if (!Number.isFinite(user.limit))
        user.limit = 50

    const exp = Number(m.exp) || 0
    const cost = Number(m.limit)

    user.exp += exp

    if (Number.isFinite(cost) && cost > 0) {
        user.limit = Math.max(0, user.limit - cost)
    }
}

			let stat;
			if (m.plugin) {
				let now = Date.now();
				if (m.plugin in stats) {
					stat = stats[m.plugin];
					if (!isNumber(stat.total)) stat.total = 1;
					if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1;
					if (!isNumber(stat.last)) stat.last = now;
					if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now;
				} else
					stat = stats[m.plugin] = {
						total: 1,
						success: m.error != null ? 0 : 1,
						last: now,
						lastSuccess: m.error != null ? 0 : now,
					};
				stat.total += 1;
				stat.last = now;
				if (m.error == null) {
					stat.success += 1;
					stat.lastSuccess = now;
				}
			}
		}

		try {
			await (await import(`./lib/print.js`)).default(m, this);
		} catch (e) {
			console.log(m, m.quoted, e);
		}
		if (global.db.data.settings[this.user.jid]?.autoread) await conn.readMessages([m.key]);
	}
}

/**
 * Handle groups participants update
 * @param {import('baileys').BaileysEventMap<unknown>['group-participants.update']} groupsUpdate
 */


const fixJid = async (conn, jid) => {
  jid = cleanJid(jid)

  try {
    const data = await conn.findUserId(jid)
    return cleanJid(data?.phoneNumber || data?.jid || jid)
  } catch {
    return jid
  }
}

const sendForceMention = async (
  conn,
  jid,
  text,
  mentions = [],
  quoted = null
) => {

  const msg = generateWAMessageFromContent(
    jid,
    {
      extendedTextMessage:
        proto.Message.ExtendedTextMessage.fromObject({
          text,
          contextInfo: {
            mentionedJid: mentions
          }
        })
    },
    quoted ? { quoted } : {}
  )

  return conn.relayMessage(
    jid,
    msg.message,
    {
      messageId: msg.key.id
    }
  )
}

export async function participantsUpdate({
  id,
  participants,
  action,
  simulate = false
}) {

  if (this.isInit && !simulate) return

  if (global.db.data == null)
    await global.loadDatabase()

  let chat = global.db.data.chats[id] || {}

  const groupMetadata =
    (this.chats[id] || {}).metadata ||
    await this.groupMetadata(id).catch(() => ({}))

  switch (action) {

    case 'add':
case 'remove':

  if (!chat.welcome) break

  for (let user of participants) {

    user = await fixJid(
      this,
      user?.phoneNumber ||
      user?.id ||
      user
    )

    const metadata = await this
      .groupMetadata(id)
      .catch(() => groupMetadata || {})

    const groupName =
      metadata.subject ||
      this.getName(id) ||
      'Group'

    const groupDesc =
      metadata.desc ||
      metadata.description ||
      'Tidak ada deskripsi grup'

    const totalMember =
      metadata.participants?.length || 0

    const memberCount =
      action === 'add'
        ? totalMember
        : Math.max(totalMember - 1, 0)

    const pp = await this
      .profilePictureUrl(user, 'image')
      .catch(() => null)

    const card = await createWelcomeCard({
      avatar: pp,
      username: '@' + user.split('@')[0],
      groupName,
      memberCount,
      type: action === 'add'
        ? 'welcome'
        : 'goodbye'
    })

    const text = (
      action === 'add'
        ? chat.sWelcome ||
          this.welcome ||
          `✨ Waku Waku~

Welcome @user

🌸 Member ke-@member
👥 Total Member: @member

Selamat datang di @subject`
        : chat.sBye ||
          this.bye ||
          `🥜 Hweh...

Goodbye @user

Terima kasih sudah menjadi bagian dari @subject

👥 Sisa Member: @member`
    )
      .replace(/@user/g, '@' + user.split('@')[0])
      .replace(/@subject/g, groupName)
      .replace(/@desc/g, groupDesc)
      .replace(/@member/g, String(memberCount))

    await this.sendMessage(id, {
      image: card,
      caption: text,
      mentions: [user]
    })
  }

  break

    case 'promote':
    case 'demote':

      if (!chat.detect) break

      for (let user of participants) {

        user = await fixJid(
          this,
          user?.phoneNumber ||
          user?.id ||
          user
        )

        let text = (
          action === 'promote'
            ? chat.sPromote ||
              '@user sekarang admin'
            : chat.sDemote ||
              '@user bukan admin lagi'
        )
        .replace(
          /@user/g,
          '@' + user.split('@')[0]
        )

        await sendForceMention(
          this,
          id,
          text,
          [user]
        )
      }

      break
  }
}


/**
 * Handle groups update
 * @param {import('baileys').BaileysEventMap<unknown>['groups.update']} groupsUpdate
 */
export async function groupsUpdate(groupsUpdate) {
	for (const groupUpdate of groupsUpdate) {
		const id = groupUpdate.id;
		if (!id) continue;
		let chats = global.db.data.chats[id],
			text = '';
		if (!chats?.detect) continue;
		if (groupUpdate.desc) text = (chats.sDesc || this.sDesc || conn.sDesc || '```Description has been changed to```\n@desc').replace('@desc', groupUpdate.desc);
		if (groupUpdate.subject) text = (chats.sSubject || this.sSubject || conn.sSubject || '```Subject has been changed to```\n@subject').replace('@subject', groupUpdate.subject);
		if (groupUpdate.icon) text = (chats.sIcon || this.sIcon || conn.sIcon || '```Icon has been changed to```').replace('@icon', groupUpdate.icon);
		if (groupUpdate.revoke) text = (chats.sRevoke || this.sRevoke || conn.sRevoke || '```Group link has been changed to```\n@revoke').replace('@revoke', groupUpdate.revoke);
		if (!text) continue;
		await this.sendMessage(id, { text, mentions: this.parseMention(text) });
	}
}

export async function deleteUpdate(message) {
	try {
		const { fromMe, id, participant } = message;
		if (fromMe) return;
		let msg = this.serializeM(this.loadMessage(id));
		if (!msg) return;
		let chat = global.db.data.chats[msg.chat];
		if (!chat.delete) return;
		await this.reply(
			msg.chat,
			`
Terdeteksi @${cleanJid(participant).split('@')[0]} telah menghapus pesan
Untuk mematikan fitur ini, ketik
*.enable delete*
`.trim(),
			msg,
			{
				mentions: [cleanJid(participant)],
			}
		);
		this.copyNForward(msg.chat, msg).catch((e) => console.log(e, msg));
	} catch (e) {
		console.error(e);
	}
}

global.dfail = (type, m, conn) => {
  let msg = {
    rowner: (m, conn) => conn.reply(m.chat, `Ara~ command ini hanya untuk developer bot`, m),

    owner: (m, conn) => conn.reply(m.chat, `Nee~ command ini khusus owner`, m),

    mods: (m, conn) => conn.reply(m.chat, `Hehe~ hanya moderator yang boleh pakai fitur ini`, m),

    premium: (m, conn) => conn.reply(m.chat, `Ups~ fitur ini khusus pengguna premium`, m),

    group: (m, conn) => conn.reply(m.chat, `Ara~ command ini cuma bisa dipakai di grup`, m),

    private: (m, conn) => conn.reply(m.chat, `Nee~ command ini hanya bisa dipakai di chat pribadi`, m),

    admin: (m, conn) => conn.reply(m.chat, `Hehe~ hanya admin grup yang boleh pakai fitur ini`, m),

    botAdmin: (m, conn) => conn.reply(m.chat, `Ara~ jadikan aku admin dulu`, m),

    unreg: (m, conn) =>
      conn.reply(
        m.chat,
        `Ara~ kamu belum terdaftar.\nDaftar dulu ya kalau mau pakai fiturku~\n.daftar Nama.Umur`,
        m
      ),
  }[type]

  if (!msg) return
  return msg(m, conn)
}
let file = global.__filename(import.meta.url, true);
watchFile(file, async () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'handler.js'"));
	if (global.reloadHandler) console.log(await global.reloadHandler());
});
