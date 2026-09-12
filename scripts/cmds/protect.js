const {
  getGroupSettings,
  getThreadInfo,
  isGroupAdmin,
  saveImageFromUrl,
  updateGroupSettings
} = require("../utils/group");

module.exports = {
  config: {
    name: "protect",
    aliases: ["حماية"],
    countDown: 5,
    description: "تشغيل أو إيقاف حماية اسم وصورة وكنيات المجموعة"
  },

  async onStart({ api, event, args, message, config }) {
    if (!(await isGroupAdmin(api, event, config))) {
      return message.reply("هذا الأمر متاح لمشرفي المجموعة فقط.");
    }

    const action = String(args[0] || "").toLowerCase();
    if (action !== "on" && action !== "off") {
      return message.reply("الاستخدام: #protect on أو #protect off");
    }

    if (action === "off") {
      updateGroupSettings(event.threadID, { enabled: false });
      return message.reply("تم إيقاف حماية اسم المجموعة وصورتها وكنيات الأعضاء.");
    }

    try {
      const info = await getThreadInfo(api, event.threadID);
      const nicknames = {};
      for (const participantID of info.participantIDs || []) {
        nicknames[String(participantID)] = (info.nicknames || {})[participantID] || "";
      }

      let savedImagePath = null;
      try {
        savedImagePath = await saveImageFromUrl(event.threadID, info.imageSrc);
      } catch (imageError) {
        console.error("تعذر حفظ صورة الحماية:", imageError.message || imageError);
      }

      updateGroupSettings(event.threadID, {
        enabled: true,
        title: info.threadName || "",
        nicknames,
        bulkNickname: null,
        imagePath: savedImagePath
      });

      return message.reply(
        savedImagePath
          ? "تم تشغيل الحماية للاسم والصورة وكنيات الأعضاء."
          : "تم تشغيل الحماية للاسم والكنيات. تعذر حفظ الصورة الحالية؛ استخدم #gppfp مع صورة لتثبيتها."
      );
    } catch (err) {
      console.error("protect on:", err);
      return message.reply("تعذر تشغيل الحماية. تأكد من صلاحيات البوت داخل المجموعة.");
    }
  }
};