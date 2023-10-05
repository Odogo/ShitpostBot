import { DataTypes, Model } from "sequelize";
import { sequelInstance } from "..";

export class MLoggingConfig extends Model {

    declare guildId: string;

    // Message Events
    declare msgDelete: boolean;
    declare msgEdited: boolean;
    declare msgPurged: boolean;

    // Guild Members Events
    declare memberJoin: boolean;
    declare memberLeave: boolean;

    // Guild Events
    declare channelAdd: boolean;
    declare channelModify: boolean;
    declare channelRemove: boolean;
    
    declare roleAdd: boolean;
    declare roleModify: boolean;
    declare roleRemove: boolean;
    
    declare guildUpdate: boolean;
    declare emojiUpdate: boolean;

    // Guild Member Events
    declare memberRole: boolean;
    declare memberName: boolean;
    declare memberAvatar: boolean;

    declare memberBan: boolean;
    declare memberUnban: boolean;
    declare memberTimeout: boolean;
    declare memberUntimeout: boolean;

    // Voice Events
    declare voiceJoin: boolean;
    declare voiceSwitch: boolean;
    declare voiceLeave: boolean;

    // Application Events
    declare selfCommands: boolean;
    declare selfCommandError: boolean;

    public static async initialize() {
        return MLoggingConfig.init({

            guildId: {
                type: DataTypes.STRING,
                unique: true,
                primaryKey: true,
                allowNull: false
            },

            // Message Events
            msgDelete: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            msgEdited: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            msgPurge: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            // Guild Members Events
            memberJoin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberLeave: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            // Guild Events
            channelAdd: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            channelModify: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            channelRemove: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            roleAdd: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            roleModify: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            roleRemove: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            guildUpdate: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            emojiUpdate: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            // Guild Member Events
            memberRole: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberName: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberAvatar: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberBan: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            
            memberUnban: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberTimeout: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberUntimeout: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            // Voice Events
            voiceJoin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            voiceSwitch: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            voiceLeave: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            // Application Events
            selfCommands: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            selfCommandError: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        }, {
            sequelize: sequelInstance,
            tableName: "loggingConfig",
            timestamps: false
        });
    }
}