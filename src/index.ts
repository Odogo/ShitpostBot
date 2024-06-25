import { GatewayIntentBits } from "discord.js";
import { join } from "path";
import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
import provider from "play-dl";

import { ShitClient } from "./structure/ShitClient";
import { logDebug, logError, logInfo } from './system';
import { MediaQueueItem } from "./structure/database/MediaQueueItem";
import { Media } from "./structure/modules/Media";
import { MChannelFlex } from "./structure/database/MChannelFlex";
import { MediaPlayer } from "./structure/database/MediaPlayer";

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
    (async () => {
        logInfo("Attempting database connection...");
        await sequelInstance.authenticate();
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

        await Client.login(process.env.discord_token);

        postInitilization();
    })();
} catch (error) {
    logError("An error occured while trying to initialize the bot: " + error);
    logError(error);

    process.kill(process.pid, "SIGINT");
}

async function postInitilization() {
    await Media.onStartup(Client);
}

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