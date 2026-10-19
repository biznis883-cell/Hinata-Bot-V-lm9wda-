const fs = require("fs");
const path = require("path");

module.exports = {
config: {
name: "lockimage",
version: "2.1",
author: "BASSIT",
role: 1,
shortDescription: "🦔 حدد صورة الجروب بالايموجي",
category: "box chat"
},

onStart: async function () {},

onChat: async function ({ event, api, threadsData }) {
	if (event.body?.trim() !== "🦔") return;

	if (
		!event.messageReply ||
		!event.messageReply.attachments ||
		event.messageReply.attachments[0]?.type !== "photo"
	) {
		return api.sendMessage(
			"⚠️ خاصك ترد بـ 🦔 على شي صورة",
			event.threadID,
			event.messageID
		);
	}

	try {
		const url = event.messageReply.attachments[0].url;

		const dir = path.join(
			__dirname,
			"..",
			"..",
			"cache",
			"locked_images"
		);

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		const filePath = path.join(
			dir,
			`${event.threadID}.jpg`
		);

		const stream = await global.utils.getStreamFromURL(url);
		const fileStream = fs.createWriteStream(filePath);

		stream.pipe(fileStream);

		await new Promise((resolve, reject) => {
			fileStream.on("finish", resolve);
			fileStream.on("error", reject);
			stream.on("error", reject);
		});

		const imageStream = fs.createReadStream(filePath);

		api.changeGroupImage(
			imageStream,
			event.threadID,
			async (err) => {
				if (err) {
					return api.sendMessage(
						"❌ فشل: البوت خاصو يكون آدمن",
						event.threadID
					);
				}

				await threadsData.set(event.threadID, {
					data: {
						lockedImage: filePath
					}
				});

				api.sendMessage(
					"🔒🦔 تم تحديد وحماية صورة الجروب\nدابا أي واحد بدلها غادي نرجعها بوحدي",
					event.threadID
				);
			}
		);
	} catch (e) {
		api.sendMessage(
			"❌ خطأ: " + e.message,
			event.threadID
		);
	}
},

onEvent: async function ({ event, api, threadsData }) {
	if (event.logMessageType !== "log:thread-image") return;

	try {
		const data = await threadsData.get(event.threadID);
		const lockedPath = data?.data?.lockedImage;

		if (!lockedPath) return;
		if (!fs.existsSync(lockedPath)) return;

		await new Promise(resolve => setTimeout(resolve, 1000));

		const stream = fs.createReadStream(lockedPath);

		api.changeGroupImage(
			stream,
			event.threadID,
			() => {
				api.sendMessage(
					"🚫 محاولة تغيير صورة الجروب!\n🔒🦔 رجعت الصورة المحمية",
					event.threadID
				);
			}
		);
	} catch (e) {}
}

};
