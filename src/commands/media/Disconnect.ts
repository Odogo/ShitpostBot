import { getVoiceConnection } from "@discordjs/voice";
import { KyCommand } from "../../structure/classes/discord/KyCommand";

export default new KyCommand({
    name: "disconnect",
    description: "Alternative to /stop, but also disconnects the bot as well!",

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        const connection = getVoiceConnection(interaction.guild.id);
        if(connection === undefined)
            return await interaction.editReply({ content: "There is no active voice connection! "});

        let currentChannelId = connection.joinConfig.channelId;

        let voiceState = interaction.member.voice;
        if(voiceState.channel == null)
            return await interaction.editReply({ content: "You are not in a voice channel in this guild!" });

        if(voiceState.channel.id !== currentChannelId) 
            return await interaction.editReply({ content: "You are not in the same voice channel as I am!" });

        connection.disconnect();
        return await interaction.editReply({ content: "Successfully disconnected from the voice channel!" });
    }
});