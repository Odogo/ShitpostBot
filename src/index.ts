import { Sequelize } from "sequelize";
import { ShitClient } from "./structure/ShitClient";
import { join } from "path";
import { GatewayIntentBits } from "discord.js";

export const sequelInstance = new Sequelize({
    storage: "database.sql",
    dialect: "sqlite",
    host: 'localhost',
    logging: false
});

export const client = new ShitClient({
    intents: [
        GatewayIntentBits.Guilds
    ]
}, {
    commands: join(__dirname, "commands"),
    events: join(__dirname, "events"),
    logging: join(__dirname, "logging")
});

(async () => {
    // Sync databases

    // Login to discord
    await client.login(process.env.token);
})();