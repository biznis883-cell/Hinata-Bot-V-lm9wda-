
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
const path = require("path");
const log = require("./logger/log.js");

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = 0;

// --------------------------------------------------
// PATHS
// --------------------------------------------------

const dirConfig = path.join(__dirname, "config.json");
const dirConfigCommands = path.join(__dirname, "configCommands.json");
const dirAccount = path.join(__dirname, "account.txt");

// --------------------------------------------------
// VALIDATE JSON
// --------------------------------------------------

function validJSON(filePath) {
	if (!fs.existsSync(filePath)) {
		throw new Error(`File "${filePath}" not found`);
	}

	try {
		JSON.parse(fs.readFileSync(filePath, "utf8"));
		return true;
	}
	catch (error) {
		throw new Error(
			`Invalid JSON in ${path.basename(filePath)}: ${error.message}`
		);
	}
}

for (const filePath of [dirConfig, dirConfigCommands]) {
	try {
		validJSON(filePath);
	}
	catch (error) {
		log.error("CONFIG", error.message);
		process.exit(1);
	}
}

const config = require(dirConfig);
const configCommands = require(dirConfigCommands);

if (Array.isArray(config.whiteListMode?.whiteListIds)) {
	config.whiteListMode.whiteListIds =
		config.whiteListMode.whiteListIds.map(String);
}

// --------------------------------------------------
// GLOBAL BOT
// --------------------------------------------------

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
	envCommands: configCommands.envCommands || {},
	envEvents: configCommands.envEvents || {},
	envGlobal: configCommands.envGlobal || {},
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

global.utils = require("./utils.js");

const utils = global.utils;
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

const getText = utils.getText;

// --------------------------------------------------
// CONFIG WATCHERS
// --------------------------------------------------

function watchAndReloadConfig(filePath, eventType, property, logName) {
	let lastModified;

	try {
		lastModified = fs.statSync(filePath).mtimeMs;
	}
	catch (error) {
		log.warn(logName, `Cannot access ${filePath}`);
		return;
	}

	let firstChange = true;
	let timer = null;

	fs.watch(filePath, currentEvent => {
		if (currentEvent !== eventType) return;

		clearTimeout(timer);

		timer = setTimeout(() => {
			try {
				const stat = fs.statSync(filePath);

				if (firstChange) {
					firstChange = false;
					lastModified = stat.mtimeMs;
					return;
				}

				if (lastModified === stat.mtimeMs) return;

				const updatedConfig = JSON.parse(
					fs.readFileSync(filePath, "utf8")
				);

				global.GoatBot[property] = updatedConfig;

				if (property === "configCommands") {
					global.GoatBot.envGlobal =
						updatedConfig.envGlobal || {};
					global.GoatBot.envCommands =
						updatedConfig.envCommands || {};
					global.GoatBot.envEvents =
						updatedConfig.envEvents || {};
				}

				log.success(
					logName,
					`Reloaded ${path.basename(filePath)}`
				);

				lastModified = stat.mtimeMs;
			}
			catch (error) {
				log.warn(logName, `Reload failed: ${error.message}`);
			}
		}, 300);
	});
}

watchAndReloadConfig(
	dirConfigCommands,
	"change",
	"configCommands",
	"CONFIG COMMANDS"
);

watchAndReloadConfig(dirConfig, "change", "config", "CONFIG");

// --------------------------------------------------
// AUTO RESTART
// Keep existing behavior: the host must restart the process.
// --------------------------------------------------

if (config.autoRestart) {
	const time = config.autoRestart.time;

	if (typeof time === "number" || (
		typeof time === "string" && /^\d+$/.test(time)
	)) {
		const milliseconds = Number(time);

		if (Number.isFinite(milliseconds) && milliseconds > 0) {
			utils.log.info(
				"AUTO RESTART",
				getText(
					"Goat",
					"autoRestart1",
					utils.convertTime(milliseconds, true)
				)
			);

			setTimeout(() => {
				utils.log.info("AUTO RESTART", "Restarting...");
				process.exit(2);
			}, milliseconds);
		}
	}
	else if (typeof time === "string" && time.trim()) {
		try {
			const cron = require("node-cron");

			if (cron.validate(time)) {
				utils.log.info(
					"AUTO RESTART",
					getText("Goat", "autoRestart2", time)
				);

				cron.schedule(time, () => {
					utils.log.info("AUTO RESTART", "Restarting...");
					process.exit(2);
				});
			}
			else {
				log.warn("AUTO RESTART", "Invalid cron expression");
			}
		}
		catch (error) {
			log.warn("AUTO RESTART", error.message);
		}
	}
}

// --------------------------------------------------
// VERSION COMPARISON
// --------------------------------------------------

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

// --------------------------------------------------
// OPTIONAL SERVICES
// A failure here should not prevent bot login.
// --------------------------------------------------

async function setupMail() {
	const gmailAccount = config.credentials?.gmailAccount;

	if (!gmailAccount) {
		console.log("[MAIL] Gmail credentials not configured.");
		return;
	}

	const {
		email,
		clientId,
		clientSecret,
		refreshToken
	} = gmailAccount;

	if (!email || !clientId || !clientSecret || !refreshToken) {
		console.log("[MAIL] Gmail OAuth settings incomplete.");
		return;
	}

	try {
		const OAuth2 = google.auth.OAuth2;
		const oauthClient = new OAuth2(clientId, clientSecret);

		oauthClient.setCredentials({
			refresh_token: refreshToken
		});

		const tokenResponse = await oauthClient.getAccessToken();
		const accessToken = tokenResponse?.token;

		const transporter = nodemailer.createTransport({
			service: "Gmail",
			auth: {
				type: "OAuth2",
				user: email,
				clientId,
				clientSecret,
				refreshToken,
				accessToken
			}
		});

		global.utils.sendMail = async function ({
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
		};

		global.utils.transporter = transporter;

		console.log("[MAIL] Gmail service initialized.");
	}
	catch (error) {
		console.error(
			"[MAIL] Initialization failed:",
			error.message || error
		);
	}
}

async function checkVersion() {
	try {
		const currentVersion =
			require("./package.json").version || "0.0.0";

		const response = await axios.get(
			"https://raw.githubusercontent.com/mahmudx7/Hinata-Bot-V3/main/package.json",
			{ timeout: 10000 }
		);

		const latestVersion = response.data?.version;

		if (
			typeof latestVersion === "string" &&
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
	catch (error) {
		log.warn(
			"VERSION CHECK",
			`Unable to check version: ${error.message}`
		);
	}
}

async function setupGoogleDrive() {
	try {
		const parentId =
			await utils.drive.checkAndCreateParentFolder("GoatBot");

		utils.drive.parentID = parentId;

		console.log("[GOOGLE DRIVE] Initialized.");
	}
	catch (error) {
		console.error(
			"[GOOGLE DRIVE] Initialization failed:",
			error.message || error
		);

		// Do not block login when Google Drive is unavailable.
	}
}

// --------------------------------------------------
// STARTUP
// --------------------------------------------------

(async function main() {
	try {
		await setupMail();
		await checkVersion();
		await setupGoogleDrive();

		// Keep the original GoatBot login implementation.
		require("./bot/login/login.js");
	}
	catch (error) {
		console.error("[STARTUP ERROR]", error);

		// Report the failure; do not pretend startup succeeded.
		process.exitCode = 1;
	}
})();
