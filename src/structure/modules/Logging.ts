import { Guild, GuildTextBasedChannel } from "discord.js";
import { MLogging, MLoggingChannelAttributes, MLoggingConfigKeys, MLoggingSettingsKeys } from '../database/MLogging';

export class Logging {

    /**
    * These are some nice colors for the embeds, used for the logging system.
    */
    public static EmbedColors = {
        change: 0xf29b29,
        add: 0x75ff6b,
        remove: 0xff6b6b
    };

    //#region MLoggingSettingsKeys section (aka LoggingConfigCategory)
    /**
     * Fetches each (known) channel in the database from a guild.
     * @param guild the guild to fetch for
     * @returns a promise that resolves with a Map of channel ids and its settings
     */
    public static async fetchGuildData(
        guild: Guild
    ): Promise<Map<string, MLoggingChannelAttributes>> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id } });
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                resolve(data.channels);
            } catch(reason) {
                reject(reason);
            }
        });
    }

    /**
     * Gathers the logging settings (previously known as "logging categories") for a guild text-based channel.
     * @param channel a guild text-based channel
     * @returns a promise that resolves with a Map of MLoggingSettingsKey and their states
     */
    public static async fetchChannelSettings(
        channel: GuildTextBasedChannel
    ): Promise<Map<MLoggingSettingsKeys, boolean>> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchGuildData(channel.guild).then(async (result) => {
                const mapObj = result.get(channel.id);

                if(!mapObj || mapObj === undefined) 
                    return resolve(MLoggingChannelAttributes.defaults());
                return resolve(mapObj.settings);
            }).catch(reject);
        });
    }

    /**
     * Gathers the ACTIVE (or 'true') settings for a channel and neatly puts them into an array.
     * @param channel the channel to fetch for (a guild text-based channel)
     * @returns a promise that resolves with an array of MLoggingSettingsKeys that were 'true' in the channel's settings
     */
    public static async fetchActiveChannelSettings(
        channel: GuildTextBasedChannel
    ): Promise<Array<MLoggingSettingsKeys>> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchChannelSettings(channel).then((map) => {
                const keys = Object.keys(map) as MLoggingSettingsKeys[];
                resolve(keys.filter((v) => map.get(v)) || false);
            }).catch(reject);
        });
    }

    /**
     * Determines if the provided channel is actively logging for a specific setting key.
     * @param channel a guild text-based channel
     * @param key the setting key in question
     * @returns a promise that resolves as true, if this channel is actively logging the category, otherwise false
     */
    public static async isChannelLoggingType(
        channel: GuildTextBasedChannel,
        key: MLoggingSettingsKeys
    ): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchActiveChannelSettings(channel).then((v) => resolve(v.includes(key))).catch(reject);
        });
    }

    /**
     * Sets the settings key for a channel into the database.
     * @param channel a guild text-based channel to set the setting keys for
     * @param keys a map (of settings keys and if they're active or not) or an array (of active settings keys)
     * @returns a promise that resolves when the database was saved with the updated information
     */
    public static async setChannelSettings(
        channel: GuildTextBasedChannel,
        keys: ChannelSettingsSetOptions
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: channel.guild.id } });
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: channel.guild.id });
                }

                if(Array.isArray(keys)) {
                    for(const key of keys) {
                        const mapObj = data.channels.get(channel.id);
                        if(!mapObj || mapObj === undefined) {
                            data.channels.set(channel.id, { settings: MLoggingChannelAttributes.defaults() });
                        }
                        data.channels.get(channel.id)?.settings.set(key, true);
                    }
                } else {
                    for(const [key, value] of keys) {
                        const mapObj = data.channels.get(channel.id);
                        if(!mapObj || mapObj === undefined) {
                            data.channels.set(channel.id, { settings: MLoggingChannelAttributes.defaults() });
                        }
                        data.channels.get(channel.id)?.settings.set(key, value);
                    }
                }

                await data.save().then(() => resolve()).catch(reject);
            } catch(reason) {
                reject(reason);
            }
        });
    }

    /**
     * Collects every channel inside of a guild that is actively logging the given key
     * @param guild the guild to search through
     * @param key the key to collect channels on
     * @returns a promise that resolves with an array of GuildTextBasedChannels that are actively logging key
     */
    public static async collectChannelsToLog(
        guild: Guild,
        key: MLoggingSettingsKeys
    ): Promise<Array<GuildTextBasedChannel>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchGuildData(guild).then(async (map) => {
                const channels = guild.channels.cache.filter((channel) => {
                    return channel.isTextBased() && map.get(channel.id)?.settings.get(key) === true;
                });

                console.log(channels);

                resolve(Array.from(channels.values()) as GuildTextBasedChannel[]);
            }).catch(reject);
        });
    }
    //#endregion

    //#region MLoggingConfigKeys section (aka LoggingConfigType)
    /**
     * Fetches the guild's configuration regarding logging types
     * @param guild the guild to fetch for
     * @returns a promise that resolves with a map of MLoggingConfigKeys and their current state (true being actively logged)
     */
    public static async fetchGuildConfiguration(
        guild: Guild
    ): Promise<Map<MLoggingConfigKeys, boolean>> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                resolve(data.config);
            } catch(reason) {
                reject(reason);
            }
        });
    }

    /**
     * Determines if a key in a guild's configuration is active or not
     * @param guild the guild to fetch
     * @param key the key in question
     * @returns a promise that returns true if the key is being logged, otherwise false (defaults to false if not found)
     */
    public static async isLoggingType(
        guild: Guild,
        key: MLoggingConfigKeys
    ): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            await this.fetchGuildConfiguration(guild).then((v) => resolve(v.get(key) || false)).catch(reject);
        });
    }

    /**
     * Sets the new keys into the database.
     * 
     * If a key is not defined in the given Map, the key will not be updated.
     * 
     * @param guild the guild to set the keys into
     * @param keys the new/updated keys
     * @returns a promise that resolves when the database was saved with the updated information
     */
    public static async setGuildConfiguration(
        guild: Guild,
        keys: Map<MLoggingConfigKeys, boolean>
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                data.config = new Map([...data.config, ...keys]);

                await data.save().then(() => resolve()).catch(reject);
            } catch(reason) {
                reject(reason);
            }
        });
    }

    /**
     * Similarly to {@link Logging.setGuildConfiguration setGuildConfiguration}, except only applies to a singluar key instead.
     * Effectively does the same thing, and is just a nice little helper method <3
     *  
     * @param guild the guild to set the keys into
     * @param key the key in question
     * @param state the new state for the key
     * @returns a promise that resolves when the database was saved with the updated information
     * @see {@link Logging.setGuildConfiguration setGuildConfiguration}
     */
    public static async setGuildConfigKey(
        guild: Guild,
        key: MLoggingConfigKeys,
        state: boolean
    ): Promise<void> { return this.setGuildConfiguration(guild, new Map([[key, state]])); }
    //#endregion
}

type ChannelSettingsSetOptions = Map<MLoggingSettingsKeys, boolean> | Array<MLoggingSettingsKeys>;