import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { client } from "../..";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";

export default new KEvent(Events.VoiceStateUpdate, async (oldState, newState) => {
    const { guild } = oldState;
    const clientUser = client.user;
    if(clientUser === null) return;

    const prevChannel = oldState.channel, newChannel = newState.channel;

    let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.VoiceEvents);
    if(loggingChannels.length <= 0) return;

    const embed = new EmbedBuilder({

    });

    if(newChannel === null) { // Left a voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceLeave);
        if(!isTypeLogged) return;
    } else if(prevChannel === null) { // Joined a voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceJoin);
        if(!isTypeLogged) return;
    } else { // Switched to a different voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceSwitch);
        if(!isTypeLogged) return;
    } 
});