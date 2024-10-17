const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "uptimeMonitor",
    aliases: ["uptime", "monitor", "upm"],
    version: "1.0",
    author: "OtinXSandip & Vex_kshitiz",
    role: 0,
    shortDescription: { en: "Displays uptime, total users, total threads, and ping." },
    longDescription: { en: "Displays the total number of users, threads, bot uptime, and ping, along with a random anime image." },
    category: "system",
    guide: { en: "Use {p}uptimeMonitor to view all system stats and uptime." }
  },

  onStart: async function ({ api, event, args, usersData, threadsData }) {
    try {
      // Start ping timer
      const startTime = Date.now();

      // Fetch all users and threads
      const allUsers = await usersData.getAll();
      const allThreads = await threadsData.getAll();

      // Get system uptime
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      const uptimeString = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds`;

      // Get a random anime image
      const animeNames = ["zoro", "madara", "obito", "luffy", "itachi"];
      const randomAnime = animeNames[Math.floor(Math.random() * animeNames.length)];
      const imageUrl = `https://pin-kshitiz.vercel.app/pin?search=${encodeURIComponent(randomAnime)}`;

      const animeResponse = await axios.get(imageUrl);
      const animeImage = animeResponse.data.result[Math.floor(Math.random() * animeResponse.data.result.length)];

      const imageBuffer = await axios.get(animeImage, { responseType: 'arraybuffer' });
      const imagePath = path.join(__dirname, 'cache', `uptimeMonitor_image.jpg`);
      await fs.outputFile(imagePath, imageBuffer.data);

      // Calculate ping
      const ping = Date.now() - startTime;

      // Build message
      const message = `⏰ | Bot Uptime: ${uptimeString}\n\n👪 | Total Users: ${allUsers.length}\n🌸 | Total Threads: ${allThreads.length}\n🏓 | Ping: ${ping}ms`;

      // Send message with image
      const imageStream = fs.createReadStream(imagePath);
      await api.sendMessage({
        body: message,
        attachment: imageStream
      }, event.threadID, event.messageID);

      // Clean up the image file
      await fs.unlink(imagePath);
    } catch (error) {
      console.error("Error in uptimeMonitor command:", error);
      api.sendMessage("An error occurred while retrieving the data.", event.threadID);
    }
  }
};
