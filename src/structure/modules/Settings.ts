import { Guild } from 'discord.js';
import { InternalSettingsAttribute, MSettingsEntry, MSettingsKeys, MSettingsValues, defaultSettings } from '../types/TSettings';
import { MSettings } from '../database/MSettings';

/**
 * The class to handle the handshake between the bot and the database.
 * This class is used to store and retrieve settings from the database.
 * @author Kyomi
 */
export class Settings {

    /**
     * Returns the guild settings map from the database.
     * @param guild the guild to fetch the settings for
     * @returns A promise that resolves with the settings map
     */
    public static async fetchMap(guild: Guild): Promise<InternalSettingsAttribute> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MSettings.findOne({ where: { guildId: guild.id } });
                if(!data) {
                    data = await MSettings.create({ guildId: guild.id });
                }

                resolve(data.settings);
            } catch(error) {
                reject(error);
            }
        });
    }
    
    /**
     * Fetches a single setting entry from the database.
     * @param guild the guild to fetch the setting for
     * @param key the key of the setting to fetch
     * @returns A promise that resolves with the setting entry
     */
    public static async fetchSetting<TKey extends MSettingsKeys>(guild: Guild, key: TKey): Promise<MSettingsEntry<TKey>> {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await this.fetchMap(guild);
                const _default = defaultSettings().get(key)!;
                
                resolve(data.get(key) as MSettingsEntry<TKey> || _default);
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Sets a setting entry in the database.
     * @param guild the guild to set the setting for
     * @param entry the entry to set
     * @returns A promise that resolves when the setting was saved
     */
    public static async setSetting<TKey extends MSettingsKeys>(guild: Guild, entry: MSettingsEntry<TKey>): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MSettings.findOne({ where: { guildId: guild.id } });
                if(!data) { 
                    data = await MSettings.create({ guildId: guild.id });
                }

                data.settings.set(entry.key, entry);

                await data.save().then(() => resolve()).catch(reject);
            } catch(error) {
                reject(error);
            }
        });
    }

    /**
     * Fetches the value of a setting from the database.
     * @param guild the guild to fetch the setting for
     * @param key the key of the setting to fetch
     * @returns A promise that resolves with the value of the setting
     */
    public static async fetchSettingValue(guild: Guild, key: MSettingsKeys): Promise<MSettingsValues[MSettingsKeys]> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSetting(guild, key).then((v) => resolve(v.value)).catch(reject);
        });
    }

    /**
     * Sets the value of a setting into the database.
     * @param guild the guild to set the setting for
     * @param key the key of the setting to set
     * @param value the value to set the setting to
     * @returns A promise that resolves when the setting was saved
     */
    public static async setSettingValue(guild: Guild, key: MSettingsKeys, value: MSettingsValues[MSettingsKeys]): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MSettings.findOne({ where: { guildId: guild.id } });
                if(!data) {
                    data = await MSettings.create({ guildId: guild.id });
                }

                const entry = await this.fetchSetting(guild, key);
                entry.value = value;

                data.settings.set(key, entry);

                await data.save().then(() => resolve()).catch(reject);
            } catch(error) {
                reject(error);
            }
        });
    }
}