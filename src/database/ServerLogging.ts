import { Model } from "sequelize";

export class ServerLogging extends Model {

    declare guildId: string;

    // All logging types are strings, if they are filled
    // they should be a channel Id, otherwise do not log.
    
    // Message Events (Edit, Delete, Purge)
    declare logMessages: string;
    
    // Server Enterance / Leaving
    declare logServerDoor: string;

    // Server Events (Channel & Role changes, server updates, emoji changes)
    declare logServer: string;

    // Member Events (Role, Name, Avatar updates; Member bans, timeouts, unban, untimeout)
    declare logMembers: string;

    // Voice Events (Join, Move, Leave)
    declare logVoice: string;

}