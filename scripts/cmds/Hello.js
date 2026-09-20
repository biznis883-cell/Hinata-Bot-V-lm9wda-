module.exports = {
	config: {
		name: "hello",
		version: "1.0",
		author: "YourName",
		countDown: 3,
		role: 0,
		description: "Send a picture",
		category: "fun",
		guide: {
			en: "{pn}"
		}
	},

	onStart: async function ({ message }) {
		const imageURL = "https://i.postimg.cc/nsYVmsHJ/971702e33529e796a3dd79b73fd6ac42.jpg";

		try {
			const image = await global.utils.getStreamFromURL(imageURL);

			return message.reply({
				attachment: image
			});
		} catch (error) {
			console.error("hello error:", error);
			return message.reply("❌ وقع خطأ أثناء إرسال الصورة.");
		}
	}
};
