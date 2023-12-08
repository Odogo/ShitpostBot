import { DataTypes, Model } from "sequelize";
import { sequelInstance } from "../..";

export class MLoggingChannels extends Model {

    // Identifier
    declare channelId: string; // Primary Key
    declare guildId: string;
    
    // Message Events (Edit, Delete, Purge)
    declare logMessages: boolean;
    
    // Server Enterance / Leaving
    declare logGuildMembers: boolean;

    // Server Events (Channel & Role changes, server updates, emoji changes)
    declare logGuild: boolean;

    // Member Events (Role, Name, Avatar updates; Member bans, timeouts, unban, untimeout)
    declare logGuildMember: boolean;

    // Voice Events (Join, Move, Leave)
    declare logVoice: boolean;

    // Shitpost Commands
    // - additional config setting for failed commands, if false only posts successful.
    declare logCommands: boolean;

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