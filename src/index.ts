import { GatewayIntentBits } from "discord.js";
import { ShitClient } from "./structure/ShitClient";
import path, { join } from "path";
import { DataType, Sequelize } from "sequelize";
import { logDebug, logError, logInfo } from './system';
import { configDotenv } from "dotenv";
import { MediaQueueItem } from "./structure/database/MediaQueueItem";
import { Media } from "./structure/modules/Media";
import { writeFile } from "fs";

configDotenv();
// playdl.authorization(); -- handle authentication stuff

export const Client = new ShitClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
}, {
    commands: join(__dirname, "commands"),
    events: join(__dirname, "events")
});

let databaseUri = process.env.database_uri || "";
export const sequelInstance = new Sequelize(databaseUri, {
    pool: {
        min: 1,
        max: 4,
        acquire: 20000,
        idle: 5*60*1000
    },
    logging: (sql, timing) => {
        logDebug("[SQL] " + sql + " (timing: " + timing?.toString() + ")");
    }
});

logInfo("Initializing...");

logInfo("Attempting database connection...");
sequelInstance.authenticate().then(async () => {
    // Database was successfully connected, continue startup
    logInfo("Database connection successful!");

    // Sync database
    await MediaQueueItem.initialize();
    await sequelInstance.sync({ force: true });

    await Client.login(process.env.token);

    postInitilization();
}).catch((reason) => {
    logError("The connection to the database could not be established!");
    logError(reason);
});

async function postInitilization() {
    logInfo("Initialization complete!");

    const guild = await Client.guilds.fetch("872836751520063600");
    const user = await Client.users.fetch("217092785700995073");

    await Media.createQueueItem(guild, user, "https://music.youtube.com/watch?v=m2irlTSRJU0&si=tHDgcEWKs62QMQkD");
    await Media.createQueueItem(guild, user, "https://music.youtube.com/playlist?list=PL4EJWCM_RXBF8hJVogEkR4nM6oJux6_GL&si=o4rLjiNjoqwiQVW-");

    console.log(await Media.fetchAllQueueItems());

    const queueItems = await Media.fetchGuildQueueItems(guild);
    console.log(queueItems);

    const songs = await Media.generateQueueSongs(queueItems);
    writeFile(path.join(__dirname, "test.json"), JSON.stringify(songs, null, 4), (err) => {
        if(err) console.error(err);
    });
}

// Handle process termination
process.on("SIGINT", async () => {
    logInfo("Received SIGINT, shutting down...");
    
    logInfo("Destroying client...");
    await Client.destroy();

    logInfo("Closing database connection...");
    await sequelInstance.close();

    logInfo("Shutdown complete! Goodbye!");
    process.exit(0);
});

process.on("uncaughtException", (err) => {
    logError("An uncaught exception occurred!");
    logError(err);
});

process.on("unhandledRejection", (reason) => {
    logError("An unhandled promise rejection occurred!");
    logError(reason);
});