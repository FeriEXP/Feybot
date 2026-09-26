import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

global.pairingNumber = 628xcc;
global.owner = [['628ccx', 'Hamm', true]];
global.mods = [];

global.namebot = 'Anya ᴍᴅ ʙy ʜamm';
global.author = 'Hamm';

// JANGAN DI UBAH 
global.ownerNumber = global.owner?.[0]?.[0] || '';
global.ownerName = global.owner?.[0]?.[1] || 'Owner';

// =========================
// BACKUP CONFIG
// =========================
global.backupGroupLink = 'https://chat.whatsapp.com/Hy2CL7YS1phI8uxaZANvkr' //buat grup khusus backup aja

global.wait = '✨ _Wait..._';
global.eror = '🚩 Terjadi Kesalahan...';

global.pakasir = {
	slug: 'hilman',
	apikey: 'bpWDefVpINpZmFwIeZ9lNta5YT9jxYej',
	expired: 30,
};

global.stickpack = 'Sticker';
global.stickauth = namebot;

global.multiplier = 38;

/*============== PANEL ==============*/
global.panel = {
  domain: "https://bokepytta.com",
  ptla: "ptla_xxxxxxxxx",
  ptlc: "ptlc_xxxxxxxxx",
  egg: 15,
  loc: 1
};

global.APIs = {
    faa: 'https://api-faa.my.id',
    deline: 'https://api.deline.web.id'
}

/*============== EMOJI ==============*/
global.rpg = {
	emoticon(string) {
		string = string.toLowerCase();
		let emot = {
			level: '📊',
			limit: '🎫',
			health: '❤️',
			stamina: '🔋',
			exp: '✨',
			money: '💹',
			bank: '🏦',
			potion: '🥤',
			diamond: '💎',
			common: '📦',
			uncommon: '🛍️',
			mythic: '🎁',
			legendary: '🗃️',
			superior: '💼',
			pet: '🔖',
			trash: '🗑',
			armor: '🥼',
			sword: '⚔️',
			pickaxe: '⛏️',
			fishingrod: '🎣',
			wood: '🪵',
			rock: '🪨',
			string: '🕸️',
			horse: '🐴',
			cat: '🐱',
			dog: '🐶',
			fox: '🦊',
			petFood: '🍖',
			iron: '⛓️',
			gold: '🪙',
			emerald: '❇️',
			upgrader: '🧰',
		};
		let results = Object.keys(emot)
			.map((v) => [v, new RegExp(v, 'gi')])
			.filter((v) => v[1].test(string));
		if (!results.length) return '';
		else return emot[results[0][0]];
	},
};

let file = fileURLToPath(import.meta.url);
watchFile(file, () => {
	unwatchFile(file);
	console.log(chalk.redBright("Update 'config.js'"));
	import(`${file}?update=${Date.now()}`);
});
