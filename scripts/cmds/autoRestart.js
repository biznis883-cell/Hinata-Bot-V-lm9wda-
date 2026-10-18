
const { spawn } = require("child_process");

let restarting = false;

function restartBot(reason = "Session disconnected") {
    if (restarting) return;
    restarting = true;

    console.log(`[AUTO-RESTART] ${reason}`);
    console.log("[AUTO-RESTART] Restarting bot...");

    const child = spawn(
        process.execPath,
        process.argv.slice(1),
        {
            cwd: process.cwd(),
            stdio: "inherit",
            env: process.env
        }
    );

    child.on("error", (err) => {
        console.error("[AUTO-RESTART] Failed:", err.message);
        restarting = false;
    });

    child.on("exit", (code) => {
        console.log(`[AUTO-RESTART] Child exited with code ${code}`);
        restarting = false;
    });
}

module.exports = { restartBot };
