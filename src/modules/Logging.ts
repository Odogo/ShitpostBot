/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { Guild, TextBasedChannel } from "discord.js";
import { MLoggingChannels } from "../database/MLoggingChannels";
import { MLoggingConfig } from "../database/MLoggingConfig";

export enum LoggingConfigType {
    // Message Events
    MessageDelete,
    MessageEdited,
    MessagePurged,

    // Guild Members Events
    MemberJoin,
    MemberLeave,

    // Guild Events
    ChannelAdd,
    ChannelModify,
    ChannelRemove,

    RoleAdd,
    RoleModify,
    RoleRemove,

    GuildUpdate,
    EmojiUpdate,

    // Guild Member Events
    MemberRole,
    MemberName,
    MemberAvatar,

    MemberBan,
    MemberUnban,
    MemberTimeout,
    MemberUntimeout,

    // Voice Events
    VoiceJoin,
    VoiceSwitch,
    VoiceLeave,

    // Application Events
    SelfCommands,
    SelfCommandError
}

export enum LoggingConfigCategory {
    MessageEvents = "message",
    GuildMembersEvents = "guildMembers",
    GuildEvents = "guild",
    GuildMemberEvents = "guildMember",
    VoiceEvents = "voice",
    ApplicationEvents = "application"
}

export function getTypes(category: LoggingConfigCategory): Array<LoggingConfigType> | null {
    switch(category) {
        case LoggingConfigCategory.MessageEvents:
            return [LoggingConfigType.MessageDelete, LoggingConfigType.MessageEdited, LoggingConfigType.MessagePurged];
        
        case LoggingConfigCategory.GuildMembersEvents:
            return [LoggingConfigType.MemberJoin, LoggingConfigType.MemberLeave];

        case LoggingConfigCategory.GuildEvents:
            return [LoggingConfigType.ChannelAdd, LoggingConfigType.ChannelModify, LoggingConfigType.ChannelRemove,
            LoggingConfigType.RoleAdd, LoggingConfigType.RoleModify, LoggingConfigType.RoleRemove,
            LoggingConfigType.GuildUpdate, LoggingConfigType.EmojiUpdate];

        case LoggingConfigCategory.GuildMemberEvents:
            return [LoggingConfigType.MemberRole, LoggingConfigType.MemberName, LoggingConfigType.MemberAvatar,
            LoggingConfigType.MemberBan, LoggingConfigType.MemberUnban, LoggingConfigType.MemberTimeout, LoggingConfigType.MemberUntimeout]

        case LoggingConfigCategory.VoiceEvents:
            return [LoggingConfigType.VoiceJoin, LoggingConfigType.VoiceSwitch, LoggingConfigType.VoiceLeave];

        case LoggingConfigCategory.ApplicationEvents:
            return [LoggingConfigType.SelfCommands, LoggingConfigType.SelfCommandError]
                
        default: return null;
    }
}

/**
 * Determines if we are actually logging the events provided inside of the category.
 * 
 * If true, there is a channel found in the database and we are logging this category events.
 * 
 * If false, there is no channel found, thus we aren't logging it.
 * 
 * @param guild The guild to grab data from
 * @param category The category to check
 * @returns the channel id of the logging channel for the category
 */
export async function isCategoryLogged(guild: Guild, category: LoggingConfigCategory): Promise<string|undefined> {
    return new Promise(async (resolve, reject) => {
        await MLoggingChannels.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(data === null || !data) {
                data = await MLoggingChannels.create({ guildId: guild.id });
            }

            switch(category) {
                case LoggingConfigCategory.MessageEvents:
                    resolve(data.logMessages);

                case LoggingConfigCategory.GuildMembersEvents:
                    resolve(data.logGuildMembers);

                case LoggingConfigCategory.GuildEvents:
                    resolve(data.logGuild);

                case LoggingConfigCategory.GuildMemberEvents:
                    resolve(data.logGuildMember);

                case LoggingConfigCategory.VoiceEvents:
                    resolve(data.logVoice);

                case LoggingConfigCategory.ApplicationEvents:
                    resolve(data.logCommands);

                default: reject(new Error("Invalid category"));
            }
        }).catch(reject);
    });
}

/**
 * Determines whether a specific logging type is active or not.
 * 
 * @param guild The guild to check for
 * @param type The config type to get
 * @returns The ConfigType's resulting boolean, true if active, false if not.
 */
