const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome! Send me a file and I will provide you with a download link.'));

bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileSize = ctx.message.document.file_size;

    try {
        if (fileSize > YOUR_THRESHOLD) { // Set your threshold value here
            // If the file size is large, send JSON message with file details
            ctx.reply(JSON.stringify({
                fileName: fileName,
                fileSize: fileSize,
                fileId: fileId
            }));
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