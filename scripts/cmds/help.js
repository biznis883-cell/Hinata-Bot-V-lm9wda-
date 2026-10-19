if (args.length === 0) {
	const categories = {};
	let msg = "";

	for (const [name, value] of commands) {
		if (value.config.role > 0 && role < value.config.role)
			continue;

		const category = value.config.category || "Uncategorized";

		if (!categories[category])
			categories[category] = [];

		if (!categories[category].includes(name))
			categories[category].push(name);
	}

	const categoryNames = Object.keys(categories).sort();
	const totalVisibleCommands = categoryNames.reduce(
		(total, category) => total + categories[category].length,
		0
	);

	msg += "╭━━━━━━━━━━━━━━━━━━━━╮\n";
	msg += "       𝐌𝐄𝐃𝐃𝐀𝐇\n";
	msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓\n";
	msg += "╰━━━━━━━━━━━━━━━━━━━━╯\n\n";
	msg += "       𝗛𝗘𝗟𝗣 𝗖𝗘𝗡𝗧𝗘𝗥\n";
	msg += "━━━━━━━━━━━━━━━━━━━━\n";
	msg += ` Prefix: ${prefix}\n`;
	msg += ` Total Commands: ${totalVisibleCommands}\n`;
	msg += "━━━━━━━━━━━━━━━━━━━━\n";

	for (const category of categoryNames) {
		const names = categories[category].sort();

		msg += `\n╭───〔 ${category.toUpperCase()} 〕\n`;

		for (let i = 0; i < names.length; i += 2) {
			const first = names[i];
			const second = names[i + 1];

			msg += `│ • ${first}`;

			if (second)
				msg += `     • ${second}`;

			msg += "\n";
		}

		msg += "╰──────────────────\n";
	}

	const helpHint =
		langCode === "bn"
			? `বিস্তারিত দেখতে ${prefix}help <command> লিখুন।`
			: langCode === "vi"
				? `Nhập ${prefix}help <command> để xem chi tiết.`
				: `Type ${prefix}help <command> to see details.`;

	msg += `\n${helpHint}\n`;
	msg += "━━━━━━━━━━━━━━━━━━━━\n";
	msg += "       𝐌𝐄𝐃𝐃𝐀𝐇\n";
	msg += "     𝐁𝐀𝐒𝐒𝐈𝐓 𝐁𝐎𝐓\n";
	msg += "━━━━━━━━━━━━━━━━━━━━";

	try {
		const sentMessage = await message.reply({ body: msg });

		setTimeout(() => {
			message.unsend(sentMessage.messageID).catch(() => {});
		}, 80000);
	} catch (error) {
		console.error("Help Error:", error);
	}
}
