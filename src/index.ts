import { GatewayIntentBits, Partials } from "discord.js";
import { Sequelize } from "sequelize";

import manifest from '../.env/bot_manifesto.json';
import { KClient } from "./classes/KClient";
import { join } from "path";
import { MLoggingChannels } from "./database/MLoggingChannels";
import { MLoggingConfig } from "./database/MLoggingConfig";

export const sequelInstance = new Sequelize({
    storage: 'database.sql',
    dialect: 'sqlite',
    host: 'localhost',
    logging: false
});

export const client = new KClient({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
}, manifest.token, manifest.clientId,
 join(__dirname, "./commands"), join(__dirname, "./events"));

(async () => {
    await (await MLoggingChannels.initialize()).sync();
    await (await MLoggingConfig.initialize()).sync();

    await client.login();
})();