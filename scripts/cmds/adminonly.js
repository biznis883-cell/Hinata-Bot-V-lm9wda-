
const fs = require("fs-extra");
const { config } = global.GoatBot;
const { client } = global;

module.exports = {
	config: {
		name: "adminonly",
		aliases: ["adonly", "onlyad", "onlyadmin"],
		version: "2.0.0",
		author: "Bassit",
		countDown: 5,
		role: 2,
		description: {
			en: "Turn admin-only mode on or off"
		},
		category: "owner",
		guide: {
			en: "{pn} on | off"
				+ "\n{pn} noti on | off"
		}
	},

	onStart: function ({ args, message }) {
		const action = (args[0] || "").toLowerCase();

		if (!config.adminOnly) {
			config.adminOnly = { enable: false };
		}

		if (!config.hideNotiMessage) {
			config.hideNotiMessage = {};
		}

		if (action === "on") {
			config.adminOnly.enable = true;

			// إخفاء إشعار رفض الأوامر
			config.hideNotiMessage.adminOnly = true;

			fs.writeFileSync(
				client.dirConfig,
				JSON.stringify(config, null, 2)
			);

			return message.reply("😗");
		}

		if (action === "off") {
			config.adminOnly.enable = false;

			// إبقاء إشعار الرفض مخفياً
			config.hideNotiMessage.adminOnly = true;

			fs.writeFileSync(
				client.dirConfig,
				JSON.stringify(config, null, 2)
			);

			return message.reply("🐤");
		}

		if (action === "noti") {
			const value = (args[1] || "").toLowerCase();

			if (value !== "on" && value !== "off") {
				return message.reply(
					"استعمل: adminonly noti on أو adminonly noti off"
				);
			}

			// noti off = إخفاء الإشعار
			config.hideNotiMessage.adminOnly = value === "off";

			fs.writeFileSync(
				client.dirConfig,
				JSON.stringify(config, null, 2)
			);

			return message.reply(
				value === "on" ? "🔔" : "🔕"
			);
		}

		return message.reply(
			"استعمل:\nadminonly on 😗\nadminonly off 🐤"
		);
	}
};
