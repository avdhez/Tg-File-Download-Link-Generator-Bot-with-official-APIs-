const { Telegraf } = require('telegraf');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN); // Use the token from the environment variable

// MySQL Configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

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
        pool.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting MySQL connection:', err);
                ctx.reply('Sorry, something went wrong. Please try again.');
                return;
            }

            const insertQuery = 'INSERT INTO files (file_name, file_path) VALUES (?, ?)';
            connection.query(insertQuery, [fileName, filePath], (error, results, fields) => {
                connection.release();
                if (error) {
                    console.error('Error inserting file record:', error);
                    ctx.reply('Sorry, something went wrong. Please try again.');
                    return;
                }

                // Send the download link
                const downloadLink = `${serverURL}/${fileName}`;
                ctx.reply(`Here is your download link: ${downloadLink}`);
            });
        });
    } catch (error) {
        console.error(error);
        ctx.reply('Sorry, something went wrong. Please try again.');
    }
});

bot.launch();

console.log('Bot is running...');