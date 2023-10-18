/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { APISelectMenuOption, BaseGuildTextChannel, Collection, Guild, GuildTextBasedChannel, NonThreadGuildBasedChannel, SelectMenuComponentOptionData, StringSelectMenuOptionBuilder, TextBasedChannel, TextChannel } from "discord.js";
import { MLoggingChannels } from "../database/logging/MLoggingChannels";
import { MLoggingConfig } from "../database/logging/MLoggingConfig";
import { logDebug, logError, logWarn } from "../system";

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

export namespace LoggingConfigCategory {
    export function values(): LoggingConfigCategory[] {
        return [LoggingConfigCategory.ApplicationEvents, LoggingConfigCategory.GuildEvents, LoggingConfigCategory.GuildMembersEvents,
             LoggingConfigCategory.GuildMemberEvents, LoggingConfigCategory.MessageEvents, LoggingConfigCategory.VoiceEvents];
    }
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


// Database Time (kill me)

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
            if(data.logMessages) categories.push(LoggingConfigCategory.MessageEvents);
            if(data.logGuildMembers) categories.push(LoggingConfigCategory.GuildMembersEvents);
            if(data.logGuild) categories.push(LoggingConfigCategory.GuildEvents);
            if(data.logGuildMember) categories.push(LoggingConfigCategory.GuildMemberEvents);
            if(data.logVoice) categories.push(LoggingConfigCategory.VoiceEvents);
            if(data.logCommands) categories.push(LoggingConfigCategory.ApplicationEvents);
            
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
                    if(channel == undefined || !(channel instanceof TextChannel)) continue;

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