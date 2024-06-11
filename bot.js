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

const downloadM3U8 = async (url, dest, resolution) => {
    return new Promise((resolve, reject) => {
        ffmpeg(url)
            .inputOptions([`-vf "scale=${resolution}"`]) // Scale to selected resolution
            .on('error', reject)
            .on('end', resolve)
            .output(dest)
            .run();
    });
};

const parseM3U8Playlist = async (url) => {
    const response = await fetch(url);
    const playlistText = await response.text();
    const resolutions = [];
    // Regular expression to match resolution tags in the playlist file
    const regex = /RESOLUTION=(\d+x\d+)/g;
    let match;
    while ((match = regex.exec(playlistText)) !== null) {
        resolutions.push(match[1]);
    }
    return resolutions;
};

bot.start((ctx) => ctx.reply('Welcome! Send me a file link, m3u8 stream, or torrent magnet link, and I will upload it to Telegram for you.'));

bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    const isM3U8 = messageText.endsWith('.m3u8');
    const isTorrent = messageText.startsWith('magnet:');
    const isDirectLink = messageText.startsWith('http');

    if (isM3U8) {
        try {
            // Parse m3u8 playlist to get available resolutions
            const resolutions = await parseM3U8Playlist(messageText);
            if (resolutions.length === 0) {
                ctx.reply('No resolutions found in the m3u8 playlist.');
                return;
            }
            // Ask user to choose resolution
            const resolutionMessage = 'Choose a resolution:';
            const resolutionKeyboard = Telegraf.Markup.keyboard(resolutions).resize().oneTime().extra();
            await ctx.reply(resolutionMessage, resolutionKeyboard);
            // Set bot state to handle resolution selection
            ctx.session.messageText = messageText;
        } catch (error) {
            console.error(error);
            ctx.reply('Failed to parse m3u8 stream.');
        }
    } else if (isTorrent) {
        // Torrent handling (same as before)
    } else if (isDirectLink) {
        // Direct link handling (same as before)
    } else {
        ctx.reply('Please send a valid file link, m3u8 stream, or torrent magnet link.');
    }
});

bot.hears(/^\d+x\d+$/, async (ctx) => {
    const messageText = ctx.session.messageText;
    const resolution = ctx.message.text;
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const fileName = path.join(tmpDir, `${Date.now()}_${resolution}_output.mp4`);
    try {
        // Download m3u8 stream with selected resolution
        await downloadM3U8(messageText, fileName, resolution);
        await ctx.replyWithDocument({ source: fileName });
        fs.unlinkSync(fileName);
    } catch (error) {
        console.error(error);
        ctx.reply('Failed to download m3u8 stream.');
    }
});

bot.launch();

console.log('Bot is running...');