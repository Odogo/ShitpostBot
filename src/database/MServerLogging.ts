import { DataTypes, Model } from "sequelize";
import { sequelInstance } from "..";

export class MServerLogging extends Model {

    // Identifier
    declare guildId: string;

    // All logging types are strings, if they are filled
    // they should be a channel Id, otherwise do not log.
    
    // Message Events (Edit, Delete, Purge)
    declare logMessages: string | undefined;
    
    // Server Enterance / Leaving
    declare logServerDoor: string | undefined;

    // Server Events (Channel & Role changes, server updates, emoji changes)
    declare logServer: string | undefined;

    // Member Events (Role, Name, Avatar updates; Member bans, timeouts, unban, untimeout)
    declare logMembers: string | undefined;

    // Voice Events (Join, Move, Leave)
    declare logVoice: string | undefined;

    // Shitpost Commands
    // - additional config setting for failed commands, if false only posts successful.
    declare logCommands: string | undefined;

    public static async initialize() {
        return MServerLogging.init({

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

            logServerDoor: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logServer: {
                type: DataTypes.STRING,
                allowNull: true
            },

            logMembers: {
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
            tableName: "serverLogging",
            timestamps: false
        });
    }
}