/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { Guild } from "discord.js";
import { MServerLogging } from "../database/MServerLogging";

export enum LoggingType { 
    MessageEvents = "message",
    ServerDoorEvents = "serverDoor",
    ServerEvents = "server",
    MemberEvents = "member",
    VoiceEvents = "voice",
    CommandEvents = "command"
}

export function isLoggingEnabled(guild: Guild, type: LoggingType): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
        await MServerLogging.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(!data) {
                data = await MServerLogging.create({ guildId: guild.id });
            }
            
            switch(type) {
                case LoggingType.MessageEvents: resolve((data.logMessages === null || data.logMessages.trim() === ""));
                case LoggingType.ServerDoorEvents:
                case LoggingType.ServerEvents:
                case LoggingType.MemberEvents:
                case LoggingType.VoiceEvents:
                case LoggingType.CommandEvents:
            }
        });
    });
}