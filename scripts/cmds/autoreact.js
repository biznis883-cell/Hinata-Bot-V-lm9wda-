module.exports = {
	config: {
		name: "autoreact",
		version: "2.0",
		author: "YourName",
		countDown: 2,
		role: 1,
		description: "Automatic reactions",
		category: "utility",
		guide: {
			en: "{pn} on\n{pn} off\n{pn} all on\n{pn} all off"
		}
	},

	onStart: async function ({ api, event, message, args }) {
		global.autoReact ??= {};
		global.autoReactAll ??= {};

		const threadID = event.threadID;
		const option1 = args[0]?.toLowerCase();
		const option2 = args[1]?.toLowerCase();

		// autoreact on
		if (option1 === "on") {
			global.autoReact[threadID] = true;

			return message.reply(
				"✅ تم تشغيل AutoReact.\n" +
				"😈 غادي نتفاعل مع رسائلك أنت فقط."
			);
		}

		// autoreact off
		if (option1 === "off") {
			delete global.autoReact[threadID];

			return message.reply(
				"🛑 تم إيقاف AutoReact الخاص بك."
			);
		}

		// autoreact all on
		if (option1 === "all" && option2 === "on") {
			global.autoReactAll[threadID] = true;

			return message.reply(
				"✅ تم تشغيل AutoReact ALL.\n" +
				"🔥 غادي نتفاعل مع رسائل جميع أعضاء المجموعة."
			);
		}

		// autoreact all off
		if (option1 === "all" && option2 === "off") {
			delete global.autoReactAll[threadID];

			return message.reply(
				"🛑 تم إيقاف AutoReact ALL."
			);
		}

		return message.reply(
			"❌ الاستعمال الصحيح:\n\n" +
			"autoreact on\n" +
			"autoreact off\n\n" +
			"autoreact all on\n" +
			"autoreact all off"
		);
	},

	onChat: async function ({ api, event }) {
		global.autoReact ??= {};
		global.autoReactAll ??= {};

		const threadID = event.threadID;

		if (!event.messageID)
			return;

		// تجاهل رسائل البوت نفسه
		const botID = api.getCurrentUserID();

		if (event.senderID == botID)
			return;

		// إذا كان ALL مفعلاً → تفاعل مع الجميع
		if (global.autoReactAll[threadID]) {
			return react(api, event);
		}

		// إذا كان AutoReact العادي مفعلاً → تفاعل مع صاحب الأمر فقط
		if (
			global.autoReact[threadID] &&
			global.autoReact[threadID] === event.senderID
		) {
			return react(api, event);
		}
	}
};

async function react(api, event) {
	const reactions = [
		"😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
		"😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
		"😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
		"🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
		"😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
		"😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
		"😡", "🤬", "🤯", "😳", "🥶", "🥵", "😱", "😨",
		"😰", "😥", "😓", "🤗", "🤔", "🫡", "🤭", "🤫",
		"🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦",
		"😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
		"🤢", "🤮", "🤧", "😈", "👿", "👹", "👺", "💀",
		"☠️", "👻", "👽", "🤖", "💩", "😺", "😸", "😹",
		"😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉",
		"🙊", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤",
		"🤍", "🤎", "🩷", "🩵", "🩶", "💔", "❣️", "💕",
		"💞", "💓", "💗", "💖", "💘", "💝", "💟", "✨",
		"⭐", "🌟", "💫", "🔥", "⚡", "💥", "🎀", "👑",
		"💋", "👀", "🫀", "🧿", "🌚", "🌝", "🌙", "☀️",
		"🌹", "🌸", "🌺", "🌻", "🪻", "🍀", "🦋", "🦅",
		"🐤", "🐣", "🐥", "🐼", "🐸", "🐵", "🙊", "🏇",
		"🎨", "🎭", "🎲", "🪃", "🥏", "🛠️", "⚒️", "⛏️",
		"🗞️", "📦", "💡", "🧊", "🧃", "🫧", "🇮🇳"
	];

	const reaction =
		reactions[Math.floor(Math.random() * reactions.length)];

	try {
		await api.setMessageReaction(
			reaction,
			event.messageID,
			() => {},
			true
		);
	} catch (error) {
		console.error("AutoReact Error:", error);
	}
}
