const Discord = require('discord.js');
const veritabani = require('quick.db');
const moment = require('moment');
const ytdlDiscord = require("discord-ytdl-core");
const ayarlar = require('./ayarlar.js');
const client = new Discord.Client({ ws: { intents: Discord.Intents.ALL }});

moment.locale('tr-TR');

client.on('ready', async() => {
	client.user.setActivity(`${ayarlar.botDurum} ${ayarlar.sunucuIsim}`, { type: ayarlar.botOynuyor })
	console.log(`[BOT]: Bot ${client.user.username} adı ile giriş yaptı.`);
	play();
});

client.on('voiceStateUpdate', async function(oldState, newState) {
	if ((oldState.member && oldState.member.user.bot) || (newState.member && newState.member.user.bot)) return;
	if (newState.channelID == ayarlar.sesKanal){
		if (client.channels.cache.get(ayarlar.sesKanal).members.some(member => member.roles.cache.has(ayarlar.sunucuKayitciRol)) == true) client.channels.cache.get(ayarlar.sesKanal).leave();
	} else if (oldState.channelID == ayarlar.sesKanal){
		if (client.channels.cache.get(ayarlar.sesKanal).members.some(member => member.roles.cache.has(ayarlar.sunucuKayitciRol)) == false) play();
	}
});

client.on('guildMemberAdd', async(member) => {
	let role = member.guild.roles.cache.get(ayarlar.sunucuKayitsizRol), channel = member.guild.channels.cache.get(ayarlar.sunucuKayitKanal);
	member.setNickname(`${ayarlar.sunucuTag != "Yok" ? (ayarlar.sunucuTag + ' ') : ('')}İsim ${ayarlar.sunucuYasIsaret != "Yok" ? (ayarlar.sunucuYasIsaret) : ('|')} Yaş`)
	member.roles.set([role.id]);
	channel.send(`:tada: ${ayarlar.sunucuIsim}'a hoş geldiniz ${member}! Sizinle beraber \`${member.guild.memberCount}\` kişiye ulaştık!\n\nHesabınız \`${moment.utc(member.user.createdAt).format('DD MMMM YYYY, HH:mm')}\` tarihinde oluşturulmuş.\n\nSes Teyit odalarına giriş yaparak kayıt olabilirsiniz. <@&${ayarlar.sunucuKayitciRol}> rolüne sahip yetkili arkadaşlarımız sizinle ilgilenecektir.\n\nSunucu kurallarımız <#${ayarlar.sunucuKurallarKanal}> kanalında belirtilmiştir. Unutmayın sunucu içerisinde ki ceza işlemleriniz kuralları okuduğunuzu varsayarak gerçekleştirilecektir.`);
});

