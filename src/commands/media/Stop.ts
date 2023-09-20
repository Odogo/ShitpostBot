import { VoiceConnectionReadyState, VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { MediaManager } from "../../structure/classes/MediaManager";

export default new KyCommand({
    name: "stop",
    description: "Stops the bot, but maintains it's connection. [Effectively a queue clear]",
    options: [],
    
    run: async (client, interaction, options) => {
        await interaction.deferReply();

        const connection = getVoiceConnection(interaction.guild.id);
        if(connection === undefined)
            return await interaction.editReply({ content: "There is no active voice connection!" });

        let state = connection.state;
        if(state.status !== VoiceConnectionStatus.Ready)
            return await interaction.editReply({ content: "The voice connection is still trying to connect, try again in a moment!" });
        state = state as VoiceConnectionReadyState;
    
        let currentChannelId = connection.joinConfig.channelId;
    
        let voiceState = interaction.member.voice;
        if(voiceState.channel == null)
            return await interaction.editReply({ content: "You are not in a voice channel in this guild!" });
    
        if(voiceState.channel.id !== currentChannelId)
            return await interaction.editReply({ content: "You are not in the same voice channel as I am!" });
        
        await MediaManager.setPlaying(interaction.guild, false);
        await MediaManager.setQueueIndex(interaction.guild, -1);
        await MediaManager.setSongQueue(interaction.guild, []);

        await MediaManager.setTextChannelId(interaction.guild, undefined);
        await MediaManager.setVoiceChannelId(interaction.guild, undefined);

        state.subscription.player.stop();

        setTimeout(async () => {
            await MediaManager.createConnection(interaction.guild, voiceState.channel);
            return await interaction.editReply({ content: "Stopped the playback and refreshed the queue!" });
        }, 1000);
    }
})