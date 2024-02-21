import { CreationOptional, DataTypes, Model, Sequelize } from "sequelize";

/**
 * This is the new MLogging model, which is a replacement for the old MLoggingChannels and MLoggingConfig models.
 * To be fair, those looked like SHIT and this one I can update on the fly :3
 * @author Kyomi
 */
export class MLogging extends Model implements MLoggingAttributes {

    declare guildId: string;
    declare channels: Map<string, MLoggingChannelAttributes>;
    declare config: Map<MLoggingConfigKeys, boolean>;

    private declare jsonChannels: string;
    private declare jsonConfig: string;

    public static async initialize(sequelize: Sequelize): Promise<typeof MLogging> {
        return this.init({
            guildId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            jsonChannels: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {}   
            },
            jsonConfig: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {}
            }
        }, {
            sequelize: sequelize,
            modelName: "logging",
            timestamps: false,
            hooks: {
                afterCreate: async (instance: MLogging) => {
                    instance.channels = new Map();
                    instance.config = MLoggingConfigKeys.defaults();

                    instance.jsonChannels = JSON.stringify(Array.from(instance.channels.entries()));
                    instance.jsonConfig = JSON.stringify(Array.from(instance.config.entries()));

                    await instance.save();
                },
                afterFind: (instance: MLogging) => {
                    if(instance == null) return;
                    // Pull the data from the database and parse it into the correct format
                    // In this case, the JSON is a Map<string, string> and we need to convert it to a Map<string, MLoggingChannelAttributes>
                    
                    // Firstly, default as a new Map. If there is any result in jsonChannels or not, we still need it blank
                    instance.channels = new Map();
                    if (instance.jsonChannels) {
                        const tempMap: Map<string, string> = new Map(JSON.parse(instance.jsonChannels));

                        // For each entry in the tempMap
                        // Set the key as the channel ID
                        // Parse the value into a Map<string, boolean> (or Map<MLoggingSettingsKeys, boolean> in this case) and set it as the value
                        //   We are allowed to convert a Map<string, boolean> to a Map<MLoggingSettingsKeys, boolean> because the keys are strings,
                        //     allowing us to use the MLoggingSettingsKeys enum
                        tempMap.forEach((value, key) => {
                            instance.channels.set(key, { settings: new Map(JSON.parse(value)) });
                        });
                    } 

                    if(instance.jsonConfig) {
                        // Parse the config into a Map<MLoggingConfigKeys, boolean>
                        instance.config = new Map(JSON.parse(instance.jsonConfig));
                    } else {
                        // If jsonConfig is null, use the defaults
                        instance.config = MLoggingConfigKeys.defaults();
                    }
                },
                beforeSave: (instance: MLogging) => { // Just to make sure the data is up to date with the database
                    if (instance.channels) {
                        // Create a temporary map to store the channels and their stringified settings
                        const tempMap = new Map<string, string>();

                        // For each channel in the instance's channels
                        // Set the key as the channel ID
                        // Stringify the settings and set it as the value
                        instance.channels.forEach((value, key) => {
                            tempMap.set(key, JSON.stringify(Array.from(value.settings.entries())));
                        });

                        // Set the jsonChannels to the stringified tempMap
                        instance.jsonChannels = JSON.stringify(Array.from(tempMap.entries()));
                    }

                    if (instance.config) {
                        instance.jsonConfig = JSON.stringify(Array.from(instance.config.entries()));
                    }
                }
            }
        })
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
    channels?: Map<string, MLoggingChannelAttributes>;
    config?: Map<MLoggingConfigKeys, boolean>;
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

export namespace MLoggingSettingsKeys {
    export function all(): Array<MLoggingSettingsKeys> {
        return Array.from(MLoggingChannelAttributes.defaults().keys());
    }
}

/**
 * Each channel can have its own settings, which is why we need to store them in a separate object.
 * This determines what events are logged in each channel.
 * @field settings whether or not the channel logs certain events
 */
export interface MLoggingChannelAttributes {
    settings: Map<MLoggingSettingsKeys, boolean>;
}

export namespace MLoggingChannelAttributes {
    export function defaults(): Map<MLoggingSettingsKeys, boolean> {
        return new Map([
            [MLoggingSettingsKeys.MessageEvents, false],
            [MLoggingSettingsKeys.GuildDoorEvents, false],
            [MLoggingSettingsKeys.GuildEvents, false],
            [MLoggingSettingsKeys.MemberEvents, false],
            [MLoggingSettingsKeys.VoiceEvents, false],
            [MLoggingSettingsKeys.CommandEvents, false]
        ]);
    }
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

export namespace MLoggingConfigKeys {
    export function defaults(): Map<MLoggingConfigKeys, boolean> {
        return new Map<MLoggingConfigKeys, boolean>([
            [MLoggingConfigKeys.MessageDeleted, false],
            [MLoggingConfigKeys.MessageEdited, false],
            [MLoggingConfigKeys.MessagePurged, false],

            [MLoggingConfigKeys.MemberJoined, false],
            [MLoggingConfigKeys.MemberLeft, false],

            [MLoggingConfigKeys.ChannelCreated, false],
            [MLoggingConfigKeys.ChannelModified, false],
            [MLoggingConfigKeys.ChannelDeleted, false],

            [MLoggingConfigKeys.RoleCreated, false],
            [MLoggingConfigKeys.RoleModified, false],
            [MLoggingConfigKeys.RoleDeleted, false],

            [MLoggingConfigKeys.GuildUpdated, false],

            [MLoggingConfigKeys.EmojiCreated, false],
            [MLoggingConfigKeys.EmojiModified, false],
            [MLoggingConfigKeys.EmojiDeleted, false],

            [MLoggingConfigKeys.MemberNickname, false],

            [MLoggingConfigKeys.MemberRoles, false],
            [MLoggingConfigKeys.MemberBanned, false],
            [MLoggingConfigKeys.MemberUnbanned, false],
            [MLoggingConfigKeys.MemberTimedout, false],
            [MLoggingConfigKeys.MemberUntimedout, false],

            [MLoggingConfigKeys.VoiceChannelJoined, false],
            [MLoggingConfigKeys.VoiceChannelSwitched, false],
            [MLoggingConfigKeys.VoiceChannelLeft, false],

            [MLoggingConfigKeys.CommandExecuted, false]
        ])
    }

    export function all(): Array<MLoggingConfigKeys> { return Array.from(defaults().keys()); }
}
//#endregion