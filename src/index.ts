import { Sequelize } from "sequelize";
import { ShitClient } from "./structure/ShitClient";
import { join } from "path";
import { GatewayIntentBits, Partials } from "discord.js";
import { MLogging, MLoggingConfigKeys, MLoggingSettingsKeys} from "./structure/database/MLogging";
import { Logging } from "./structure/modules/Logging";

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

    // Login to discord
    await client.login(process.env.token);

    const guild = await client.guilds.fetch("872836751520063600");
    await Logging.setGuildConfiguration(guild, new Map(MLoggingConfigKeys.all().map(key => [key, true])));

    const channel = await guild.channels.fetch("1171805208586768456");
    if(channel === null || !channel.isTextBased()) return;

    await Logging.setChannelSettings(channel, MLoggingSettingsKeys.all());
})();
