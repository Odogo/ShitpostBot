import { GatewayIntentBits } from "discord.js";
import { ShitClient } from "./structure/ShitClient";
import { join } from "path";
import { Sequelize } from "sequelize";
import { logDebug, logError, logInfo } from './system';
import { configDotenv } from "dotenv";
import playdl from 'play-dl';

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

    await Client.login(process.env.token);
}).catch((reason) => {
    logError("The connection to the database could not be established!");
    logError(reason);
});