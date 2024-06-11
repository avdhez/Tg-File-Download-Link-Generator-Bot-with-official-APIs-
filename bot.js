const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome! Send me a file and I will provide you with a download link.'));

bot.on(['document', 'video', 'audio'], async (ctx) => {
    const fileId = ctx.message.document?.file_id || ctx.message.video?.file_id || ctx.message.audio?.file_id;
    const fileName = ctx.message.document?.file_name || ctx.message.video?.file_name || ctx.message.audio?.file_name;
    const fileSize = ctx.message.document?.file_size || ctx.message.video?.file_size || ctx.message.audio?.file_size;

    try {
        if (fileSize && fileSize > YOUR_THRESHOLD) { // Set your threshold value here
            // If the file size is large, try to bypass the limit
            const fileLink = await ctx.telegram.getFileLink(fileId);
            ctx.reply(`Here is your download link: ${fileLink.href}`);
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