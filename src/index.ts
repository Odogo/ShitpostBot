import { join } from "path";
import { Sequelize } from "sequelize";

// Local Imports
import { KyClient } from "./structure/classes/discord/KyClient";
import manifest from "../.env/bot_manifest.json";
import { ServerQueueModel } from "./utilities/database/ServerQueueModel";

export const seqInstance = new Sequelize({ host: 'localhost', dialect: 'sqlite', logging: false, storage: 'database.sql'});

export const client = new KyClient({ 
    discord: {
        token: manifest.discord.token,
        clientId: manifest.discord.clientId
    },

    commandPath: join(__dirname, "./commands"),
    eventsPath: join(__dirname, "./events")
});

(async () => {
    // Initialize database tables
    await (await (ServerQueueModel.initialize())).sync();

    // Begin initalizing the client
    await client.initialize();
})();

// Process callbacks
process.stdin.on('data', async (text) => {
    let cmd = text.toString().trim();
    if(cmd === 'quit') {
        await client.shutdown();
        process.exit(0);
    }
});

process.on('SIGINT', async () => {
    await client.shutdown();
    process.exit(0);
});