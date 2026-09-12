const {
  changeAllNicknames,
  getGroupSettings,
  getThreadInfo,
  isGroupAdmin,
  updateGroupSettings
} = require("../utils/group");

module.exports = {
  config: {
    name: "16",
    countDown: 5,
    description: "تعيين كنية لجميع أعضاء المجموعة"
  },

  async onStart({ api, event, args, message, config }) {
    if (!(await isGroupAdmin(api, event, config))) {
      return message.reply("هذا الأمر متاح لمشرفي المجموعة فقط.");
    }

    const nickname = args.join(" ").trim();
    if (!nickname) return message.reply("الاستخدام: #16 الكنية");

    try {
      const info = await getThreadInfo(api, event.threadID);
      const participantIDs = (info.participantIDs || []).map(String);
      const result = await changeAllNicknames(api, event.threadID, participantIDs, nickname);
      const group = getGroupSettings(event.threadID);

      if (group && group.enabled) {
        const nicknames = Object.fromEntries(
          participantIDs.map((participantID) => [participantID, nickname])
        );
        updateGroupSettings(event.threadID, { nicknames, bulkNickname: nickname });
      }

      return message.reply(
        `تم تحديث كنية ${result.changed} عضو${result.failed ? `، وفشل ${result.failed}` : ""}.`
      );
    } catch (err) {
      console.error("16:", err);
      return message.reply("تعذر تحديث كنيات الأعضاء.");
    }
  }
};
