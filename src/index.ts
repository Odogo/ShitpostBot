import { GatewayIntentBits, Partials } from "discord.js";
import { Sequelize } from "sequelize";
import { join } from "path";

import manifest from '../.env/bot_manifesto.json';
import { KClient } from "./classes/KClient";
import { MLoggingChannels } from "./database/logging/MLoggingChannels";
import { MLoggingConfig } from "./database/logging/MLoggingConfig";
import { MPunishment } from "./database/moderation/MPunishment";

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
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.User
    ],
    token: manifest.token,
    clientId: manifest.clientId,
    paths: {
        commands: join(__dirname, "./commands"),
        events: join(__dirname, "./events"),
        logging: join(__dirname, "./logging")
    },
    
});

// Putting everything together
(async () => {
    // Logging Database
    await (await MLoggingChannels.initialize()).sync();
    await (await MLoggingConfig.initialize()).sync();
    await (await MPunishment.initialize()).sync();

    await client.login();
})();