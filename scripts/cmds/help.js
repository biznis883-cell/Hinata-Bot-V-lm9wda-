
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const HELP_IMAGE =
	"https://i.postimg.cc/x8pCxHYL/ab7788f8e883487fd687688bab275830.jpg";

function getText(value, lang = "en") {
	if (typeof value === "object" && value !== null) {
		return value[lang] || value.en || "";
	}
	return value || "";
}

module.exports = {
	config: {
		name: "help",
		version: "3.0.0",
		author: "BASSIT",
		countDown: 3,
		role: 0,
		shortDescription: {
			en: "Show help image and commands"
		},
		longDescription: {
			en: "Reply to the help image to display the command list"
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
			const prefix = getPrefix(threadID);

			const threadData = await threadsData.get(threadID);
			const lang =
				threadData?.data?.lang ||
				global.GoatBot.config.language ||
				"en";

			// help command without arguments: send image
			if (args.length === 0) {
				const sent = await message.reply({
					attachment: await global.utils.getStreamFromURL(HELP_IMAGE),
					body: "𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓\n\nReply to this image to view all commands."
				});

				if (sent?.messageID) {
					global.GoatBot.onReply.set(sent.messageID, {
						commandName: "help",
						messageID: sent.messageID,
						author: event.senderID,
						threadID
					});
				}
				return;
			}

			// help command with a command name
			const commandName = args[0].toLowerCase();
			const realName = aliases.get(commandName) || commandName;
			const command =
				commands.get(commandName) ||
				commands.get(realName);

			if (!command || !command.config) {
				return message.reply(
					`❌ Command "${commandName}" was not found.`
				);
			}

			const config = command.config;

			if ((config.role || 0) > role) {
				return message.reply(
					"❌ You don't have permission to view this command."
				);
			}

			let msg = "";
			msg += "╭━━━━━━━━━━━━━━━━━━━━╮\n";
			msg += "       𝐁𝐀𝐒𝐒𝐈𝐓\n";
			msg += "╰━━━━━━━━━━━━━━━━━━━━╯\n\n";
			msg += `✦ NAME: ${config.name}\n`;
			msg += `✦ VERSION: ${config.version || "1.0"}\n`;
			msg += `✦ AUTHOR: ${config.author || "BASSIT"}\n`;
			msg += `✦ ROLE: ${config.role || 0}\n`;
			msg += `✦ CATEGORY: ${config.category || "Other"}\n`;

			const description = getText(config.shortDescription, lang);
			if (description) {
				msg += `✦ DESCRIPTION: ${description}\n`;
			}

			const guide = getText(config.guide, lang);
			if (guide) {
				msg += `\n✦ USAGE:\n${guide.replace(/\{pn\}/g, prefix + config.name)}\n`;
			}

			const commandAliases = [];

			if (Array.isArray(config.aliases)) {
				commandAliases.push(...config.aliases);
			}

			for (const [alias, target] of aliases) {
				if (
					target === config.name &&
					!commandAliases.includes(alias)
				) {
					commandAliases.push(alias);
				}
			}

			if (commandAliases.length) {
				msg += `\n✦ ALIASES: ${commandAliases.join(", ")}\n`;
			}

			msg += "\n       𝐌𝐄𝐃𝐃𝐀𝐇\n";
			msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓";

			return message.reply(msg);
		} catch (error) {
			console.error("[BASSIT HELP ERROR]", error);
			return message.reply(
				"❌ An error occurred while loading the help menu."
			);
		}
	},

	onReply: async function ({ event, message, role, Reply }) {
		try {
			// Only allow replies in the same conversation
			if (event.threadID !== Reply.threadID) {
				return;
			}

			// Only the person who requested the image can open the list
			if (event.senderID !== Reply.author) {
				return message.reply(
					"❌ Reply to your own help image to view the commands."
				);
			}

			const prefix = getPrefix(event.threadID);
			const categories = new Map();

			for (const [name, command] of commands) {
				if (!command || !command.config) continue;

				const config = command.config;

				if ((config.role || 0) > role) continue;

				const category = config.category || "Other";

				if (!categories.has(category)) {
					categories.set(category, new Set());
				}

				categories.get(category).add(name);
			}

			let msg = "";
			msg += "╭━━━━━━━━━━━━━━━━━━━━╮\n";
			msg += "       𝐁𝐀𝐒𝐒𝐈𝐓\n";
			msg += "   𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐌𝐄𝐍𝐔\n";
			msg += "╰━━━━━━━━━━━━━━━━━━━━╯\n";

			for (const [category, names] of
				[...categories.entries()].sort((a, b) =>
					a[0].localeCompare(b[0])
				)) {
				msg += `\n╭───『 ${category.toUpperCase()} 』\n`;

				const sortedNames = [...names].sort();

				for (let i = 0; i < sortedNames.length; i += 3) {
					const line = sortedNames
						.slice(i, i + 3)
						.map(name => `✦ ${name}`);

					msg += `│ ${line.join("  |  ")}\n`;
				}

				msg += "╰──────────────────\n";
			}

			const totalCommands = [...categories.values()]
				.reduce((sum, names) => sum + names.size, 0);

			msg += "\n╭────『 INFO 』\n";
			msg += `│ ✦ TOTAL: ${totalCommands}\n`;
			msg += `│ ✦ PREFIX: ${prefix}\n`;
			msg += `│ ✦ DETAILS: ${prefix}help command\n`;
			msg += "╰──────────────────\n";
			msg += "\n       𝐌𝐄𝐃𝐃𝐃𝐀𝐇\n";
			msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓";

			return message.reply(msg);
		} catch (error) {
			console.error("[BASSIT HELP REPLY ERROR]", error);
			return message.reply(
				"❌ Failed to load the command list."
			);
		}
	}
};
