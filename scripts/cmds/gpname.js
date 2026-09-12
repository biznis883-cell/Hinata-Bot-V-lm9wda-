const {
  apiCall,
  getGroupSettings,
  isGroupAdmin,
  updateGroupSettings
} = require("../utils/group");

module.exports = {
  config: {
    name: "gpname",
    aliases: ["groupname"],
    countDown: 3,
    description: "تغيير اسم المجموعة"
  },

  async onStart({ api, event, args, message, config }) {
    if (!(await isGroupAdmin(api, event, config))) {
      return message.reply("هذا الأمر متاح لمشرفي المجموعة فقط.");
    }

    const title = args.join(" ").trim();
    if (!title) return message.reply("الاستخدام: #gpname اسم المجموعة");

    try {
      await apiCall(api, "setTitle", [title, event.threadID]);
      const group = getGroupSettings(event.threadID);
      if (group && group.enabled) updateGroupSettings(event.threadID, { title });
      return message.reply(`تم تحديث اسم المجموعة إلى: ${title}`);
    } catch (err) {
      console.error("gpname:", err);
      return message.reply("تعذر تحديث اسم المجموعة. تأكد أن البوت داخل مجموعة وأنه يملك الصلاحية.");
    }
  }
};