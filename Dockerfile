# Use the official Node.js 16 image as a base
FROM node:16

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the bot files to the container
COPY . .

# Expose the port used by the bot (if needed)
# EXPOSE 3000

# Command to run the bot
CMD ["node", "bot.js"]