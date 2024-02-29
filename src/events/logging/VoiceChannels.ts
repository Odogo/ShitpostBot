import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { ShitLogging } from "../../structure/ShitLogging";
import { logWarn } from "../../system";
import { Logging } from "../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../structure/database/MLogging";

export default new ShitEvent(Events.VoiceStateUpdate, async (oldState, newState) => {
    try {
        console.log("VS Update");

        const { guild, member} = oldState;
        const cUser = client.user;

        if(!cUser || !member) return;

        const prevChannel = oldState.channel, newChannel = newState.channel;

        let channels = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.VoiceEvents);
        console.log(channels);
        if(channels.length <= 0) return;

        const embed = ShitLogging.fetchBaseEmbed(member);

        if(newChannel === null) { // Left a voice channel
            let typeLogged = await Logging.isGuildLoggingType(guild, MLoggingTypeKeys.VoiceChannelLeft);
            if(!typeLogged) return;

            embed.setColor(Logging.EmbedColors.remove)
                .setDescription("<@" + member.id + "> left the voice channel <#" + prevChannel?.id + ">");
        } else if(prevChannel === null) { // Joined a voice channel
            let typeLogged = await Logging.isGuildLoggingType(guild, MLoggingTypeKeys.VoiceChannelJoined);
            if(!typeLogged) return;

            embed.setColor(Logging.EmbedColors.add)
                .setDescription("<@" + member.id + "> joined the voice channel <#" + newChannel?.id + ">");
        } else if(prevChannel !== null && newChannel !== null && prevChannel.id !== newChannel.id) {
            // Switched to a different voice channel
            let typeLogged = await Logging.isGuildLoggingType(guild, MLoggingTypeKeys.VoiceChannelSwitched);
            if(!typeLogged) return;

            embed.setColor(Logging.EmbedColors.change)
                .setDescription("<@" + member.id + "> switched from <#" + prevChannel.id + "> to <#" + newChannel.id + ">")
        } else return;

        for(let i=0; i<channels.length; i++)
            await channels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn("[Logging - VC] Failed to handle voice state update: " + error);
        logWarn(error);
    }
});