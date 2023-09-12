import { join } from "path";
import { KyClient } from "./structure/classes/KyClient";
import { Sequelize } from "sequelize";

export const seqInstance = new Sequelize({ host: 'localhost', dialect: 'sqlite', logging: false, storage: 'database.sql'});

export const client = new KyClient({ 
    discord: {
        token: "",
        clientId: ""
    },

    commandPath: join(__dirname, "./commands"),
    eventsPath: join(__dirname, "./events")
});

(async () => {
    // Initialize database tables

    // Begin initalizing the client
    await client.initialize();
})();