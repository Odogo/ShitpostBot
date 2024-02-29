import { Guild, GuildTextBasedChannel } from "discord.js";
import { MLogging, MLoggingChannelAttributes, MLoggingTypeKeys, MLoggingCategoryKeys, MLoggingConfig, keyDefaults } from '../database/MLogging';

/**
 * This class is the middle man for contacting the {@link MLogging MLogging} database model.
 * 
 */
export class Logging {

    /**
    * These are some nice colors for the embeds, used for the logging system.
    */
    public static EmbedColors = {
        change: 0xf29b29,
        add: 0x75ff6b,
        remove: 0xff6b6b
    };

    //#region MLoggingCategoryKeys section (aka LoggingConfigCategory)
    /**
     * Fetches each (known) channel in the database from a guild.
     * @param guild the guild to fetch for
     * @returns a promise that resolves with a Map of channel ids and its settings
     */
    public static async fetchGuildChannelData(
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
    public static async fetchChannelCategories(
        channel: GuildTextBasedChannel
    ): Promise<Map<MLoggingCategoryKeys, boolean>> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchGuildChannelData(channel.guild).then(async (result) => {
                const mapObj = result.get(channel.id);

                if(!mapObj || mapObj === undefined) 
                    return resolve(keyDefaults());
                return resolve(mapObj.settings);
            }).catch(reject);
        });
    }

    /**
     * Gathers the ACTIVE (or 'true') settings for a channel and neatly puts them into an array.
     * @param channel the channel to fetch for (a guild text-based channel)
     * @returns a promise that resolves with an array of MLoggingSettingsKeys that were 'true' in the channel's settings
     */
    public static async fetchChannelActiveCategories(
        channel: GuildTextBasedChannel
    ): Promise<Array<MLoggingCategoryKeys>> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchChannelCategories(channel).then((map) => {
                const keys = Object.keys(map) as MLoggingCategoryKeys[];
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
    public static async isChannelLoggingCategory(
        channel: GuildTextBasedChannel,
        key: MLoggingCategoryKeys
    ): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            await Logging.fetchChannelActiveCategories(channel).then((v) => resolve(v.includes(key))).catch(reject);
        });
    }

    /**
     * Sets the settings key for a channel into the database.
     * @param channel a guild text-based channel to set the setting keys for
     * @param keys a map (of settings keys and if they're active or not) or an array (of active settings keys)
     * @returns a promise that resolves when the database was saved with the updated information
     */
    public static async setChannelCategories(
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
                            data.channels.set(channel.id, { settings: keyDefaults() });
                        }
                        data.channels.get(channel.id)?.settings.set(key, true);
                    }
                } else {
                    for(const [key, value] of keys) {
                        const mapObj = data.channels.get(channel.id);
                        if(!mapObj || mapObj === undefined) {
                            data.channels.set(channel.id, { settings: keyDefaults() });
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
        key: MLoggingCategoryKeys
    ): Promise<Array<GuildTextBasedChannel>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchGuildChannelData(guild).then(async (map) => {
                const channels = guild.channels.cache.filter((channel) => {
                    return channel.isTextBased() && map.get(channel.id)?.settings.get(key) === true;
                });

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
    public static async fetchGuildLoggingTypes(
        guild: Guild
    ): Promise<Map<MLoggingTypeKeys, boolean>> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                resolve(data.types);
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
    public static async isGuildLoggingType(
        guild: Guild,
        key: MLoggingTypeKeys
    ): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            await this.fetchGuildLoggingTypes(guild).then((v) => resolve(v.get(key) || false)).catch(reject);
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
    public static async setGuildLoggingTypes(
        guild: Guild,
        keys: Map<MLoggingTypeKeys, boolean>
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                data.types = new Map([...data.types, ...keys]);

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
    public static async setGuildLoggingType(
        guild: Guild,
        key: MLoggingTypeKeys,
        state: boolean
    ): Promise<void> { return this.setGuildLoggingTypes(guild, new Map([[key, state]])); }
    //#endregion

    //#region MLoggingConfig
    /**
     * Fetches the configuration settings for a guild regarding the logging system.
     * @param guild the guild to fetch from
     * @returns a promise that resolves with the given guild's logging config
     */
    public static async fetchGuildConfig(
        guild: Guild
    ): Promise<MLoggingConfig> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                resolve(data.config);
            } catch(error) { return reject(error); }
        });
    }

    /**
     * Sets configuration settings into a guild for the logging system
     * @param guild the guild to set for
     * @param config the new updated config settings
     * @returns a promise that resolves when the database entry was successfully saved
     */
    public static async setGuildConfig(
        guild: Guild,
        config: MLoggingConfig
    ): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                let data = await MLogging.findOne({ where: { guildId: guild.id }});
                if(!data || data === null) {
                    data = await MLogging.create({ guildId: guild.id });
                }

                data.config = config;

                await data.save().then(() => resolve()).catch(reject);
            } catch(error) { return reject(error); }
        });
    }
    //#endregion
}

type ChannelSettingsSetOptions = Map<MLoggingCategoryKeys, boolean> | Array<MLoggingCategoryKeys>;