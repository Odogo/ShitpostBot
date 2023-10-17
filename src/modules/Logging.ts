/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { APISelectMenuOption, Guild, NonThreadGuildBasedChannel, SelectMenuComponentOptionData, StringSelectMenuOptionBuilder, TextBasedChannel } from "discord.js";
import { MLoggingChannels } from "../database/logging/MLoggingChannels";
import { MLoggingConfig } from "../database/logging/MLoggingConfig";
import { logDebug, logError } from "../system";

export enum LoggingConfigType {
    // Message Events
    MessageDelete = "messageDelete",
    MessageEdited = "messageEdited",
    MessagePurged = "messagePurged",

    // Guild Members Events
    MemberJoin = "memberJoin",
    MemberLeave = "memberLeave",

    // Guild Events
    ChannelAdd = "channelAdd",
    ChannelModify = "channelModify",
    ChannelRemove = "channelRemove",

    RoleAdd = "roleAdd",
    RoleModify = "roleModify",
    RoleRemove = "roleRemove",

    GuildUpdate = "guildUpdate",
    EmojiUpdate = "emojiUpdate",

    // Guild Member Events
    MemberRole = "memberRole",
    MemberName = "memberName",
    MemberAvatar = "memberAvatar",

    MemberBan = "memberBan",
    MemberUnban = "memberUnban",
    MemberTimeout = "memberTimeout",
    MemberUntimeout = "memberUntimeout",

    // Voice Events
    VoiceJoin = "voiceJoin",
    VoiceSwitch = "voiceSwitch",
    VoiceLeave = "voiceLeave",

