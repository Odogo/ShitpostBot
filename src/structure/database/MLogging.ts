import { CreationOptional, DataTypes, Model, Sequelize } from "sequelize";

/**
 * This is the new MLogging model, which is a replacement for the old MLoggingChannels and MLoggingConfig models.
 * To be fair, those looked like SHIT and this one I can update on the fly :3
 * @author Kyomi
 */
export class MLogging extends Model implements MLoggingAttributes {

    declare guildId: string;

    declare channels: Map<string, MLoggingChannelAttributes>;
    declare types: Map<MLoggingTypeKeys, boolean>;

    declare config: MLoggingConfig;

    private declare jsonChannels: string;
    private declare jsonTypes: string;

    public static async initialize(sequelize: Sequelize): Promise<typeof MLogging> {
        return this.init({
            guildId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            config: {
                type: DataTypes.JSON,
                allowNull: false,
                defaultValue: {}
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
                    instance.types = MLoggingTypeKeys.defaults();

                    instance.config = new MLoggingConfig();

                    instance.jsonChannels = JSON.stringify(Array.from(instance.channels.entries()));
                    instance.jsonTypes = JSON.stringify(Array.from(instance.types.entries()));

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

                    if(instance.jsonTypes) {
                        // Parse the config into a Map<MLoggingConfigKeys, boolean>
                        instance.types = new Map(JSON.parse(instance.jsonTypes));
                    } else {
                        // If jsonConfig is null, use the defaults
                        instance.types = MLoggingTypeKeys.defaults();
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

                    if (instance.types) {
                        instance.jsonTypes = JSON.stringify(Array.from(instance.types.entries()));
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
    types?: Map<MLoggingTypeKeys, boolean>;
    config?: MLoggingConfig;
}

//#region Replacement for MLoggingChannels.ts from v4.0
/**
 * The keys for {@link MLoggingChannelAttributes.settings}
 * This enum is also similar to the previous version of LoggingConfigCategory
 */
export enum MLoggingCategoryKeys {
    MessageEvents = "messageEvents",
    GuildDoorEvents = "guildDoorEvents",
    GuildEvents = "guildEvents",
    MemberEvents = "memberEvents",
    VoiceEvents = "voiceEvents",
    CommandEvents = "commandEvents",
}

export namespace MLoggingCategoryKeys {
    export function all(): Array<MLoggingCategoryKeys> {
        return Array.from(MLoggingChannelAttributes.defaults().keys());
    }
}

/**
 * Each channel can have its own settings, which is why we need to store them in a separate object.
 * This determines what events are logged in each channel.
 * @field settings whether or not the channel logs certain events
 */
export interface MLoggingChannelAttributes {
    settings: Map<MLoggingCategoryKeys, boolean>;
}

export namespace MLoggingChannelAttributes {
    export function defaults(): Map<MLoggingCategoryKeys, boolean> {
        return new Map([
            [MLoggingCategoryKeys.MessageEvents, false],
            [MLoggingCategoryKeys.GuildDoorEvents, false],
            [MLoggingCategoryKeys.GuildEvents, false],
            [MLoggingCategoryKeys.MemberEvents, false],
            [MLoggingCategoryKeys.VoiceEvents, false],
            [MLoggingCategoryKeys.CommandEvents, false]
        ]);
    }
}
//#endregion

//#region Replacement for MLoggingConfig.ts from v4.0
/**
 * The keys for {@link MLoggingAttributes.config}
 * This enum is also similar to the previous version of LoggingConfigType
 */
export enum MLoggingTypeKeys {
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

export namespace MLoggingTypeKeys {
    export function defaults(): Map<MLoggingTypeKeys, boolean> {
        return new Map<MLoggingTypeKeys, boolean>([
            [MLoggingTypeKeys.MessageDeleted, false],
            [MLoggingTypeKeys.MessageEdited, false],
            [MLoggingTypeKeys.MessagePurged, false],

            [MLoggingTypeKeys.MemberJoined, false],
            [MLoggingTypeKeys.MemberLeft, false],

            [MLoggingTypeKeys.ChannelCreated, false],
            [MLoggingTypeKeys.ChannelModified, false],
            [MLoggingTypeKeys.ChannelDeleted, false],

            [MLoggingTypeKeys.RoleCreated, false],
            [MLoggingTypeKeys.RoleModified, false],
            [MLoggingTypeKeys.RoleDeleted, false],

            [MLoggingTypeKeys.GuildUpdated, false],

            [MLoggingTypeKeys.EmojiCreated, false],
            [MLoggingTypeKeys.EmojiModified, false],
            [MLoggingTypeKeys.EmojiDeleted, false],

            [MLoggingTypeKeys.MemberNickname, false],

            [MLoggingTypeKeys.MemberRoles, false],
            [MLoggingTypeKeys.MemberBanned, false],
            [MLoggingTypeKeys.MemberUnbanned, false],
            [MLoggingTypeKeys.MemberTimedout, false],
            [MLoggingTypeKeys.MemberUntimedout, false],

            [MLoggingTypeKeys.VoiceChannelJoined, false],
            [MLoggingTypeKeys.VoiceChannelSwitched, false],
            [MLoggingTypeKeys.VoiceChannelLeft, false],

            [MLoggingTypeKeys.CommandExecuted, false]
        ]);
    }

    export function all(): Array<MLoggingTypeKeys> { return Array.from(defaults().keys()); }
}
//#endregion

//#region Logging Configuration (new to v4.1)
export class MLoggingConfig {
    public showDisabledPermissions: MLoggingConfigEntry;

    constructor() {
        this.showDisabledPermissions = new MLoggingConfigEntry("Shows disabled permissions when 'Administrator' gets disabled", true);
    }
}

class MLoggingConfigEntry {
    private _description;
    private _defaultVal;

    public value;

    constructor(description: string, defaultVal: boolean) {
        this._description = description;
        this._defaultVal = defaultVal;

        this.value = defaultVal;
    }

    public get description() { return this._description; }
    public get defaultValue() { return this._defaultVal; }
}
//#endregion