const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "2.0",
    author: "Itachiffx",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View command usage and list all available commands.",
    },
    longDescription: {
      en: "Displays a list of commands categorized by type or shows detailed help for a specific command.",
    },
    category: "info",
    guide: {
      en: "{pn} [command name] - Get detailed info about a specific command or list all commands.",
    },
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    // Command to show all commands or detailed help for a specific command
    if (args.length === 0) {
      const categories = {};
      let msg = "🌟 **Command List** 🌟\n\n";

      // Categorize commands
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;

        const category = value.config.category || "Uncategorized";
        if (!categories[category]) categories[category] = [];
        categories[category].push(name);
      }

      // Format each category and command list
      for (const category in categories) {
        msg += `\n📂 **${category.toUpperCase()}**\n`;
        const names = categories[category].sort();
        for (let i = 0; i < names.length; i += 3) {
          const cmdRow = names.slice(i, i + 3).map(cmd => `• ${cmd}`).join("   ");
          msg += `${cmdRow}\n`;
        }
      }

      // Display total commands and usage guide
      const totalCommands = commands.size;
      msg += `\n🌐 **Total Commands**: ${totalCommands}\n`;
      msg += `💡 Use \`${prefix}help [command name]\` to see detailed info for a specific command.\n\n🌟 **ITACHI SENSEI BOT** 🌟`;

      // Random image selection for better presentation
      const helpImages = [
        "https://i.ibb.co/c2LBssg/image.gif",
        "https://i.ibb.co/Rc8n1rd/image.jpg",
        "https://i.ibb.co/V2jNPGp/image.gif",
        "https://i.ibb.co/SJ6VhMY/image.gif",
        "https://i.ibb.co/fYtYCq3/image.gif",
        "https://i.ibb.co/c8s9YvH/image.gif"
      ];
      const helpImage = helpImages[Math.floor(Math.random() * helpImages.length)];
      
      try {
        await message.reply({
          body: msg,
          attachment: await global.utils.getStreamFromURL(helpImage)
        });
      } catch (err) {
        // Fallback in case image fetching fails
        await message.reply({
          body: msg,
          attachment: fs.createReadStream(path.resolve(__dirname, 'fallback.jpg')) // use a local fallback image
        });
      }
    } else {
      // Detailed help for a specific command
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        await message.reply(`❌ Command "${commandName}" not found.`);
      } else {
        const { name, aliases, version, role, countDown, author, longDescription, guide } = command.config;
        const roleText = getRoleText(role);
        const aliasList = aliases ? aliases.join(", ") : "None";
        const description = longDescription?.en || "No description available.";
        const usage = guide?.en.replace(/{p}/g, prefix).replace(/{n}/g, name) || "No usage available.";

        const detailedHelp = `📝 **Command**: ${name}\n🔄 **Aliases**: ${aliasList}\n⚙ **Version**: ${version}\n📋 **Role**: ${roleText}\n⏱ **Cooldown**: ${countDown}s\n👤 **Author**: ${author}\n\n📖 **Description**: ${description}\n📚 **Usage**: ${usage}`;

        await message.reply(detailedHelp);
      }
    }
  },
};

// Helper function to convert role number to string
function getRoleText(role) {
  switch (role) {
    case 0:
      return "0 (Everyone)";
    case 1:
      return "1 (Group Admin)";
    case 2:
      return "2 (Bot Admin)";
    default:
      return "Unknown";
  }
}
