const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.4",
		author: "NTKhang",
		countDown: 5,
		role: 0,
		description: "Change bot prefix",
		category: "config",

		guide: {
			en:
				"{pn} <new prefix>\n" +
				"Example:\n" +
				"{pn} #\n\n" +
				"{pn} <new prefix> -g\n" +
				"Example:\n" +
				"{pn} # -g\n\n" +
				"{pn} reset"
		}
	},

	langs: {
		en: {
			reset:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"𝙔𝙤𝙪𝙧 𝙥𝙧𝙚𝙛𝙞𝙭 𝙝𝙖𝙨 𝙗𝙚𝙚𝙣 𝙧𝙚𝙨𝙚𝙩\n" +
				"𝙉𝙚𝙬 𝙥𝙧𝙚𝙛𝙞𝙭: %1\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			onlyAdmin:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"❌ 𝙊𝙣𝙡𝙮 𝙗𝙤𝙩 𝙖𝙙𝙢𝙞𝙣 𝙘𝙖𝙣 𝙘𝙝𝙖𝙣𝙜𝙚 𝙜𝙡𝙤𝙗𝙖𝙡 𝙥𝙧𝙚𝙛𝙞𝙭.\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			confirmGlobal:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"🌐 𝙍𝙚𝙖𝙘𝙩 𝙩𝙤 𝙩𝙝𝙞𝙨 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙩𝙤 𝙘𝙤𝙣𝙛𝙞𝙧𝙢.\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			confirmThisThread:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"🛸 𝙍𝙚𝙖𝙘𝙩 𝙩𝙤 𝙩𝙝𝙞𝙨 𝙢𝙚𝙨𝙨𝙖𝙜𝙚 𝙩𝙤 𝙘𝙤𝙣𝙛𝙞𝙧𝙢.\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			successGlobal:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"✅ 𝙂𝙡𝙤𝙗𝙖𝙡 𝙥𝙧𝙚𝙛𝙞𝙭: %1\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			successThisThread:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"✅ 𝙂𝙧𝙤𝙪𝙥 𝙥𝙧𝙚𝙛𝙞𝙭: %1\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬",

			myPrefix:
				"𝙋𝙍𝙀𝙁𝙄𝙓\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"🌐 𝙎𝙮𝙨𝙩𝙚𝙢: %1\n" +
				"🛸 𝙂𝙧𝙤𝙪𝙥: %2\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬"
		}
	},

	onStart: async function ({
		message,
		role,
		args,
		commandName,
		event,
		threadsData,
		getLang
	}) {
		if (!args[0])
			return message.SyntaxError();

		if (args[0].toLowerCase() === "reset") {
			await threadsData.set(
				event.threadID,
				null,
				"data.prefix"
			);

			return message.reply(
				getLang(
					"reset",
					global.GoatBot.config.prefix
				)
			);
		}

		const newPrefix = args[0];

		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply(
					getLang("onlyAdmin")
				);

			formSet.setGlobal = true;
		} else {
			formSet.setGlobal = false;
		}

		return message.reply(
			args[1] === "-g"
				? getLang("confirmGlobal")
				: getLang("confirmThisThread"),
			(err, info) => {
				if (err)
					return console.error(err);

				formSet.messageID = info.messageID;

				global.GoatBot.onReaction.set(
					info.messageID,
					formSet
				);
			}
		);
	},

	onReaction: async function ({
		message,
		threadsData,
		event,
		Reaction,
		getLang
	}) {
		const {
			author,
			newPrefix,
			setGlobal
		} = Reaction;

		if (event.userID !== author)
			return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;

			fs.writeFileSync(
				global.client.dirConfig,
				JSON.stringify(
					global.GoatBot.config,
					null,
					2
				)
			);

			return message.reply(
				getLang(
					"successGlobal",
					newPrefix
				)
			);
		}

		await threadsData.set(
			event.threadID,
			newPrefix,
			"data.prefix"
		);

		return message.reply(
			getLang(
				"successThisThread",
				newPrefix
			)
		);
	},

	onChat: async function ({
		event,
		message,
		getLang
	}) {
		if (
			event.body &&
			event.body.toLowerCase() === "prefix"
		) {
			return () => {
				return message.reply(
					getLang(
						"myPrefix",
						global.GoatBot.config.prefix,
						utils.getPrefix(event.threadID)
					)
				);
			};
		}
	}
};
