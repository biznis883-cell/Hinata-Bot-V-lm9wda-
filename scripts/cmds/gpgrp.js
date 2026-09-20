module.exports = {
	config: {
		name: "gpgrp",
		version: "1.0",
		author: "YourName",
		countDown: 5,
		role: 1,
		description: "Change group name and protect group settings",
		category: "box chat",
		guide: {
			en:
				"{pn} <new name>\n" +
				"{pn}s <new name>\n" +
				"protect on\n" +
				"protect off"
		}
	},

	onStart: async function ({ api, event, message, args }) {
		global.groupProtection ??= {};

		const command = event.body
			.trim()
			.split(/\s+/)[0]
			.toLowerCase();

		// =========================
		// gpgrp
		// =========================
		if (command === "gpgrp") {
			const newName = args.join(" ").trim();

			if (!newName) {
				return message.reply(
					"❌ الاستعمال:\n" +
					"gpgrp <اسم المجموعة الجديد>"
				);
			}

			try {
				await api.setTitle(newName, event.threadID);

				// إذا كانت الحماية مفعلة، نحفظ الاسم الجديد
				if (global.groupProtection[event.threadID]?.enabled) {
					global.groupProtection[event.threadID].groupName = newName;
				}

				return message.reply(
					`✅ تم تغيير اسم المجموعة إلى:\n\n${newName}`
				);
			} catch (error) {
				console.error("gpgrp error:", error);

				return message.reply(
					"❌ ما قدرتش نغيّر اسم المجموعة.\n" +
					"تأكد أن البوت عنده صلاحية Admin."
				);
			}
		}

		// =========================
		// gpgrps
		// =========================
		if (command === "gpgrps") {
			const newName = args.join(" ").trim();

			if (!newName) {
				return message.reply(
					"❌ الاستعمال:\n" +
					"gpgrps <اسم المجموعة>"
				);
			}

			let threads;

			try {
				threads = await api.getThreadList(100, null, ["INBOX"]);
			} catch (error) {
				console.error("getThreadList error:", error);

				return message.reply(
					"❌ ما قدرتش نجيب لائحة المجموعات."
				);
			}

			let success = 0;
			let failed = 0;

			for (const thread of threads) {
				if (!thread.threadID)
					continue;

				try {
					await api.setTitle(newName, thread.threadID);
					success++;

					await new Promise(resolve =>
						setTimeout(resolve, 500)
					);
				} catch (error) {
					failed++;
				}
			}

			return message.reply(
				`✅ تم تنفيذ gpgrps.\n\n` +
				`📌 الاسم: ${newName}\n` +
				`✔️ نجح: ${success}\n` +
				`❌ فشل: ${failed}`
			);
		}

		// =========================
		// protect on
		// =========================
		if (command === "protect" && args[0]?.toLowerCase() === "on") {
			try {
				const info = await api.getThreadInfo(event.threadID);

				const nicknames = {};

				if (info.nicknames) {
					Object.assign(nicknames, info.nicknames);
				}

				global.groupProtection[event.threadID] = {
					enabled: true,
					groupName: info.threadName || "",
					nicknames: nicknames,
					photo: info.imageSrc || null
				};

				return message.reply(
					"🔒 تم تشغيل الحماية.\n\n" +
					"🛡️ اسم المجموعة: ON\n" +
					"🛡️ الكنيات: ON\n" +
					"🛡️ صورة المجموعة: ON"
				);
			} catch (error) {
				console.error("protect on error:", error);

				return message.reply(
					"❌ ما قدرتش نفعّل الحماية."
				);
			}
		}

		// =========================
		// protect off
		// =========================
		if (command === "protect" && args[0]?.toLowerCase() === "off") {
			delete global.groupProtection[event.threadID];

			return message.reply(
				"🔓 تم إيقاف حماية المجموعة."
			);
		}

		return message.reply(
			"❌ الأوامر:\n\n" +
			"gpgrp <الاسم>\n" +
			"gpgrps <الاسم>\n" +
			"protect on\n" +
			"protect off"
		);
	}
};
