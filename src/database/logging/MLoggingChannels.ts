import { DataTypes, Model } from "sequelize";
import { sequelInstance } from "../..";

export class MLoggingChannels extends Model {

    // Identifier
    declare guildId: string;

    // All logging types are strings, if they are filled
    // they should be a channel Id, otherwise do not log.
    
    // Message Events (Edit, Delete, Purge)
    declare logMessages: string | undefined;
    
    // Server Enterance / Leaving
    declare logGuildMembers: string | undefined;

    // Server Events (Channel & Role changes, server updates, emoji changes)
    declare logGuild: string | undefined;

    // Member Events (Role, Name, Avatar updates; Member bans, timeouts, unban, untimeout)
    declare logGuildMember: string | undefined;

    // Voice Events (Join, Move, Leave)
    declare logVoice: string | undefined;

    // Shitpost Commands
    // - additional config setting for failed commands, if false only posts successful.
    declare logCommands: string | undefined;

    public static async initialize() {
        return MLoggingChannels.init({

            guildId: {
                type: DataTypes.STRING,
                unique: true,
                primaryKey: true,
                allowNull: false
            },

            logMessages: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logGuildMembers: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logGuild: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logGuildMember: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logVoice: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logCommands: {
                type: DataTypes.STRING,
                allowNull: true
            }
        }, {
            sequelize: sequelInstance,
            tableName: "loggingChannels",
            timestamps: false
        });
    }
}