export async function isTypeLogged(guild: Guild, type: LoggingConfigType): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        await MLoggingConfig.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(data === null || !data) {
                data = await MLoggingConfig.create({ guildId: guild.id });
            }

            switch(type) {
                case LoggingConfigType.MessageDelete: resolve(data.msgDelete);
                case LoggingConfigType.MessageEdited: resolve(data.msgEdited);
                case LoggingConfigType.MessagePurged: resolve(data.msgPurged);
                case LoggingConfigType.MemberJoin: resolve(data.memberJoin);
                case LoggingConfigType.MemberLeave: resolve(data.memberLeave);
                case LoggingConfigType.ChannelAdd: resolve(data.channelAdd);
                case LoggingConfigType.ChannelModify: resolve(data.channelModify);
                case LoggingConfigType.ChannelRemove: resolve(data.channelRemove);
                case LoggingConfigType.RoleAdd: resolve(data.roleAdd);
                case LoggingConfigType.RoleModify: resolve(data.roleModify);
                case LoggingConfigType.RoleRemove: resolve(data.roleRemove);
                case LoggingConfigType.GuildUpdate: resolve(data.guildUpdate);
                case LoggingConfigType.EmojiUpdate: resolve(data.emojiUpdate);
                case LoggingConfigType.MemberRole: resolve(data.memberRole);
                case LoggingConfigType.MemberName: resolve(data.memberName);
                case LoggingConfigType.MemberAvatar: resolve(data.memberAvatar)
                case LoggingConfigType.MemberBan: resolve(data.memberBan);
                case LoggingConfigType.MemberUnban: resolve(data.memberUnban);
                case LoggingConfigType.MemberTimeout: resolve(data.memberTimeout);
                case LoggingConfigType.MemberUntimeout: resolve(data.memberUntimeout);
                case LoggingConfigType.VoiceJoin: resolve(data.voiceJoin);
                case LoggingConfigType.VoiceSwitch: resolve(data.voiceSwitch);
                case LoggingConfigType.VoiceLeave: resolve(data.voiceLeave);
                case LoggingConfigType.SelfCommands: resolve(data.selfCommands);
                case LoggingConfigType.SelfCommandError: resolve(data.selfCommandError);
                default: reject(new Error("Invalid type"));
            }
        }).catch(reject);
    });
}

export async function setChannelForCategory(guild: Guild, category: LoggingConfigCategory, channel: null | TextBasedChannel): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await MLoggingChannels.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(data === null || !data) {
                data = await MLoggingChannels.create({ guildId: guild.id });
            }
        
            switch(category) {
                case LoggingConfigCategory.MessageEvents: data.logMessages = (channel ? channel.id: undefined); break;
                case LoggingConfigCategory.GuildMembersEvents: data.logGuildMembers = (channel ? channel.id: undefined); break;
                case LoggingConfigCategory.GuildEvents: data.logGuild = (channel ? channel.id: undefined); break;
                case LoggingConfigCategory.GuildMemberEvents: data.logGuildMember = (channel ? channel.id: undefined); break;
                case LoggingConfigCategory.VoiceEvents: data.logVoice = (channel ? channel.id: undefined); break;
                case LoggingConfigCategory.ApplicationEvents: data.logCommands = (channel ? channel.id: undefined); break;
                default: reject(new Error("Invalid category"));
            }    

            await MLoggingChannels.update(data, { where: { guildId: guild.id }})
                .then(() => resolve())
                .catch(reject);
        }).catch(reject);
    });
}

export async function setStateForType(guild: Guild, type: LoggingConfigType, state: boolean): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await MLoggingConfig.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(data === null || !data) {
                data = await MLoggingConfig.create({ guildId: guild.id });
            }

            switch(type) {
                case LoggingConfigType.MessageDelete: data.msgDelete = state;
                case LoggingConfigType.MessageEdited: data.msgEdited = state;
                case LoggingConfigType.MessagePurged: data.msgPurged = state;
                case LoggingConfigType.MemberJoin: data.memberJoin = state;
                case LoggingConfigType.MemberLeave: data.memberLeave = state;
                case LoggingConfigType.ChannelAdd: data.channelAdd = state;
                case LoggingConfigType.ChannelModify: data.channelModify = state;
                case LoggingConfigType.ChannelRemove: data.channelRemove = state;
                case LoggingConfigType.RoleAdd: data.roleAdd = state;
                case LoggingConfigType.RoleModify: data.roleModify = state;
                case LoggingConfigType.RoleRemove: data.roleRemove = state;
                case LoggingConfigType.GuildUpdate: data.guildUpdate = state;
                case LoggingConfigType.EmojiUpdate: data.emojiUpdate = state;
                case LoggingConfigType.MemberRole: data.memberRole = state;
                case LoggingConfigType.MemberName: data.memberName = state; 
                case LoggingConfigType.MemberAvatar: data.memberAvatar = state;
                case LoggingConfigType.MemberBan: data.memberBan = state;
                case LoggingConfigType.MemberUnban: data.memberUnban = state;
                case LoggingConfigType.MemberTimeout: data.memberTimeout = state;
                case LoggingConfigType.MemberUntimeout: data.memberUntimeout = state;
                case LoggingConfigType.VoiceJoin: data.voiceJoin = state;
                case LoggingConfigType.VoiceSwitch: data.voiceSwitch = state;
                case LoggingConfigType.VoiceLeave: data.voiceLeave = state;
                case LoggingConfigType.SelfCommands: data.selfCommands = state;
                case LoggingConfigType.SelfCommandError: data.selfCommandError = state;
                
                default: reject(new Error("Invalid type"));
            }

            await MLoggingConfig.update(data, { where: { guildId: guild.id }})
                .then(() => resolve())
                .catch(reject);
        }).catch(reject);
    });
}