import { APISelectMenuOption } from "discord.js"

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

export namespace LoggingConfigType {
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

    export function values(): LoggingConfigType[] {
        return [
            LoggingConfigType.MessageDelete,
            LoggingConfigType.MessageEdited,
            LoggingConfigType.MessagePurged,
            LoggingConfigType.MemberJoin,
            LoggingConfigType.MemberLeave,
            LoggingConfigType.ChannelAdd,
            LoggingConfigType.ChannelModify,
            LoggingConfigType.ChannelRemove,
            LoggingConfigType.RoleAdd,
            LoggingConfigType.RoleModify,
            LoggingConfigType.RoleRemove,
            LoggingConfigType.GuildUpdate, 
            LoggingConfigType.EmojiUpdate, 
            LoggingConfigType.MemberRole,
            LoggingConfigType.MemberBan,
            LoggingConfigType.MemberUnban, 
            LoggingConfigType.MemberTimeout,
            LoggingConfigType.MemberUntimeout,
            LoggingConfigType.VoiceJoin,
            LoggingConfigType.VoiceSwitch, 
            LoggingConfigType.VoiceLeave,
            LoggingConfigType.SelfCommands,
            LoggingConfigType.SelfCommandError,
        ]
    }
}