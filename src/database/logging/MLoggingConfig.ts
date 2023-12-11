import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";

export class MLoggingConfig extends Model<InferAttributes<MLoggingConfig>, InferCreationAttributes<MLoggingConfig>> {

    // Identifiers
    declare guildId: string; // Primary Key

    // Message Events
    declare msgDelete: CreationOptional<boolean>;
    declare msgEdited: CreationOptional<boolean>;
    declare msgPurged: CreationOptional<boolean>;

    // Guild Members Events
    declare memberJoin: CreationOptional<boolean>;
    declare memberLeave: CreationOptional<boolean>;

    // Guild Events
    declare channelAdd: CreationOptional<boolean>;
    declare channelModify: CreationOptional<boolean>;
    declare channelRemove: CreationOptional<boolean>;
    
    declare roleAdd: CreationOptional<boolean>;
    declare roleModify: CreationOptional<boolean>;
    declare roleRemove: CreationOptional<boolean>;
    
    declare guildUpdate: CreationOptional<boolean>;
    declare emojiUpdate: CreationOptional<boolean>;

    // Guild Member Events
    declare memberName: CreationOptional<boolean>;

    declare memberRole: CreationOptional<boolean>;
    declare memberBan: CreationOptional<boolean>;
    declare memberUnban: CreationOptional<boolean>;
    declare memberTimeout: CreationOptional<boolean>;
    declare memberUntimeout: CreationOptional<boolean>;

    // Voice Events
    declare voiceJoin: CreationOptional<boolean>;
    declare voiceSwitch: CreationOptional<boolean>;
    declare voiceLeave: CreationOptional<boolean>;

    // Application Events
    declare selfCommands: CreationOptional<boolean>;
    declare selfCommandError: CreationOptional<boolean>;

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

            msgPurged: {
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
            memberName: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            memberRole: {
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