const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Use the token from the environment variable

// PostgreSQL Configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Start command
bot.start((ctx) => ctx.reply('Welcome! Send me a file and I will provide you with a download link.'));

// Handle file uploads
bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;
    const serverURL = process.env.SERVER_URL;

    try {
        const fileLink = await ctx.telegram.getFileLink(fileId);
        
        // Fetch the file
        const response = await fetch(fileLink.href);

        // Save the file locally
        const filePath = path.join(__dirname, 'uploads', fileName); // Assuming 'uploads' directory exists
        const fileStream = fs.createWriteStream(filePath);
        response.body.pipe(fileStream);

        // Store file record in the database
        const insertQuery = 'INSERT INTO files (file_name, file_path) VALUES ($1, $2)';
        await pool.query(insertQuery, [fileName, filePath]);

        // Send the download link
        const downloadLink = `${serverURL}/${fileName}`;
        ctx.reply(`Here is your download link: ${downloadLink}`);
    } catch (error) {
        console.error(error);
        ctx.reply('Sorry, something went wrong. Please try again.');
    }
});

bot.launch();

console.log('Bot is running...');