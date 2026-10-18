const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

function toBoldFont(text) {
return String(text).replace(/[A-Za-z0-9]/g, char => {
const normal = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const bold = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";
return bold[normal.indexOf(char)] || char;
});
}

module.exports = {
config: {
name: "help",
version: "2.0.0",
author: "BASSIT",
countDown: 3,
role: 0,
shortDescription: {
en: "Show all commands"
},
longDescription: {
en: "Display commands by category or show command details"
},
category: "info",
guide: {
en: "{pn} [command name]"
},
priority: 1
},

onStart: async function ({ message, args, event, threadsData, role }) {
	try {
		const { threadID } = event;
		const threadData = await threadsData.get(threadID);
		const prefix = getPrefix(threadID);
		const lang = threadData.data?.lang ||
			global.GoatBot.config.language || "en";

		if (args.length === 0) {
			const categories = new Map();

			for (const [name, command] of commands) {
				if (!command || !command.config)
					continue;

				const config = command.config;
				if ((config.role || 0) > role)
					continue;

				const category = config.category || "Other";

				if (!categories.has(category))
					categories.set(category, new Set());

				categories.get(category).add(name);
			}

			let msg = "";
			msg += "╭━━━━━━━━━━━━━━━━━━━━╮\n";
			msg += "       𝐁𝐀𝐒𝐒𝐈𝐓\n";
			msg += "   𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐌𝐄𝐍𝐔\n";
			msg += "╰━━━━━━━━━━━━━━━━━━━━╯\n";

			for (const [category, names] of
				[...categories.entries()].sort((a, b) =>
					a[0].localeCompare(b[0]))) {

				const sortedNames = [...names].sort();

				msg += `\n╭───『 ${toBoldFont(category.toUpperCase())} 』\n`;

				for (let i = 0; i < sortedNames.length; i += 3) {
					const line = sortedNames
						.slice(i, i + 3)
						.map(name => `✦ ${toBoldFont(name)}`);

					msg += `│ ${line.join("  |  ")}\n`;
				}

				msg += "╰──────────────────\n";
			}

			const totalCommands = [...categories.values()]
				.reduce((sum, names) => sum + names.size, 0);

			const hint = lang === "bn"
				? `বিস্তারিত জানতে ${prefix}help কমান্ড লিখুন।`
				: lang === "vi"
					? `Nhập ${prefix}help tên_lệnh để xem chi tiết.`
					: `Type ${prefix}help command to see details.`;

			msg += "\n╭────『 𝐈𝐍𝐅𝐎 』\n";
			msg += `│ ✦ 𝐓𝐎𝐓𝐀𝐋: ${totalCommands}\n`;
			msg += `│ ✦ 𝐏𝐑𝐄𝐅𝐈𝐗: ${prefix}\n`;
			msg += `│ ✦ ${hint}\n`;
			msg += "╰──────────────────\n";
			msg += "\n       𝐌𝐄𝐃𝐃𝐀𝐇\n";
			msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓";

			const sent = await message.reply({ body: msg });

			if (sent?.messageID) {
				setTimeout(() => {
					message.unsend(sent.messageID).catch(() => {});
				}, 80000);
			}
		} else {
			const commandName = args[0].toLowerCase();
			const realName = aliases.get(commandName) || commandName;
			const command = commands.get(commandName) ||
				commands.get(realName);

			if (!command || !command.config) {
				const notFound = lang === "bn"
					? `❌ কমান্ড "${commandName}" পাওয়া যায়নি।`
					: lang === "vi"
						? `❌ Không tìm thấy lệnh "${commandName}".`
						: `❌ Command "${commandName}" was not found.`;

				return message.reply(notFound);
			}

			const config = command.config;

			if ((config.role || 0) > role)
				return message.reply(
					"❌ You don't have permission to view this command."
				);

			let msg = "";
			msg += "╭━━━━━━━━━━━━━━━━━━━━╮\n";
			msg += "       𝐁𝐀𝐒𝐒𝐈𝐓\n";
			msg += "╰━━━━━━━━━━━━━━━━━━━━╯\n\n";
			msg += `✦ 𝐍𝐀𝐌𝐄: ${toBoldFont(config.name)}\n`;
			msg += `✦ 𝐕𝐄𝐑𝐒𝐈𝐎𝐍: ${config.version || "1.0"}\n`;
			msg += `✦ 𝐀𝐔𝐓𝐇𝐎𝐑: ${toBoldFont(config.author || "BASSIT")}\n`;
			msg += `✦ 𝐑𝐎𝐋𝐄: ${config.role || 0}\n`;
			msg += `✦ 𝐂𝐀𝐓𝐄𝐆𝐎𝐑𝐘: ${toBoldFont(config.category || "Other")}\n`;

			if (config.shortDescription) {
				const description = typeof config.shortDescription === "object"
					? config.shortDescription[lang] ||
						config.shortDescription.en ||
						""
					: config.shortDescription;

				msg += `✦ 𝐃𝐄𝐒𝐂𝐑𝐈𝐏𝐓𝐈𝐎𝐍: ${description}\n`;
			}

			if (config.guide) {
				const guide = typeof config.guide === "object"
					? config.guide[lang] || config.guide.en || ""
					: config.guide;

				msg += `\n✦ 𝐔𝐒𝐀𝐆𝐄:\n${guide.replace(/\{pn\}/g, prefix + config.name)}\n`;
			}

			const commandAliases = [];

			if (Array.isArray(config.aliases))
				commandAliases.push(...config.aliases);

			for (const [alias, target] of aliases) {
				if (target === config.name && !commandAliases.includes(alias))
					commandAliases.push(alias);
			}

			if (commandAliases.length)
				msg += `\n✦ 𝐀𝐋𝐈𝐀𝐒𝐄𝐒: ${commandAliases.map(toBoldFont).join(", ")}\n`;

			msg += "\n       𝐌𝐄𝐃𝐃𝐀𝐇\n";
			msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓";

			return message.reply({ body: msg });
		}
	} catch (error) {
		console.error("[BASSIT HELP ERROR]", error);
		return message.reply(
			"❌ An error occurred while loading the help menu."
		);
	}
}

};
