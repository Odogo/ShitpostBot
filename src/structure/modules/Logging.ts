import { Collection, Guild, GuildTextBasedChannel, TextChannel } from "discord.js";
import { MLogging, MLoggingChannelAttributes, MLoggingConfigKeys, MLoggingSettingsKeys } from '../database/MLogging';

/**
 * These are some nice colors for the embeds, used for the logging system.
 */
export const EmbedColors = {
    change: 0xf29b29,
    add: 0x75ff6b,
    remove: 0xff6b6b
}

/**
 * Fetches the logging settings for each channel in the guild.
 * @param guild the guild to fetch the channels (and settings) from
 * @returns a promise that resolves with a collection of channel ids and their settings
 */
export async function fetchGuildData(
    guild: Guild
): Promise<Collection<string, Record<MLoggingSettingsKeys, boolean>>> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLogging.findOne({ where: { guildId: guild.id } });
            if(data === null || !data) {
                data = await MLogging.create({ guildId: guild.id });
            }

            const map = new Collection<string, Record<MLoggingSettingsKeys, boolean>>();
        
            let channelCache = guild.channels.cache;
            for(let [id, channel] of channelCache) {
                if(channel.isTextBased()) {
                    let keys = Object.keys(data.channels);
                    if(!keys.includes(id)) {
                        data.channels[id] = { settings: MLoggingChannelAttributes.DEFAULT};
                        await data.save();
                    }

                    map.set(id, data.channels[id].settings);
                }
            }

            return resolve(map);
        } catch(reason) {
            return reject(reason);
        }
    });
}

/**
 * Gathers the logging settings (the logging categories) for the text channel.
 * 
 * This must have a guild attatched to the channel.
 * @param channel a guild text based channel
 * @returns a promise that resolves with an array of MLoggingSettingsKeys
 */
export async function fetchChannelLogCategories(
    channel: GuildTextBasedChannel
): Promise<Array<MLoggingSettingsKeys> | undefined> {
    return new Promise(async (resolve, reject) => {
        await fetchGuildData(channel.guild).then(async (map) => {
            let settings = map.get(channel.id);
            if(!settings) return resolve(undefined);

            let keys = Object.keys(settings);
            let categories = new Array<MLoggingSettingsKeys>();

            for(let key of keys) {
                if(settings[key as keyof typeof settings]) 
                    categories.push(key as MLoggingSettingsKeys);
            }

            return resolve(categories);
        }).catch(reject);
    });
}

/**
 * Checks if the provided category is enabled for the channel.
 * 
 * @param channel the channel to check the category for
 * @param category the category in question
 * @returns a promise that resolves with a boolean
 */
export async function isChannelLoggingCategory(
    channel: GuildTextBasedChannel,
    category: MLoggingSettingsKeys
): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        await fetchChannelLogCategories(channel).then((categories) => {
            if(categories === undefined) return resolve(false);
            return resolve(categories.includes(category));
        }).catch(reject);
    });
}

/**
 * Sets the active categories into the database for the channel.
 * 
 * @param channel the channel to set the categories for
 * @param categories the categories to set
 * @returns a promise that resolves when the categories have been set
 */
export async function setCategoriesForChannel(
    channel: GuildTextBasedChannel,
    categories: Array<MLoggingSettingsKeys>
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await fetchGuildData(channel.guild).then(async (map) =>  {
            let settings = map.get(channel.id) || MLoggingChannelAttributes.DEFAULT;

            for(let key of Object.keys(settings)) {
                settings[key as keyof typeof settings] = categories.includes(key as MLoggingSettingsKeys);
            }

            const updatedChannels: Record<string, MLoggingChannelAttributes> = {};
            for (const [id, channelSettings] of map.entries()) {
                updatedChannels[id] = { settings: channelSettings };
            }

            await MLogging.update({ channels: updatedChannels }, { where: { guildId: channel.guild.id } });
            return resolve();
        }).catch(reject);
    });
}

/**
 * Gather all channels in a guild that have a specific category enabled.
 * 
 * @param guild the guild to gather the channels from
 * @param category the category to check for
 * @returns a promise that resolves with an array of text based channels
 */
export async function gatherChannelsForLogging(
    guild: Guild,
    category: MLoggingSettingsKeys
): Promise<Array<GuildTextBasedChannel>> {
    return new Promise(async (resolve, reject) => {
        await fetchGuildData(guild).then(async (map) => {
            let channels = guild.channels.cache.filter((channel) => {
                return channel.isTextBased() && map.get(channel.id)?.[category] === true;
            });

            return resolve(Object.values(channels) as Array<GuildTextBasedChannel>);
        }).catch(reject);
    });
}

/**
 * Fetch the logging configuration for a guild.
 * @param guild the guild to fetch the configuration for
 * @returns a promise that resolves with a map of MLoggingConfigKeys and their boolean values
 */
export async function fetchGuildLoggingConfig(
    guild: Guild
): Promise<Map<MLoggingConfigKeys, boolean>> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLogging.findOne({ where: { guildId: guild.id } });
            if(data === null || !data) {
                data = await MLogging.create({ guildId: guild.id });
            }

            const configMap = new Map<MLoggingConfigKeys, boolean>();
            for (const [key, value] of Object.entries(data.config)) {
                configMap.set(key as MLoggingConfigKeys, value);
            }

            return resolve(configMap);
        } catch(reason) {
            return reject(reason);
        }
    });
}

export async function setGuildLoggingConfig(
    guild: Guild,
    config: Map<MLoggingConfigKeys, boolean> | Array<MLoggingConfigKeys>
): Promise<void> {
    
}