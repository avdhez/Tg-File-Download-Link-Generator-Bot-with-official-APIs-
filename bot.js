const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const WebTorrent = require('webtorrent');
const client = new WebTorrent();
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const downloadFile = async (url, dest) => {
    const res = await fetch(url);
    const fileStream = fs.createWriteStream(dest);
    return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on('error', reject);
        fileStream.on('finish', resolve);
    });
};

const downloadM3U8 = async (url, dest) => {
    return new Promise((resolve, reject) => {
        ffmpeg(url)
            .on('error', reject)
            .on('end', resolve)
            .output(dest)
            .run();
    });
};

bot.start((ctx) => ctx.reply('Welcome! Send me a file link, m3u8 stream, or torrent magnet link, and I will upload it to Telegram for you.'));

// Handle direct file links, m3u8 streams, and torrent magnet links
bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const isM3U8 = messageText.endsWith('.m3u8');
    const isTorrent = messageText.startsWith('magnet:');
    const isDirectLink = messageText.startsWith('http');

    if (isM3U8) {
        const fileName = path.join(tmpDir, `${Date.now()}.mp4`);
        try {
            await downloadM3U8(messageText, fileName);
            await ctx.replyWithDocument({ source: fileName });
            fs.unlinkSync(fileName);
        } catch (error) {
            console.error(error);
            ctx.reply('Failed to download m3u8 stream.');
        }
    } else if (isTorrent) {
        client.add(messageText, torrent => {
            torrent.files.forEach(file => {
                const filePath = path.join(tmpDir, file.name);
                const stream = file.createReadStream();
                const writeStream = fs.createWriteStream(filePath);
                stream.pipe(writeStream);
                writeStream.on('finish', async () => {
                    try {
                        await ctx.replyWithDocument({ source: filePath });
                        fs.unlinkSync(filePath);
                    } catch (error) {
                        console.error(error);
                        ctx.reply('Failed to upload torrent file.');
                    }
                });
            });
        });
    } else if (isDirectLink) {
        const fileName = path.join(tmpDir, path.basename(messageText));
        try {
            await downloadFile(messageText, fileName);
            await ctx.replyWithDocument({ source: fileName });
            fs.unlinkSync(fileName);
        } catch (error) {
            console.error(error);
            ctx.reply('Failed to download file.');
        }
    } else {
        ctx.reply('Please send a valid file link, m3u8 stream, or torrent magnet link.');
    }
});

bot.launch();

console.log('Bot is running...');