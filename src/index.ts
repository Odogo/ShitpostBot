import { Sequelize } from "sequelize";
import { ShitClient } from "./structure/ShitClient";
import { join } from "path";
import { GatewayIntentBits, Partials } from "discord.js";
import { MLogging } from "./structure/database/MLogging";
import { MPunishments } from "./structure/database/MPunishments";
import { Punishments } from "./structure/modules/Punishments";
import { MSettings } from "./structure/database/MSettings";

export const sequelInstance = new Sequelize({
    storage: "database.sql",
    dialect: "sqlite",
    host: 'localhost',
    logging: false
}); 

export const client = new ShitClient({
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
        Partials.Message
    ]
}, {
    commands: join(__dirname, "commands"),
    events: join(__dirname, "events"),
    logging: join(__dirname, "logging")
});

(async () => {
    // Sync databases
    await (await MLogging.initialize(sequelInstance)).sync();
    await (await MPunishments.initialize(sequelInstance)).sync();
    await (await MSettings.initialize(sequelInstance)).sync();

    // Login to discord
    await client.login(process.env.token);

    console.log(client);

    // Testing grounds
    const self = client.user!;
    const target = await client.users.fetch("217092785700995073");
    const guild = await client.guilds.fetch("872836751520063600");

    const punishment = await Punishments.createPunishment({
        type: "warning",
        guild,
        target,
        executer: self,
        reason: "Testing",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    });

    console.log(punishment);
})();