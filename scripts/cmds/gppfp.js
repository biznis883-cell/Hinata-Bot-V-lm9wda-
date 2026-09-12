const {
  changeGroupImage,
  getGroupSettings,
  isGroupAdmin,
  saveImageFromEvent,
  updateGroupSettings
} = require("../utils/group");

module.exports = {
  config: {
    name: "gppfp",
    aliases: ["groupimage", "gpimage"],
    countDown: 5,
    description: "تغيير صورة المجموعة"
  },

  async onStart({ api, event, message, config }) {
    if (!(await isGroupAdmin(api, event, config))) {
      return message.reply("هذا الأمر متاح لمشرفي المجموعة فقط.");
    }

    try {
      const file = await saveImageFromEvent(api, event);
      await changeGroupImage(api, event.threadID, file);

      const group = getGroupSettings(event.threadID);
      if (group && group.enabled) {
        updateGroupSettings(event.threadID, { imagePath: file });
      }

      return message.reply("تم تحديث صورة المجموعة بنجاح.");
    } catch (err) {
      console.error("gppfp:", err);
      return message.reply(
        "تعذر تحديث الصورة. أرسل الأمر مع صورة أو قم بالرد على صورة، وتأكد من صلاحيات البوت."
      );
    }
  }
};