
process.on("unhandledRejection", error => {
	console.error("[UNHANDLED REJECTION]", error);
});

process.on("uncaughtException", error => {
	console.error("[UNCAUGHT EXCEPTION]", error);
});

const axios = require("axios");
const fs = require("fs-extra");
const google = require("googleapis").google;
const nodemailer = require("nodemailer");
const { execSync } = require("child_process");
const log = require("./logger/log.js");
const path = require("path");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

function validJSON(pathDir) {
	try {
		if (!fs.existsSync(pathDir)) {
			throw new Error(`File "${pathDir}" not found`);
		}

		execSync(`npx jsonlint "${pathDir}"`, { stdio: "pipe" });
		return true;
	}
	catch (err) {
		let msgError = err.message || String(err);
		msgError = msgError.split("\n").slice(1).join("\n");

		const indexPos = msgError.indexOf("    at");
		msgError = msgError.slice(
			0,
			indexPos !== -1 ? indexPos - 1 : msgError.length
		);

		throw new Error(msgError);
	}
}

const dirConfig = path.join(__dirname, "config.json");
const dirConfigCommands = path.join(__dirname, "configCommands.json");
const dirAccount = path.join(__dirname, "account.txt");

for (const pathDir of [dirConfig, dirConfigCommands]) {
	try {
		validJSON(pathDir);
	}
	catch (err) {
		log.error(
			"CONFIG",
			`Invalid JSON file "${pathDir.replace(__dirname, "")}":\n` +
			`${err.message}\nPlease fix it and restart bot`
		);
		process.exit(1);
	}
}

const config = require(dirConfig);

if (
	config.whiteListMode?.whiteListIds &&
	Array.isArray(config.whiteListMode.whiteListIds)
) {
	config.whiteListMode.whiteListIds =
		config.whiteListMode.whiteListIds.map(id => id.toString());
}

const configCommands = require(dirConfigCommands);

global.GoatBot = {
	startTime: Date.now() - process.uptime() * 1000,
	commands: new Map(),
	eventCommands: new Map(),
	commandFilesPath: [],
	eventCommandsFilesPath: [],
	aliases: new Map(),
	onFirstChat: [],
	onChat: [],
	onEvent: [],
	onReply: new Map(),
	onReaction: new Map(),
	onAnyEvent: [],
	config,
	configCommands,
	envCommands: {},
	envEvents: {},
	envGlobal: {},
	reLoginBot: function () {},
	Listening: null,
	oldListening: [],
	callbackListenTime: {},
	storage5Message: [],
	fcaApi: null,
	botID: null
};

global.db = {
	allThreadData: [],
	allUserData: [],
	allDashBoardData: [],
	allGlobalData: [],
	threadModel: null,
	userModel: null,
	dashboardModel: null,
	globalModel: null,
	threadsData: null,
	usersData: null,
	dashBoardData: null,
	globalData: null,
	receivedTheFirstMessage: {}
};

global.client = {
	dirConfig,
	dirConfigCommands,
	dirAccount,
	countDown: {},
	cache: {},
	database: {
		creatingThreadData: [],
		creatingUserData: [],
		creatingDashBoardData: [],
		creatingGlobalData: []
	},
	commandBanned: configCommands.commandBanned
};

const utils = require("./utils.js");
global.utils = utils;

const { colors } = utils;

global.temp = {
	createThreadData: [],
	createUserData: [],
	createThreadDataError: [],
	filesOfGoogleDrive: {
		arraybuffer: {},
		stream: {},
		fileNames: {}
	},
	contentScripts: {
		cmds: {},
		events: {}
	}
};

const watchAndReloadConfig = (dir, type, prop, logName) => {
	let lastModified;

	try {
		lastModified = fs.statSync(dir).mtimeMs;
	}
	catch (err) {
		log.warn(logName, `Cannot watch config file: ${dir}`);
		return;
	}

	let isFirstModified = true;

	fs.watch(dir, eventType => {
		if (eventType !== type) return;

		setTimeout(() => {
			try {
				if (isFirstModified) {
					isFirstModified = false;
					return;
				}

				const stat = fs.statSync(dir);
				if (lastModified === stat.mtimeMs) return;

				const oldConfig = global.GoatBot[prop];
				try {
					global.GoatBot[prop] = JSON.parse(
						fs.readFileSync(dir, "utf-8")
					);
					log.success(
						logName,
						`Reloaded ${dir.replace(process.cwd(), "")}`
					);
				}
				catch (err) {
					global.GoatBot[prop] = oldConfig;
					log.warn(
						logName,
						`Can't reload ${dir.replace(process.cwd(), "")}: ${err.message}`
					);
				}

				lastModified = stat.mtimeMs;
			}
			catch (err) {
				log.warn(logName, `Config watcher error: ${err.message}`);
			}
		}, 200);
	});
};

