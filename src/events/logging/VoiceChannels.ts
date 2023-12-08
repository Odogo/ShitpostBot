import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { client } from "../..";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigType } from "../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/logging/LoggingConfigCategory";

export default new KEvent(Events.VoiceStateUpdate, async (oldState, newState) => {
    const { guild, member } = oldState;
    const clientUser = client.user;

    if(clientUser === null || member == null) return;

    const prevChannel = oldState.channel, newChannel = newState.channel;

    let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.VoiceEvents);
    if(loggingChannels.length <= 0) return;

    const embed = new EmbedBuilder({
        author: {
            name: (member.nickname !== null ? member.nickname : member.displayName),
            iconURL: member.avatarURL({ extension: 'png', size: 2048 }) || member.displayAvatarURL({ extension: 'png', size: 2048 })
        },
        timestamp: Date.now(),
        footer: {
            text: clientUser.displayName,
            iconURL: clientUser.avatarURL({ extension: 'png', size: 1024}) || undefined
        }
    });

    if(newChannel === null) { // Left a voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceLeave);
        if(!isTypeLogged) return;

        embed.setColor(EmbedColors.remove)
            .setDescription("<@" + member.id + "> left the channel <#" + prevChannel?.id + ">")
    } else if(prevChannel === null) { // Joined a voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceJoin);
        if(!isTypeLogged) return;

        embed.setColor(EmbedColors.add)
            .setDescription("<@" + member.id + "> joined the channel <#" + newChannel?.id + ">")
    } else { // Switched to a different voice channel
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.VoiceSwitch);
        if(!isTypeLogged) return;

        embed.setColor(EmbedColors.change)
            .setDescription("<@" + member.id + "> switched from <#" + prevChannel.id + "> to <#" + newChannel.id + ">")
    }

    for(let i=0; i<loggingChannels.length; i++) 
        await loggingChannels[i].send({ embeds: [embed] });
});