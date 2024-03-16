import { Client, Guild } from "discord.js";
import { Model } from "sequelize";

export class MSettings extends Model<MSettingsAttributes> implements MSettingsAttributes {

}

export interface MSettingsAttributes {
    guildId: string;
    settings: MSettingsConfig;
}

export class MSettingsConfig {
    public punishmentSettings: MSettingsPunishmentConfig;

    constructor() {
        this.punishmentSettings = new MSettingsPunishmentConfig();
    }
}

export class MSettingsPunishmentConfig {
    public connectedGuilds: string[];

    constructor() {
        this.connectedGuilds = [];
    }

    public async fetchGulds(client: Client): Promise<Array<Guild>> {
        let guilds = await client.guilds.fetch();
        return Promise.all(guilds
            .filter(g => this.connectedGuilds.includes(g.id))
            .map(async (v) => await v.fetch())
        );
    }
}