watchAndReloadConfig(
	dirConfigCommands,
	"change",
	"configCommands",
	"CONFIG COMMANDS"
);

watchAndReloadConfig(dirConfig, "change", "config", "CONFIG");

global.GoatBot.envGlobal = global.GoatBot.configCommands.envGlobal;
global.GoatBot.envCommands = global.GoatBot.configCommands.envCommands;
global.GoatBot.envEvents = global.GoatBot.configCommands.envEvents;

const getText = global.utils.getText;

// AUTO RESTART
if (config.autoRestart) {
	const time = config.autoRestart.time;

	if (!isNaN(time) && Number(time) > 0) {
		utils.log.info(
			"AUTO RESTART",
			getText(
				"Goat",
				"autoRestart1",
				utils.convertTime(Number(time), true)
			)
		);

		setTimeout(() => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		}, Number(time));
	}
	else if (
		typeof time === "string" &&
		time.match(/^((((\d+,)+\d+|(\d+(\/|-|#)\d+)|\d+L?|\*(\/\d+)?|L(-\d+)?|\?|[A-Z]{3}(-[A-Z]{3})?) ?){5,7})$/gmi)
	) {
		utils.log.info(
			"AUTO RESTART",
			getText("Goat", "autoRestart2", time)
		);

		const cron = require("node-cron");
		cron.schedule(time, () => {
			utils.log.info("AUTO RESTART", "Restarting...");
			process.exit(2);
		});
	}
}

function compareVersion(version1, version2) {
	const v1 = String(version1).split(".");
	const v2 = String(version2).split(".");

	for (let i = 0; i < 3; i++) {
		const n1 = parseInt(v1[i], 10) || 0;
		const n2 = parseInt(v2[i], 10) || 0;

		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
	}

	return 0;
}

(async () => {
	try {
		// SETUP MAIL
		const gmailAccount = config.credentials?.gmailAccount;

		if (gmailAccount) {
			const {
				email,
				clientId,
				clientSecret,
				refreshToken
			} = gmailAccount;

			if (email && clientId && clientSecret && refreshToken) {
				const OAuth2 = google.auth.OAuth2;
				const OAuth2_client = new OAuth2(
					clientId,
					clientSecret
				);

				OAuth2_client.setCredentials({
					refresh_token: refreshToken
				});

				let accessToken;

				try {
					const tokenResponse =
						await OAuth2_client.getAccessToken();

					accessToken = tokenResponse?.token || tokenResponse;
				}
				catch (err) {
					throw new Error(
						`Google OAuth token error: ${err.message}`
					);
				}

				const mailOptions = {
					host: "smtp.gmail.com",
					service: "Gmail",
					auth: {
						type: "OAuth2",
						user: email,
						clientId,
						clientSecret,
						refreshToken,
						accessToken
					}
				};

				const transporter =
					nodemailer.createTransport(mailOptions);

				async function sendMail({
					to,
					subject,
					text,
					html,
					attachments
				}) {
					return transporter.sendMail({
						from: email,
						to,
						subject,
						text,
						html,
						attachments
					});
				}

				global.utils.sendMail = sendMail;
				global.utils.transporter = transporter;
			}
			else {
				console.warn(
					"[MAIL] Gmail OAuth settings incomplete; mail disabled."
				);
			}
		}
		else {
			console.warn(
				"[MAIL] Gmail credentials not configured; mail disabled."
			);
		}

		// CHECK VERSION — FAILURE MUST NOT BLOCK STARTUP
		const currentVersion =
			require("./package.json").version || "0.0.0";

		try {
			const response = await axios.get(
				"https://raw.githubusercontent.com/mahmudx7/Hinata-Bot-V3/main/package.json",
				{
					timeout: 10000,
					headers: {
						Accept: "application/json"
					}
				}
			);

			const latestVersion = response?.data?.version;

			if (
				typeof latestVersion === "string" &&
				latestVersion.trim() &&
				compareVersion(latestVersion, currentVersion) === 1
			) {
				utils.log.master(
					"NEW VERSION",
					getText(
						"Goat",
						"newVersionDetected",
						colors.gray(currentVersion),
						colors.hex("#eb6a07", latestVersion),
						colors.hex("#eb6a07", "node update")
					)
				);
			}
		}
		catch (err) {
			utils.log.warn(
				"VERSION CHECK",
				`GitHub version check failed (${err.response?.status || err.code || err.message}). Continuing startup.`
			);
		}

		// GOOGLE DRIVE
		try {
			const parentIdGoogleDrive =
				await utils.drive.checkAndCreateParentFolder("GoatBot");

			utils.drive.parentID = parentIdGoogleDrive;
		}
		catch (err) {
			console.error(
				"[GOOGLE DRIVE] Setup failed:",
				err.message || err
			);

			throw err;
		}

		// LOGIN
		require("./bot/login/login.js");
	}
	catch (err) {
		console.error("[STARTUP ERROR]", err);
	}
})();