client.on('message', async(message) => {
	if (!message.content.startsWith(ayarlar.botPrefix) || message.author.bot) return;
	if (message.member.hasPermission('MANAGE_ROLES') && !veritabani.get(`kayitSayi_${message.author.id}`)) veritabani.set(`kayitSayi_${message.author.id}`, 0);

	const args = message.content.slice(ayarlar.botPrefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();

	let embed = new Discord.MessageEmbed().setColor('RANDOM').setFooter(ayarlar.botDurum + ' ' + ayarlar.sunucuIsim);

	if (command === 'tag') {
		message.channel.send(ayarlar.sunucuTag);
	}

	if (['erkek', 'e', "boy", "male"].includes(command)) {
		if (args.length < 1) return message.channel.send(embed.setAuthor('Komut Yanlış!').setDescription(`**\`>\`** **${ayarlar.botPrefix}erkek <kişi etiket/id> [isim] [yaş]**`));
		let user, role, channel;
		if (args.length == 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			if (!message.guild.me.hasPermission('ADMINISTRATOR')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Yönetici yetkisi vermen gerekiyor yoksa kişiyi kayıt edemem.`));
			if (user.id == message.author.id) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kendi kendini kayıt edemezsin.`));
			if (!message.member.roles.cache.has(ayarlar.sunucuKayitciRol) && !message.member.hasPermission('MANAGE_ROLES')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kişiyi kayıt etme yetkin yok.`));
			role = message.guild.roles.cache.get(ayarlar.sunucuErkekRol);
			veritabani.set(`kayitSayi_${message.author.id}`, parseInt(veritabani.get(`kayitSayi_${message.author.id}`))+1);
			user.roles.set([role]).then(() => {
				channel = message.guild.channels.cache.get(ayarlar.sunucuGenelKanal);
				channel.send(embed.setAuthor('Yeni Bir Üye Katıldı!').setDescription(`**\`>\`** ${user} kişisi ${role} rolleri ile aramıza katıldı.\n**\`>\`** Toplam \`${message.guild.memberCount}\` üye olduk.\n\n**\`>\` Kayıt Yetkilisi:** ${message.author}\n**\`>\` Toplam Kayıt Sayısı:** ${veritabani.get(`kayitSayi_${message.author.id}`)}`))
			});
			message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.`));
		} else if (args.length > 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			if (!message.guild.me.hasPermission('ADMINISTRATOR')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Yönetici yetkisi vermen gerekiyor yoksa kişiyi kayıt edemem.`));
			if (user.id == message.author.id) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kendi kendini kayıt edemezsin.`));
			if (!message.member.roles.cache.has(ayarlar.sunucuKayitciRol) && !message.member.hasPermission('MANAGE_ROLES')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kişiyi kayıt etme yetkin yok.`));
			role = message.guild.roles.cache.get(ayarlar.sunucuErkekRol);
			user.setNickname(`${ayarlar.sunucuTag != "Yok" ? (ayarlar.sunucuTag + ' ') : ('')}${args[1]} ${args[2] ? (ayarlar.sunucuYasIsaret != "Yok" ? (ayarlar.sunucuYasIsaret + ' ' + args[2]) : ('| ' + args[2])) : ('')}`)
			veritabani.set(`kayitSayi_${message.author.id}`, parseInt(veritabani.get(`kayitSayi_${message.author.id}`))+1);
			user.roles.set([role]).then(() => {
				channel = message.guild.channels.cache.get(ayarlar.sunucuGenelKanal);
				channel.send(embed.setAuthor('Yeni Bir Üye Katıldı!').setDescription(`**\`>\`** ${user} kişisi ${role} rolleri ile aramıza katıldı.\n**\`>\`** Toplam \`${message.guild.memberCount}\` üye olduk.\n\n**\`>\` Kayıt Yetkilisi:** ${message.author}\n**\`>\` Toplam Kayıt Sayısı:** ${veritabani.get(`kayitSayi_${message.author.id}`)}`))
			});
			if (veritabani.get(`oncekiIsimler_${user.id}`)) {
				message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.\n**\`>\`** Önceki İsimler: \`${veritabani.get(`oncekiIsimler_${user.id}`).toString()}\``));
			} else {
				message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.`));
			}
			veritabani.push(`oncekiIsimler_${user.id}`, args[1] + ' | ' + args[2]);
		}
	}

	if (['kadın', 'kadin', 'k', "girl", "female"].includes(command)) {
		if (args.length < 1) return message.channel.send(embed.setAuthor('Komut Yanlış!').setDescription(`**\`>\`** **${ayarlar.botPrefix}kadın <kişi etiket/id> [isim] [yaş]**`));
		let user, role, channel;
		if (args.length == 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			if (!message.guild.me.hasPermission('ADMINISTRATOR')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Yönetici yetkisi vermen gerekiyor yoksa kişiyi kayıt edemem.`));
			if (user.id == message.author.id) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kendi kendini kayıt edemezsin.`));
			if (!message.member.roles.cache.has(ayarlar.sunucuKayitciRol) && !message.member.hasPermission('MANAGE_ROLES')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kişiyi kayıt etme yetkin yok.`));
			role = message.guild.roles.cache.get(ayarlar.sunucuKadinRol);
			veritabani.set(`kayitSayi_${message.author.id}`, parseInt(veritabani.get(`kayitSayi_${message.author.id}`))+1);
			user.roles.set([role]).then(() => {
				channel = message.guild.channels.cache.get(ayarlar.sunucuGenelKanal);
				channel.send(embed.setAuthor('Yeni Bir Üye Katıldı!').setDescription(`**\`>\`** ${user} kişisi ${role} rolleri ile aramıza katıldı.\n**\`>\`** Toplam \`${message.guild.memberCount}\` üye olduk.\n\n**\`>\` Kayıt Yetkilisi:** ${message.author}\n**\`>\` Toplam Kayıt Sayısı:** ${veritabani.get(`kayitSayi_${message.author.id}`)}`))
			});
			message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.`));
		} else if (args.length > 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			if (!message.guild.me.hasPermission('ADMINISTRATOR')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Yönetici yetkisi vermen gerekiyor yoksa kişiyi kayıt edemem.`));
			if (user.id == message.author.id) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kendi kendini kayıt edemezsin.`));
			if (!message.member.roles.cache.has(ayarlar.sunucuKayitciRol) && !message.member.hasPermission('MANAGE_ROLES')) return message.channel.send(embed.setColor('RED').setAuthor('Hata Oluştu!').setDescription(`**\`>\`** Kişiyi kayıt etme yetkin yok.`));
			role = message.guild.roles.cache.get(ayarlar.sunucuKadinRol);
			user.setNickname(`${ayarlar.sunucuTag != "Yok" ? (ayarlar.sunucuTag + ' ') : ('')}${args[1]} ${args[2] ? (ayarlar.sunucuYasIsaret != "Yok" ? (ayarlar.sunucuYasIsaret + ' ' + args[2]) : ('| ' + args[2])) : ('')}`)
			veritabani.set(`kayitSayi_${message.author.id}`, parseInt(veritabani.get(`kayitSayi_${message.author.id}`))+1);
			user.roles.set([role]).then(() => {
				channel = message.guild.channels.cache.get(ayarlar.sunucuGenelKanal);
				channel.send(embed.setAuthor('Yeni Bir Üye Katıldı!').setDescription(`**\`>\`** ${user} kişisi ${role} rolleri ile aramıza katıldı.\n**\`>\`** Toplam \`${message.guild.memberCount}\` üye olduk.\n\n**\`>\` Kayıt Yetkilisi:** ${message.author}\n**\`>\` Toplam Kayıt Sayısı:** ${veritabani.get(`kayitSayi_${message.author.id}`)}`))
			});
			if (veritabani.get(`oncekiIsimler_${user.id}`)) {
				message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.\n**\`>\`** Önceki İsimler: \`${veritabani.get(`oncekiIsimler_${user.id}`).toString()}\``));
			} else {
				message.channel.send(embed.setAuthor('Kayıt Edildi!').setDescription(`**\`>\`** ${user} kişisi ${role} rolü ile kayıt edildi.`));
			}
			veritabani.push(`oncekiIsimler_${user.id}`, args[1] + ' | ' + args[2]);
		}
	}

	if (['vip', 'viper', 'vipyap', 'v', 'givevip', 'gv'].includes(command)) {
		if (args.length < 1) return message.channel.send(embed.setAuthor('Komut Yanlış!').setDescription(`**\`>\`** **${ayarlar.botPrefix}vip <kişi etiket/id>**`));
		if (args.length == 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			let role = message.guild.roles.cache.get(ayarlar.sunucuVIPRol);
			user.roles.add(role);
			message.channel.send(embed.setAuthor('VIP Verildi!').setDescription(`${user} kişisine ${role} başarıyla verildi.`));
		}
	}

	if (['isimler', 'isim', 'i', 'names', 'name'].includes(command)) {
		if (args.length < 1) return message.channel.send(embed.setAuthor('Komut Yanlış!').setDescription(`**\`>\`** **${ayarlar.botPrefix}isimler <kişi etiket/id>**`));
		if (args.length == 1) {
			user = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
			message.channel.send(embed.setAuthor('Kişinin Önceki İsimleri:').setDescription(`**\`>\`** ${user} kişisinin önceki isimleri:\n*${veritabani.get(`oncekiIsimler_${user.id}`).toString()}*`));
		}
	}

	if (['topteyit', 'teyit', 'topkayıt', 'kayıtsayı'].includes(command)) {
		let arr = [];
		message.guild.members.cache.forEach(member => {
			arr.push({name: member.displayName, value: veritabani.get(`kayitSayi_${member.id}`) ? (veritabani.get(`kayitSayi_${member.id}`)) : (0)});
		});
		arr.sort(function (a, b) {
			return b.value - a.value;
		});
		message.channel.send(embed.setAuthor('Kayıt Sayısı Sıralaması (En İyi 10)').setDescription(`**\`>\`** **1.** ${arr[0].name} - ${arr[0].value} kayıt\n**\`>\`** **2.** ${arr[1].name} - ${arr[1].value} kayıt\n**\`>\`** **3.** ${arr[2].name} - ${arr[2].value} kayıt\n**\`>\`** **4.** ${arr[3].name} - ${arr[3].value} kayıt\n**\`>\`** **5.** ${arr[4].name} - ${arr[4].value} kayıt\n**\`>\`** **6.** ${arr[5].name} - ${arr[5].value} kayıt\n**\`>\`** **7.** ${arr[6].name} - ${arr[6].value} kayıt\n**\`>\`** **8.** ${arr[7].name} - ${arr[7].value} kayıt\n**\`>\`** **9.** ${arr[8].name} - ${arr[8].value} kayıt\n**\`>\`** **10.** ${arr[9].name} - ${arr[9].value} kayıt`));
	}
});

async function play() { 
	let url = await ytdlDiscord(ayarlar.sesVideoURL, {
		filter: "audioonly",
		opusEncoded: true,
		encoderArgs: ['-af', 'bass=g=10,dynaudnorm=f=200']
	});
	let streamType = ayarlar.sesVideoURL.includes("youtube.com") ? "opus" : "ogg/opus";
	client.channels.cache.get(ayarlar.sesKanal).join().then(async connection => {
    	if (client.channels.cache.get(ayarlar.sesKanal).members.some(member => member.roles.cache.has(ayarlar.sunucuKayitciRol)) == false) {
      		connection.play(url, {type: streamType}).on("finish", () => {
        		play(url);
      		}); 
    	} else play(url);
  	});
}

client.login(ayarlar.botToken);
