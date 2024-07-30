const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Set the threshold size to 2GB in bytes
const THRESHOLD_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

bot.start((ctx) => ctx.reply('Welcome! Send me a file and I will provide you with a download link.'));

bot.on(['document', 'video', 'audio'], async (ctx) => {
    const fileId = ctx.message.document?.file_id || ctx.message.video?.file_id || ctx.message.audio?.file_id;
    const fileName = ctx.message.document?.file_name || ctx.message.video?.file_name || ctx.message.audio?.file_name;
    const fileSize = ctx.message.document?.file_size || ctx.message.video?.file_size || ctx.message.audio?.file_size;

    try {
        if (fileSize && fileSize > THRESHOLD_SIZE) {
            // If the file size exceeds the threshold, send a message instead of downloading
            ctx.reply(`The file size (${(fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB) exceeds the maximum allowed size.`);
        } else {
            const fileLink = await ctx.telegram.getFileLink(fileId);

            // Save the file locally
            const response = await fetch(fileLink.href);
            const buffer = await response.buffer();
            const filePath = path.join(__dirname, fileName);
            fs.writeFileSync(filePath, buffer);

            // Send the download link
            ctx.reply(`Here is your download link: ${fileLink.href}`);
        }
    } catch (error) {
        console.error(error);
        ctx.reply('Sorry, something went wrong. Please try again.');
    }
});

bot.launch();

console.log('Bot is running...');

//jisne code copy kiya uska chin tabaq dum dum 