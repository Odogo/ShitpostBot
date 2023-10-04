import { Sequelize } from "sequelize";
import manifest from '../.env/bot_manifesto.json';
import { KClient } from "./classes/KClient";
import { GatewayIntentBits } from "discord.js";

export const sequelInstance = new Sequelize({
    database: 'database.sql',
    dialect: 'sqlite',
    timezone: 'America/Chicago'
});

export const client = new KClient({
    intents: [GatewayIntentBits.GuildVoiceStates],
    partials: []
}, manifest.token, manifest.clientId);