    // Application Events
    SelfCommands = "selfCommand",
    SelfCommandError = "selfCommandError"
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

export function stringedType(channel: NonThreadGuildBasedChannel) {
    switch(channel.type) {
        case 0: return "Text Channel";
        case 2: return "Voice Channel";
        case 4: return "Category";
        case 5: return "Announcement Channel";
        case 13: return "Stage Channel";
        case 15: return "Forum Channel";
        default: return "Unknown?";
    }
};

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
export async function isCategoryLogged(guild: Guild, category: LoggingConfigCategory): Promise<string | undefined> {
    return new Promise(async (resolve, reject) => {
        await MLoggingChannels.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(data === null || !data) {
                data = await MLoggingChannels.create({ guildId: guild.id });
            }

            switch(category) {
                case LoggingConfigCategory.MessageEvents:
                    resolve(data.logMessages);
                    break;

                case LoggingConfigCategory.GuildMembersEvents:
                    resolve(data.logGuildMembers);
                    break;

                case LoggingConfigCategory.GuildEvents:
                    resolve(data.logGuild);
                    break;

                case LoggingConfigCategory.GuildMemberEvents:
                    resolve(data.logGuildMember);
                    break;

                case LoggingConfigCategory.VoiceEvents:
                    resolve(data.logVoice);
                    break;

                case LoggingConfigCategory.ApplicationEvents:
                    resolve(data.logCommands);
                    break;

                default: reject(new Error("Invalid category")); break;
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
                case LoggingConfigType.MessageDelete: resolve(data.msgDelete); break;
                case LoggingConfigType.MessageEdited: resolve(data.msgEdited); break;
                case LoggingConfigType.MessagePurged: resolve(data.msgPurged); break;
                case LoggingConfigType.MemberJoin: resolve(data.memberJoin); break;
                case LoggingConfigType.MemberLeave: resolve(data.memberLeave); break;
                case LoggingConfigType.ChannelAdd: resolve(data.channelAdd); break;
                case LoggingConfigType.ChannelModify: resolve(data.channelModify); break;
                case LoggingConfigType.ChannelRemove: resolve(data.channelRemove); break;
                case LoggingConfigType.RoleAdd: resolve(data.roleAdd); break;
                case LoggingConfigType.RoleModify: resolve(data.roleModify); break;
                case LoggingConfigType.RoleRemove: resolve(data.roleRemove); break;
                case LoggingConfigType.GuildUpdate: resolve(data.guildUpdate); break;
                case LoggingConfigType.EmojiUpdate: resolve(data.emojiUpdate); break;
                case LoggingConfigType.MemberRole: resolve(data.memberRole); break;
                case LoggingConfigType.MemberName: resolve(data.memberName); break;
                case LoggingConfigType.MemberAvatar: resolve(data.memberAvatar); break;
                case LoggingConfigType.MemberBan: resolve(data.memberBan); break;
                case LoggingConfigType.MemberUnban: resolve(data.memberUnban); break;
                case LoggingConfigType.MemberTimeout: resolve(data.memberTimeout); break;
                case LoggingConfigType.MemberUntimeout: resolve(data.memberUntimeout); break;
                case LoggingConfigType.VoiceJoin: resolve(data.voiceJoin); break;
                case LoggingConfigType.VoiceSwitch: resolve(data.voiceSwitch); break;
                case LoggingConfigType.VoiceLeave: resolve(data.voiceLeave); break;
                case LoggingConfigType.SelfCommands: resolve(data.selfCommands); break;
                case LoggingConfigType.SelfCommandError: resolve(data.selfCommandError); break;
                default: reject(new Error("Invalid type")); break;
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

            await data.save()
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

            switch(type as LoggingConfigType) {
                case LoggingConfigType.MessageDelete: data.msgDelete = state; break;
                case LoggingConfigType.MessageEdited: data.msgEdited = state; break;
                case LoggingConfigType.MessagePurged: data.msgPurged = state; break;
                case LoggingConfigType.MemberJoin: data.memberJoin = state; break;
                case LoggingConfigType.MemberLeave: data.memberLeave = state; break;
                case LoggingConfigType.ChannelAdd: data.channelAdd = state; break;
                case LoggingConfigType.ChannelModify: data.channelModify = state; break;
                case LoggingConfigType.ChannelRemove: data.channelRemove = state; break;
                case LoggingConfigType.RoleAdd: data.roleAdd = state; break;
                case LoggingConfigType.RoleModify: data.roleModify = state; break;
                case LoggingConfigType.RoleRemove: data.roleRemove = state; break;
                case LoggingConfigType.GuildUpdate: data.guildUpdate = state; break;
                case LoggingConfigType.EmojiUpdate: data.emojiUpdate = state; break;
                case LoggingConfigType.MemberRole: data.memberRole = state; break;
                case LoggingConfigType.MemberName: data.memberName = state; break;
                case LoggingConfigType.MemberAvatar: data.memberAvatar = state; break;
                case LoggingConfigType.MemberBan: data.memberBan = state; break;
                case LoggingConfigType.MemberUnban: data.memberUnban = state; break;
                case LoggingConfigType.MemberTimeout: data.memberTimeout = state; break;
                case LoggingConfigType.MemberUntimeout: data.memberUntimeout = state; break;
                case LoggingConfigType.VoiceJoin: data.voiceJoin = state; break;
                case LoggingConfigType.VoiceSwitch: data.voiceSwitch = state; break;
                case LoggingConfigType.VoiceLeave: data.voiceLeave = state; break;
                case LoggingConfigType.SelfCommands: data.selfCommands = state; break;
                case LoggingConfigType.SelfCommandError: data.selfCommandError = state; break;
                
                default: reject(new Error("Invalid type")); break;
            }

            await data.save()
                .then(() => resolve())
                .catch(reject);
        }).catch(reject);
    });
}

