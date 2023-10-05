/* Module: Logging
 * This module handles the interaction between the end user and the database.
 */

import { Channel, Guild } from "discord.js";
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
                case LoggingType.MessageEvents: resolve(data.logMessages === null || data.logMessages.trim() === "");
                case LoggingType.ServerDoorEvents: resolve(data.logServerDoor === null || data.logServerDoor.trim() === "");
                case LoggingType.ServerEvents: resolve(data.logServer === null || data.logServer.trim() === "");
                case LoggingType.MemberEvents: resolve(data.logMembers === null || data.logMembers.trim() === "");
                case LoggingType.VoiceEvents: resolve(data.logVoice === null || data.logVoice.trim() === "");
                case LoggingType.CommandEvents: resolve(data.logCommands === null || data.logCommands.trim() === "");
                default: reject("LoggingType is invalid."); 
            }
        }).catch(reject);
    });
}

export function fetchLoggingChannel(guild: Guild, type: LoggingType): Promise<Channel | null> {
    return new Promise(async (resolve, reject) => {
        await MServerLogging.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(!data) {
                data = await MServerLogging.create({ guildId: guild.id });
            }

            let channelId = "";
            switch(type) {
                case LoggingType.MessageEvents: channelId = data.logMessages; break;
                case LoggingType.ServerDoorEvents: channelId = data.logServerDoor; break;
                case LoggingType.ServerEvents: channelId = data.logServer; break;
                case LoggingType.MemberEvents: channelId = data.logMembers; break;
                case LoggingType.VoiceEvents: channelId = data.logVoice; break;
                case LoggingType.CommandEvents: channelId = data.logCommands; break;
                default: reject("LoggingType is invalid."); 
            }

            if(channelId) {
                await guild.channels.fetch(channelId)
                    .then(resolve)
                    .catch(async (reason) => { reject(reason); });
            } else {
                resolve(null);
            }
        }).catch(reject);
    });
}

export function setLoggingChannel(guild: Guild, type: LoggingType, channel: Channel | undefined | null): Promise<void> {
    return new Promise(async (resolve, reject) => {
        await MServerLogging.findOne({ where: { guildId: guild.id }}).then(async (data) => {
            if(!data) data = await MServerLogging.create({ guildId: guild.id });

            switch(type) {
                case LoggingType.MessageEvents: data.logMessages = channel.id; break;
                case LoggingType.ServerDoorEvents: data.logServerDoor = channel.id; break;
                case LoggingType.ServerEvents: data.logServer = channel.id; break;
                case LoggingType.MemberEvents: data.logMembers = channel.id; break;
                case LoggingType.VoiceEvents: data.logVoice = channel.id; break; 
                case LoggingType.CommandEvents: data.logCommands = channel.id; break;
            }

            await MServerLogging.update(data, { where: { guildId: guild.id }});
            resolve();
        }).catch(reject);
    });
}