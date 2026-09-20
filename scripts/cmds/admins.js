module.exports = {
	config: {
		name: "admins",
		version: "1.0",
		author: "YourName",
		countDown: 5,
		role: 0,
		description: "Show group administrators",
		category: "box chat",
		guide: {
			en: "{pn}"
		}
	},

	onStart: async function ({ api, event, message }) {
		try {
			const info = await api.getThreadInfo(event.threadID);
			const adminIDs = info.adminIDs || [];

			if (adminIDs.length === 0) {
				return message.reply(
					"𝘼𝘿𝙈𝙄𝙉𝙎\n" +
					"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
					"❌ 𝙉𝙤 𝙖𝙙𝙢𝙞𝙣𝙨 𝙛𝙤𝙪𝙣𝙙.\n" +
					"▬▬▬▬▬▬▬▬▬▬▬▬"
				);
			}

			const userIDs = adminIDs.map(admin => admin.id);

			const users = await api.getUserInfo(userIDs);

			let text =
				"𝘼𝘿𝙈𝙄𝙉𝙎\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n";

			let number = 1;

			for (const uid of userIDs) {
				const name =
					users[uid]?.name ||
					"Unknown";

				text +=
					`${number}. 𝙐𝙨𝙚𝙧: ${name}\n` +
					`🆔 ${uid}\n\n`;

				number++;
			}

			text += "▬▬▬▬▬▬▬▬▬▬▬▬";

			return message.reply(text);

		} catch (error) {
			console.error("admins error:", error);

			return message.reply(
				"𝘼𝘿𝙈𝙄𝙉𝙎\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬\n" +
				"❌ 𝙃𝙖𝙙 𝙖 𝙥𝙧𝙤𝙗𝙡𝙚𝙢 𝙡𝙤𝙖𝙙𝙞𝙣𝙜 𝙖𝙙𝙢𝙞𝙣𝙨.\n" +
				"▬▬▬▬▬▬▬▬▬▬▬▬"
			);
		}
	}
};