export function getSelectMenuOption(type: LoggingConfigType): APISelectMenuOption  {
    switch(type) {
        case LoggingConfigType.MessageDelete: return { label: "Message Delete", value: LoggingConfigType.MessageDelete, description: "Post a log about a deleted message, it's content and who sent it" }
        case LoggingConfigType.MessageEdited: return { label: "Message Edited", value: LoggingConfigType.MessageEdited, description: "Post a log about an edited message, what it was before and after" }
        case LoggingConfigType.MessagePurged: return { label: "Message Purged", value: LoggingConfigType.MessagePurged, description: "Post a log about a bulk message deletion" }
        case LoggingConfigType.MemberJoin: return { label: "Member Joined", value: LoggingConfigType.MemberJoin, description: "Show who joined!" }
        case LoggingConfigType.MemberLeave: return { label: "Member Leave", value: LoggingConfigType.MemberLeave, description: "Show who left.." }
        case LoggingConfigType.ChannelAdd: return { label: "Channel Added", value: LoggingConfigType.ChannelAdd, description: "Post a log about a newly added channel" }
        case LoggingConfigType.ChannelModify: return { label: "Channel Modified", value: LoggingConfigType.ChannelModify, description: "Post a log about a modified channel and what changed" }
        case LoggingConfigType.ChannelRemove: return { label: "Channel Removed", value: LoggingConfigType.ChannelRemove, description: "Post a log about a deleted channel" }
        case LoggingConfigType.RoleAdd: return { label: "Role Added", value: LoggingConfigType.RoleAdd, description: "Post a log about a newly created role" }
        case LoggingConfigType.RoleModify: return { label: "Role Modified", value: LoggingConfigType.RoleModify, description: "Post a log about a modified role and what changed" }
        case LoggingConfigType.RoleRemove: return { label: "Role Removed", value: LoggingConfigType.RoleRemove, description: "Post a log about a deleted role" }
        case LoggingConfigType.GuildUpdate: return { label: "Guild Updated", value: LoggingConfigType.GuildUpdate, description: "Post a log about any update to the guild settings" }
        case LoggingConfigType.EmojiUpdate: return { label: "Emoji Updated", value: LoggingConfigType.EmojiUpdate, description: "Post a log about any expression update" }
        case LoggingConfigType.MemberRole: return { label: "Member Role", value: LoggingConfigType.MemberRole, description: "Post a log when a member's role(s) are updated" }
        case LoggingConfigType.MemberName: return { label: "Member Name", value: LoggingConfigType.MemberName, description: "Post a log when a member's name is updated" }
        case LoggingConfigType.MemberAvatar: return { label: "Member Avatar", value: LoggingConfigType.MemberAvatar, description: "Post a log when a member's avatar is updated" }
        case LoggingConfigType.MemberBan: return { label: "Member Banned", value: LoggingConfigType.MemberBan, description: "Post a log when a member gets banned from the guild" }
        case LoggingConfigType.MemberUnban: return { label: "Member Unbanned", value: LoggingConfigType.MemberUnban, description: "Post a log when a member gets unbanned from the guild" }
        case LoggingConfigType.MemberTimeout: return { label: "Member Timeout", value: LoggingConfigType.MemberTimeout, description: "Post a log when a member gets timed out from the guild" }
        case LoggingConfigType.MemberUntimeout: return { label: "Member Untimeout", value: LoggingConfigType.MemberUntimeout, description: "Post a log when a member gets untimed out from the guild" }
        case LoggingConfigType.VoiceJoin: return { label: "Voice Join", value: LoggingConfigType.VoiceJoin, description: "Post a log when a member joins a voice channel" }
        case LoggingConfigType.VoiceSwitch: return { label: "Voice Switch", value: LoggingConfigType.VoiceSwitch, description: "Post a log when a member switches voice channel" }
        case LoggingConfigType.VoiceLeave: return { label: "Voice Leave", value: LoggingConfigType.VoiceLeave, description: "Post a log when a member leaves a voice channel" }
        case LoggingConfigType.SelfCommands: return { label: "Self App Commands", value: LoggingConfigType.SelfCommands, description: "Post a log when someone uses my commands" }
        case LoggingConfigType.SelfCommandError: return { label: "Self App Commands Error", value: LoggingConfigType.SelfCommandError, description: "Self App Commands will also show failed/error'd commands" }
    }
}