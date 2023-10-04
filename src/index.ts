import { GatewayIntentBits } from "discord.js";
import { Sequelize } from "sequelize";

import manifest from '../.env/bot_manifesto.json';
import { KClient } from "./classes/KClient";
import { MServerLogging } from "./database/MServerLogging";

export const sequelInstance = new Sequelize({
    storage: 'database.sql',
    dialect: 'sqlite',
    host: 'localhost',
    logging: false
});

export const client = new KClient({
    intents: [GatewayIntentBits.GuildVoiceStates],
    partials: []
}, manifest.token, manifest.clientId);

(async () => {
    await (await MServerLogging.initialize()).sync();

    await client.login();
})();