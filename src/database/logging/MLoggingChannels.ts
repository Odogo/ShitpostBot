import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";

export class MLoggingChannels extends Model<InferAttributes<MLoggingChannels>, InferCreationAttributes<MLoggingChannels>> {

    // Identifier
    declare channelId: string; // Primary Key
    declare guildId: string;
    
    // Message Events (Edit, Delete, Purge)
    declare logMessages: CreationOptional<boolean>;
    
    // Server Enterance / Leaving
    declare logGuildMembers: CreationOptional<boolean>;

    // Server Events (Channel & Role changes, server updates, emoji changes)
    declare logGuild: CreationOptional<boolean>;

    // Member Events (Role, Name, Avatar updates; Member bans, timeouts, unban, untimeout)
    declare logGuildMember: CreationOptional<boolean>;

    // Voice Events (Join, Move, Leave)
    declare logVoice: CreationOptional<boolean>;

    // Shitpost Commands
    // - additional config setting for failed commands, if false only posts successful.
    declare logCommands: CreationOptional<boolean>;

    public static async initialize() {
        return MLoggingChannels.init({

            channelId: {
                type: DataTypes.STRING,
                unique: true,
                primaryKey: true,
                allowNull: false
            },

            guildId: {
                type: DataTypes.STRING,
                unique: false,
                primaryKey: false,
                allowNull: false
            },

            logMessages: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            logGuildMembers: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            logGuild: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            logGuildMember: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            logVoice: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            logCommands: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            sequelize: sequelInstance,
            tableName: "loggingChannels",
            timestamps: false
        });
    }
}