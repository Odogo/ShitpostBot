import { CreationOptional, DataTypes, Model, Sequelize } from "sequelize";

/**
 * This is the new MLogging model, which is a replacement for the old MLoggingChannels and MLoggingConfig models.
 * To be fair, those looked like SHIT and this one I can update on the fly :3
 * @author Kyomi
 */
export class MLogging extends Model<MLoggingAttributes> implements MLoggingAttributes {

    // This is the only piece of data we need now
    declare guildId: string;

    declare channels: CreationOptional<Record<string, MLoggingChannelAttributes>>;
    declare config: CreationOptional<Record<MLoggingConfigKeys, boolean>>;

    public static async initialize(sequelize: Sequelize): Promise<typeof MLogging> {
        return this.init({
            guildId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            channels: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {}
            },
            config: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: { // set all to false by default
                    [MLoggingConfigKeys.MessageDeleted]: false,
                    [MLoggingConfigKeys.MessageEdited]: false,
                    [MLoggingConfigKeys.MessagePurged]: false,
                    [MLoggingConfigKeys.MemberJoined]: false,
                    [MLoggingConfigKeys.MemberLeft]: false,
                    [MLoggingConfigKeys.ChannelCreated]: false,
                    [MLoggingConfigKeys.ChannelModified]: false,
                    [MLoggingConfigKeys.ChannelDeleted]: false,
                    [MLoggingConfigKeys.RoleCreated]: false,
                    [MLoggingConfigKeys.RoleModified]: false,
                    [MLoggingConfigKeys.RoleDeleted]: false,
                    [MLoggingConfigKeys.GuildUpdated]: false,
                    [MLoggingConfigKeys.EmojiCreated]: false,
                    [MLoggingConfigKeys.EmojiModified]: false,
                    [MLoggingConfigKeys.EmojiDeleted]: false,
                    [MLoggingConfigKeys.MemberNickname]: false,
                    [MLoggingConfigKeys.MemberRoles]: false,
                    [MLoggingConfigKeys.MemberBanned]: false,
                    [MLoggingConfigKeys.MemberUnbanned]: false,
                    [MLoggingConfigKeys.MemberTimedout]: false,
                    [MLoggingConfigKeys.MemberUntimedout]: false,
                    [MLoggingConfigKeys.VoiceChannelJoined]: false,
                    [MLoggingConfigKeys.VoiceChannelSwitched]: false,
                    [MLoggingConfigKeys.VoiceChannelLeft]: false,
                    [MLoggingConfigKeys.CommandExecuted]: false
                }
            }
        }, {
            sequelize: sequelize,
            modelName: "logging",
            timestamps: false
        });
    }
}

/**
 * This exists merely to provide a type for the MLogging model.
 * @field guildId the guild's ID
 * @field channels the channel ids and its settings
 * @field config the logging categories and their active status
 */
interface MLoggingAttributes {
    guildId: string;
    channels?: Record<string, MLoggingChannelAttributes>;
    config?: Record<MLoggingConfigKeys, boolean>;
}

//#region Replacement for MLoggingChannels.ts from v4.0
/**
 * The keys for {@link MLoggingChannelAttributes.settings}
 * This enum is also similar to the previous version of LoggingConfigCategory
 */
export enum MLoggingSettingsKeys {
    MessageEvents = "messageEvents",
    GuildDoorEvents = "guildDoorEvents",
    GuildEvents = "guildEvents",
    MemberEvents = "memberEvents",
    VoiceEvents = "voiceEvents",
    CommandEvents = "commandEvents",
}

/**
 * Each channel can have its own settings, which is why we need to store them in a separate object.
 * This determines what events are logged in each channel.
 * @field settings whether or not the channel logs certain events
 */
export interface MLoggingChannelAttributes {
    settings: Record<MLoggingSettingsKeys, boolean>;
}

export namespace MLoggingChannelAttributes {
    export const DEFAULT: MLoggingChannelAttributes["settings"] = {
        [MLoggingSettingsKeys.MessageEvents]: false,
        [MLoggingSettingsKeys.GuildDoorEvents]: false,
        [MLoggingSettingsKeys.GuildEvents]: false,  
        [MLoggingSettingsKeys.MemberEvents]: false,
        [MLoggingSettingsKeys.VoiceEvents]: false,
        [MLoggingSettingsKeys.CommandEvents]: false
    };
}
//#endregion

//#region Replacement for MLoggingConfig.ts from v4.0
/**
 * The keys for {@link MLoggingAttributes.config}
 * This enum is also similar to the previous version of LoggingConfigType
 */
export enum MLoggingConfigKeys {
    // Message events
    MessageDeleted = "messageDeleted",
    MessageEdited = "messageEdited",
    MessagePurged = "messagePurged",

    // Guild Door events
    MemberJoined = "memberJoined",
    MemberLeft = "memberLeft",

    // Guild Events
    ChannelCreated = "channelCreated",
    ChannelModified = "channelModified",
    ChannelDeleted = "channelDeleted",

    RoleCreated = "roleCreated",
    RoleModified = "roleModified",
    RoleDeleted = "roleDeleted",
    
    GuildUpdated = "guildUpdated",
    
    // - Expressions (emojis, stickers, etc.)
    EmojiCreated = "emojiCreated",
    EmojiModified = "emojiModified",
    EmojiDeleted = "emojiDeleted",

    // stickers / soundboards?

    // Guild Member events
    MemberNickname = "memberNickname",

    MemberRoles = "memberRoles",
    MemberBanned = "memberBanned",
    MemberUnbanned = "memberUnbanned",
    MemberTimedout = "memberTimedout",
    MemberUntimedout = "memberUntimedout",

    // Voice Channels
    VoiceChannelJoined = "voiceChannelJoined",
    VoiceChannelSwitched = "voiceChannelSwitched",
    VoiceChannelLeft = "voiceChannelLeft",

    // Shitpost events
    CommandExecuted = "commandExecuted",
}
//#endregion