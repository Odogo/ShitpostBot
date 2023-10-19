import { LoggingConfigType } from "./LoggingConfigType";

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

    export function getTypes(category: LoggingConfigCategory): Array<LoggingConfigType> {
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
        }
    }
}