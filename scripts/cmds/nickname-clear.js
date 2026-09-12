const {
  changeAllNicknames,
  getGroupSettings,
  getThreadInfo,
  isGroupAdmin,
  updateGroupSettings
} = require("../utils/group");

module.exports = {
  config: {
    name: "15",
    countDown: 5,
    description: "حذف كنيات جميع أعضاء المجموعة"
  },

  async onStart({ api, event, message, config }) {
    if (!(await isGroupAdmin(api, event, config))) {
      return message.reply("هذا الأمر متاح لمشرفي المجموعة فقط.");
    }

    try {
      const info = await getThreadInfo(api, event.threadID);
      const participantIDs = (info.participantIDs || []).map(String);
      const result = await changeAllNicknames(api, event.threadID, participantIDs, "");
      const group = getGroupSettings(event.threadID);

      if (group && group.enabled) {
        const nicknames = Object.fromEntries(
          participantIDs.map((participantID) => [participantID, ""])
        );
        updateGroupSettings(event.threadID, { nicknames, bulkNickname: null });
      }

      return message.reply(
        `تم حذف كنيات ${result.changed} عضو${result.failed ? `، وفشل ${result.failed}` : ""}.`
      );
    } catch (err) {
      console.error("15:", err);
      return message.reply("تعذر حذف كنيات الأعضاء.");
    }
  }
};