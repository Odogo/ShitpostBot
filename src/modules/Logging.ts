/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { Collection, Guild, TextChannel } from "discord.js";

import { MLoggingConfig } from "../database/logging/MLoggingConfig";
import { MLoggingChannels } from "../database/logging/MLoggingChannels";

import { LoggingConfigCategory } from '../enums/logging/LoggingConfigCategory';
import { LoggingConfigType } from '../enums/logging/LoggingConfigType';

export const EmbedColors = {
    change: 0xf29b29,
    add: 0x75ff6b,
    remove: 0xff6b6b
}

//#region Category Section 
/**
 * Gathers the logging categories of a TextChannel and returns them.
 * 
 * @param channel the channel to get categories for
 * @returns an array of active logging categories associated with the channel
 */
export async function fetchChannelLogCategories(channel: TextChannel): Promise<LoggingConfigCategory[]> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLoggingChannels.findOne({ where: { channelId: channel.id }});

            if(data === null || !data) {
                data = await MLoggingChannels.create({ channelId: channel.id, guildId: channel.guild.id });
            }

            let categories: LoggingConfigCategory[] = [];
            if(data.logMessages)     categories.push(LoggingConfigCategory.MessageEvents);
            if(data.logGuildMembers) categories.push(LoggingConfigCategory.GuildMembersEvents);
            if(data.logGuild)        categories.push(LoggingConfigCategory.GuildEvents);
            if(data.logGuildMember)  categories.push(LoggingConfigCategory.GuildMemberEvents);
            if(data.logVoice)        categories.push(LoggingConfigCategory.VoiceEvents);
            if(data.logCommands)     categories.push(LoggingConfigCategory.ApplicationEvents);
            
            resolve(categories);
        } catch(error) {
            reject(error);
        }
    });
}

/**
 * Fetches all instances of a channel from the database with a matching guild ID.
 * 
 * Returns a collection of strings (channel IDs), with all active LoggingConfigCategory types.
 * If empty, no logging categories are active, but previously had some.
 * 
 * @param guild the guild to search channels from
 * @returns a collection of channel IDs and the active category types
 */
export async function fetchGuildChannelData(guild: Guild): Promise<Collection<TextChannel, Array<LoggingConfigCategory>>> {
    return new Promise(async (resolve, reject) => {
        await MLoggingChannels.findAll({ where: { guildId: guild.id }}).then(async (values) => {
            let map = new Collection<TextChannel, Array<LoggingConfigCategory>>();

            try {
                let channelCache = guild.channels.cache;
                for(let i=0; i<values.length; i++) {
                    let dbObj = values[i];

                    let channel = channelCache.get(dbObj.channelId);
                    if(channel == undefined || !(channel instanceof TextChannel)) {
                        await MLoggingChannels.destroy({ where: { channelId: dbObj.channelId, guildId: dbObj.guildId }});
                        continue;
                    }

                    map.set(channel, await fetchChannelLogCategories(channel));
                }
            } catch(error) { reject(error); }

            resolve(map);
        }).catch(reject);
    });
}

/**
 * Checks if the provided category is actively being logged inside given channel.
 * 
 * @param channel the channel to get categories for
 * @param category the category to find
 * @returns true/false if the category exists, (false if could not find channel)
 */
export async function hasCategoryLoggedInChannel(channel: TextChannel, category: LoggingConfigCategory): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        try {
            let channelData = await fetchGuildChannelData(channel.guild)
            let categories = channelData.get(channel);

            if(categories === undefined) resolve(false);
            else resolve(categories.includes(category));
        } catch(error) {
            reject(error);
        }
    });
}

/**
 * Sets the active categories into the database for the specific channel.
 * 
 * @param channel the channel to set data for
 * @param categories the categories that will now be active in this channel
 */
