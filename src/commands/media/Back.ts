import { VoiceConnectionReadyState, VoiceConnectionStatus, getVoiceConnection } from "@discordjs/voice";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { MediaManager } from "../../structure/classes/MediaManager";

export default new KyCommand({
    name: "back",
    description: "Goes back a song, doing the opposite of skip",
    
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
        
        let index = await MediaManager.fetchQueueIndex(interaction.guild);
        if(index == 0) return await interaction.editReply({ content: "Cannot go any further back! "});

        await MediaManager.setQueueIndex(interaction.guild, (await MediaManager.fetchQueueIndex(interaction.guild)) - 2);
        
        state.subscription.player.stop();
        return await interaction.editReply({ content: "Stopping playback and playing previous song! "});
    }
})