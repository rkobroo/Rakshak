const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pending",
    aliases: ['pend'],
    version: "1.1",
    author: "Itachiffx",
    countDown: 5,
    role: 2,
    shortDescription: "Accept or refuse pending messages",
    longDescription: "Approve or reject users or threads in the pending queue",
    category: "Utility",
  },

  validateUserPermission: function (senderID) {
    const permission = global.GoatBot.config.adminBot;
    return permission.includes(senderID);
  },

  sendPendingList: async function (list, listType, api, event, messageID) {
    let msg = "", index = 1;
    for (const single of list) {
      const name = listType === "group" ? single.name || "Unknown" : await usersData.getName(single.threadID);
      msg += `${index++}/ ${name} (${single.threadID})\n`;
    }

    if (list.length === 0) {
      return api.sendMessage(`[ - ] No pending ${listType}s found.`, event.threadID, messageID);
    }

    const promptMessage = `❯ Total ${list.length} pending ${listType}s found.\n❯ Reply with the number to accept or 'c <num>' to cancel:\n${msg}`;
    return api.sendMessage(promptMessage, event.threadID, (error, info) => {
      global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        messageID: info.messageID,
        author: event.senderID,
        pending: list
      });
    }, messageID);
  },

  processPendingList: async function ({ api, pending, selectedIndices, threadID }) {
    let approvedCount = 0;
    for (const singleIndex of selectedIndices) {
      const target = pending[singleIndex - 1];
      if (!target) continue;

      try {
        const downloadUrl = "https://raw.githubusercontent.com/zoro-77/video-hosting/main/cache/video-1728016354357-335.mp4";
        const filePath = path.join(__dirname, "assets", "box.mp4");

        const response = await axios({
          method: "GET",
          url: downloadUrl,
          responseType: "stream"
        });

        const fileWriter = fs.createWriteStream(filePath);
        response.data.pipe(fileWriter);

        fileWriter.on("finish", async () => {
          await api.changeNickname(
            `[ ${global.GoatBot.config.prefix} ] • ${global.GoatBot.config.nickNameBot || "Made by ???"}`,
            target.threadID,
            api.getCurrentUserID()
          );

          await api.sendMessage({
            body: `${global.GoatBot.config.nickNameBot} is now connected! Use ${global.GoatBot.config.prefix}help for commands.`,
            attachment: fs.createReadStream(filePath)
          }, target.threadID);

          approvedCount += 1;
        });
      } catch (error) {
        console.error("Error processing pending user:", error);
      }
    }

    setTimeout(() => {
      api.sendMessage(`[ OK ] Successfully approved ${approvedCount} thread(s)!`, threadID);
    }, 5000);
  },

  onReply: async function ({ message, api, event, usersData, Reply }) {
    const { author, pending } = Reply;
    if (String(event.senderID) !== String(author)) return;
    const { body, threadID, messageID } = event;

    if (isNaN(body) && (body.startsWith("c") || body.startsWith("cancel"))) {
      const indices = body.slice(1).split(/\s+/).map(Number);
      const invalid = indices.some(i => isNaN(i) || i <= 0 || i > pending.length);

      if (invalid) return api.sendMessage("[ ERR ] Invalid cancel number", threadID, messageID);

      return api.sendMessage("[ OK ] Canceled successfully.", threadID, messageID);
    } else {
      const selectedIndices = body.split(/\s+/).map(Number);
      const invalid = selectedIndices.some(i => isNaN(i) || i <= 0 || i > pending.length);

      if (invalid) return api.sendMessage("[ ERR ] Invalid number", threadID, messageID);

      api.unsendMessage(messageID);
      return this.processPendingList({ api, pending, selectedIndices, threadID });
    }
  },

  onStart: async function ({ message, api, event, args, usersData }) {
    if (args.length === 0) {
      return api.sendMessage("❯ Use pending:\n❯ pending user: User queue\n❯ pending thread: Group queue\n❯ pending all: All pending approvals", event.threadID, event.messageID);
    }

    const [targetType] = args;

    if (!this.validateUserPermission(event.senderID)) {
      return api.sendMessage("[ ERR ] You don't have permission to use this command!", event.threadID, event.messageID);
    }

    try {
      const [spam, pending] = await Promise.all([
        api.getThreadList(100, null, ["OTHER"]) || [],
        api.getThreadList(100, null, ["PENDING"]) || []
      ]);

      const combinedList = [...spam, ...pending];

      switch (targetType.toLowerCase()) {
        case "user":
        case "u":
          const userList = combinedList.filter(group => !group.isGroup);
          return this.sendPendingList(userList, "user", api, event, event.messageID);

        case "thread":
        case "t":
          const threadList = combinedList.filter(group => group.isGroup);
          return this.sendPendingList(threadList, "group", api, event, event.messageID);

        case "all":
        case "a":
          return this.sendPendingList(combinedList, "user and thread", api, event, event.messageID);

        default:
          return api.sendMessage("[ ERR ] Invalid command option.", event.threadID, event.messageID);
      }
    } catch (e) {
      console.error("[ ERR ] Unable to fetch pending list:", e);
      return api.sendMessage("[ ERR ] Unable to fetch pending list.", event.threadID, event.messageID);
    }
  }
};