export async function setCategoriesForChannel(channel: TextChannel, categories: LoggingConfigCategory[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLoggingChannels.findOne({ where: { channelId: channel.id, guildId: channel.guild.id }});
            if(data === null || !data) {
                data = await MLoggingChannels.create({ channelId: channel.id, guildId: channel.guild.id });
            }

            for(let i=0; i<LoggingConfigCategory.values().length; i++) {
                let category = LoggingConfigCategory.values()[i];

                let state = categories.includes(category);
                switch(category) {
                    case LoggingConfigCategory.MessageEvents:      { data.logMessages     = state; break; }
                    case LoggingConfigCategory.GuildMembersEvents: { data.logGuildMembers = state; break; }
                    case LoggingConfigCategory.GuildEvents:        { data.logGuild        = state; break; }
                    case LoggingConfigCategory.GuildMemberEvents:  { data.logGuildMember  = state; break; }
                    case LoggingConfigCategory.VoiceEvents:        { data.logVoice        = state; break; }
                    case LoggingConfigCategory.ApplicationEvents:  { data.logCommands     = state; break; }
                }
            }

            await data.save()
                .then(() => resolve())
                .catch(reject);
        } catch(error) {
            reject(error);
        }
    });
}

/**
 * Finds all logging channels that include a specific logging category.
 * 
 * @param guild the guild to get the channels (and categories) from
 * @param category the category to look for
 * @returns an array of text channels that are logging the mentioned category
 */
export async function gatherChannelsForLogging(guild: Guild, category: LoggingConfigCategory): Promise<Array<TextChannel>> {
    return new Promise(async (resolve, reject) => {
        try {
            let channels: TextChannel[] = [];

            let data = await fetchGuildChannelData(guild);
            for(let i = 0; i < data.size; i++) {
                let categories = data.at(i);
                if(categories === undefined) continue;

                if(categories.includes(category)) {
                    let channel = data.keyAt(i);
                    if(channel === undefined) continue;
                    channels.push(channel);
                }
            }

            resolve(channels);
        } catch(reason) {
            reject(reason);
        }
    });
}
//#endregion

//#region Types Section
/**
 * Gathers the config settings for the logging types based on the guild.
 * 
 * @param guild the guild to get the config settings for each logging type
 * @returns a collection of configtypes and booleans, indicating which type is active or not
 */
export async function getGuildLoggingTypes(guild: Guild, category?: LoggingConfigCategory): Promise<Collection<LoggingConfigType, boolean>> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLoggingConfig.findOne({ where: { guildId: guild.id} });
            if(data === null || !data) {
                data = await MLoggingConfig.create({ guildId: guild.id });
            }

            let catTypes = (category !== undefined ? LoggingConfigCategory.getTypes(category): LoggingConfigType.values());
            let collection = new Collection<LoggingConfigType, boolean>();
            for(let i = 0; i < catTypes.length; i++) {
                let type = catTypes[i];

                let setData = false;
                switch(type) {
                    case LoggingConfigType.MessageDelete:    { setData = data.msgDelete; break; }
                    case LoggingConfigType.MessageEdited:    { setData = data.msgEdited; break; }
                    case LoggingConfigType.MessagePurged:    { setData = data.msgPurged; break; }
                    case LoggingConfigType.MemberJoin:       { setData = data.memberJoin; break; }
                    case LoggingConfigType.MemberLeave:      { setData = data.memberLeave; break; }
                    case LoggingConfigType.ChannelAdd:       { setData = data.channelAdd; break; }
                    case LoggingConfigType.ChannelModify:    { setData = data.channelModify; break; }
                    case LoggingConfigType.ChannelRemove:    { setData = data.channelRemove; break; }
                    case LoggingConfigType.RoleAdd:          { setData = data.roleAdd; break; }
                    case LoggingConfigType.RoleModify:       { setData = data.roleModify; break; }
                    case LoggingConfigType.RoleRemove:       { setData = data.roleRemove; break; }
                    case LoggingConfigType.GuildUpdate:      { setData = data.guildUpdate; break; }
                    case LoggingConfigType.EmojiUpdate:      { setData = data.emojiUpdate; break; }
                    case LoggingConfigType.MemberRole:       { setData = data.memberRole; break; }
                    case LoggingConfigType.MemberBan:        { setData = data.memberBan; break; }
                    case LoggingConfigType.MemberUnban:      { setData = data.memberUnban; break; }
                    case LoggingConfigType.MemberTimeout:    { setData = data.memberTimeout; break; }
                    case LoggingConfigType.MemberUntimeout:  { setData = data.memberUntimeout; break; }
                    case LoggingConfigType.VoiceJoin:        { setData = data.voiceJoin; break; }
                    case LoggingConfigType.VoiceSwitch:      { setData = data.voiceSwitch; break; }
                    case LoggingConfigType.VoiceLeave:       { setData = data.voiceLeave; break; }
                    case LoggingConfigType.SelfCommands:     { setData = data.selfCommands; break; }
                    case LoggingConfigType.SelfCommandError: { setData = data.selfCommandError; break; }
                }

                collection.set(type, setData);
            }

            resolve(collection);
        } catch(error) {
            reject(error);
        }
    });
}

