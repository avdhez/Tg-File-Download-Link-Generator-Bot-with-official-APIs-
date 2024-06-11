const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Use the token from the environment variable

// Start command
bot.start((ctx) => ctx.reply('Welcome! Send me a file (up to 50 MB) and I will provide you with a download link. For files larger than 50 MB, please upload them to a cloud storage service like Google Drive or Dropbox and share the link here.'));

// Handle file uploads
bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const fileSize = ctx.message.document.file_size;
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB in bytes

    if (fileSize > MAX_FILE_SIZE) {
        return ctx.reply('The file is too big to download directly. Please upload it to a cloud storage service (e.g., Google Drive, Dropbox) and share the link here.');
    }

    try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        // Send the download link
        ctx.reply(`Here is your download link: ${fileLink.href}`);
    } catch (error) {
        console.error(error);
        ctx.reply('Sorry, something went wrong. Please try again.');
    }
});

// Handle messages containing cloud storage links
bot.on('text', (ctx) => {
    const messageText = ctx.message.text;
    
    // Regex patterns to match Google Drive and Dropbox links
    const googleDrivePattern = /https:\/\/drive\.google\.com\/file\/d\/[^\/]+\/view/;
    const dropboxPattern = /https:\/\/www\.dropbox\.com\/s\/[^\/]+\/[^\/]+\?dl=0/;

    if (googleDrivePattern.test(messageText)) {
        ctx.reply('Thank you for sharing the Google Drive link. Here is your file link: ' + messageText);
    } else if (dropboxPattern.test(messageText)) {
        ctx.reply('Thank you for sharing the Dropbox link. Here is your file link: ' + messageText);
    } else {
        ctx.reply('If you are sharing a file link, please make sure it is a valid Google Drive or Dropbox link.');
    }
});

bot.launch();

console.log('Bot is running...');