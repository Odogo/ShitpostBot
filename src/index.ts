import { GatewayIntentBits } from "discord.js";
import { Sequelize } from "sequelize";

import manifest from '../.env/bot_manifesto.json';
import { KClient } from "./classes/KClient";
import { join } from "path";
import { MLoggingChannels } from "./database/MLoggingChannels";

export const sequelInstance = new Sequelize({
    storage: 'database.sql',
    dialect: 'sqlite',
    host: 'localhost',
    logging: false
});

export const client = new KClient({
    intents: [GatewayIntentBits.GuildVoiceStates],
    partials: []
}, manifest.token, manifest.clientId,
 join(__dirname, "./commands"), join(__dirname, "./events"));

(async () => {
    await (await MLoggingChannels.initialize()).sync();

    await client.login();
})();