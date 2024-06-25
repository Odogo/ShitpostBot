import { GatewayIntentBits, VoiceBasedChannel } from "discord.js";
import path, { join } from "path";
import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
import { writeFile } from "fs";
import provider from "play-dl";

import { ShitClient } from "./structure/ShitClient";
import { logDebug, logError, logInfo } from './system';
import { MediaQueueItem } from "./structure/database/MediaQueueItem";
import { Media } from "./structure/modules/Media";
import { MChannelFlex } from "./structure/database/MChannelFlex";
import { MediaPlayer, MusicTextBasedChannel } from "./structure/database/MediaPlayer";

configDotenv();

export const Client = new ShitClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildModeration,
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

try {
    logInfo("Attempting database connection...");
    sequelInstance.authenticate().then(async () => {
        // Database was successfully connected, continue startup
        logInfo("Database connection successful!");

        // Sync database
        await MediaPlayer.initialize();
        await MediaQueueItem.initialize();
        await MChannelFlex.initialize();
        await sequelInstance.sync();

        // Fetch Soundcloud API token
        await provider.getFreeClientID().then((client_id) => {
            provider.setToken({ soundcloud: { client_id } });
        });

        await Client.login(process.env.token);

        postInitilization();
    }).catch((reason) => {
        logError("The connection to the database could not be established!");
        logError(reason);
    });
} catch (error) {
    logError("An error occured while trying to initialize the bot: " + error);
    logError(error);

    process.kill(process.pid, "SIGINT");
}

async function postInitilization() {
    await Media.onStartup(Client);
}

// async function postInitilization() {
//     logInfo("Initialization complete!");

//     const guild = await Client.guilds.fetch("872836751520063600");
//     const user = await Client.users.fetch("217092785700995073");

//     // YouTube Test
//     await Media.createQueueItem(guild, user, "https://music.youtube.com/watch?v=m2irlTSRJU0&si=tHDgcEWKs62QMQkD");
//     await Media.createQueueItem(guild, user, "https://music.youtube.com/playlist?list=PL4EJWCM_RXBF8hJVogEkR4nM6oJux6_GL&si=o4rLjiNjoqwiQVW-");

//     //Spotify Test
//     await Media.createQueueItem(guild, user, "https://open.spotify.com/track/4u7EnebtmKWzUH433cf5Qv?si=5e7b1b3b7b7e4b3b");
//     await Media.createQueueItem(guild, user, "https://open.spotify.com/album/4gHGMtnZCgVrTX8j7ccWOM?si=zehhF33GR0O1nWnlPJwRIw");
//     await Media.createQueueItem(guild, user, "https://open.spotify.com/playlist/5hmaTTs6y1Wm4nxscjlaNi?si=dfd85862991c49f5");

//     //Soundcloud Test
//     await Media.createQueueItem(guild, user, "https://soundcloud.com/monstercat/nitro-fun-new-game?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing");
//     await Media.createQueueItem(guild, user, "https://soundcloud.com/monstercat/sets/ace-aura-eternal?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing");

//     await Media.shuffleQueue(guild);
// }

// Handle process termination
process.on("SIGINT", async () => {
    logInfo("Received SIGINT, shutting down...");
    
    logInfo("Shutting down modules..");
    await Media.onShutdown(Client);

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