/**
 * 
 * @param guild the guild to set everything into
 * @param category the category to set the types
 * @param types the new list of ACTIVE types
 * @returns 
 */
export async function setGuildLoggingTypes(guild: Guild, category: LoggingConfigCategory, types: LoggingConfigType[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
        try {
            let data = await MLoggingConfig.findOne({ where: { guildId: guild.id} });
            if(data === null || !data) {
                data = await MLoggingConfig.create({ guildId: guild.id });
            }

            let catTypes = LoggingConfigCategory.getTypes(category);
            for(let i = 0; i < catTypes.length; i++) {
                let type = catTypes[i];
                let active = types.includes(type);

                switch(type) {
                    case LoggingConfigType.MessageDelete:    { data.msgDelete = active; break; }
                    case LoggingConfigType.MessageEdited:    { data.msgEdited = active; break; }
                    case LoggingConfigType.MessagePurged:    { data.msgPurged = active; break; }
                    case LoggingConfigType.MemberJoin:       { data.memberJoin = active; break; }
                    case LoggingConfigType.MemberLeave:      { data.memberLeave = active; break; }
                    case LoggingConfigType.ChannelAdd:       { data.channelAdd = active; break; }
                    case LoggingConfigType.ChannelModify:    { data.channelModify = active; break; }
                    case LoggingConfigType.ChannelRemove:    { data.channelRemove = active; break; }
                    case LoggingConfigType.RoleAdd:          { data.roleAdd = active; break; }
                    case LoggingConfigType.RoleModify:       { data.roleModify = active; break; }
                    case LoggingConfigType.RoleRemove:       { data.roleRemove = active; break; }
                    case LoggingConfigType.GuildUpdate:      { data.guildUpdate = active; break; }
                    case LoggingConfigType.EmojiUpdate:      { data.emojiUpdate = active; break; }
                    case LoggingConfigType.MemberRole:       { data.memberRole = active; break; }
                    case LoggingConfigType.MemberBan:        { data.memberBan = active; break; }
                    case LoggingConfigType.MemberUnban:      { data.memberUnban = active; break; }
                    case LoggingConfigType.MemberTimeout:    { data.memberTimeout = active; break; }
                    case LoggingConfigType.MemberUntimeout:  { data.memberUntimeout = active; break; }
                    case LoggingConfigType.VoiceJoin:        { data.voiceJoin = active; break; }
                    case LoggingConfigType.VoiceSwitch:      { data.voiceSwitch = active; break; }
                    case LoggingConfigType.VoiceLeave:       { data.voiceLeave = active; break; }
                    case LoggingConfigType.SelfCommands:     { data.selfCommands = active; break; }
                    case LoggingConfigType.SelfCommandError: { data.selfCommandError = active; break; }
                }
            }

            await data.save()
                .then(() => resolve())
                .catch(reject);
        } catch(error) {
            reject(error);
        }
    });
}

/**
 * Grabs the state of the LoggingConfigType from the Guild's data
 * 
 * @param guild the guild to grab data from
 * @param type the type to check for
 * @returns true if logged, false otherwise (or if undefined for whatever reason)
 */
export async function isGuildTypeLogged(guild: Guild, type: LoggingConfigType): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        await getGuildLoggingTypes(guild).then((value) => {
            let result = value.get(type);
            if(result === undefined) { 
                resolve(false); 
                return; 
            }

            resolve(result);
        }).catch(reject);
    });
}
//#endregion