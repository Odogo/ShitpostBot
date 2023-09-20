import { ApplicationCommandOptionType, VoiceState } from "discord.js";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { getVoiceConnection } from "@discordjs/voice";
import { MediaManager } from "../../structure/classes/MediaManager";

export default new KyCommand({
    name: "remove",
    description: "Removes a specific song from the queue using it's index",
    options: [
        {
            name: "index",
            description: "The song's index number to remove from the queue",
            type: ApplicationCommandOptionType.Integer
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        const connection = getVoiceConnection(interaction.guild.id);
        if(connection === undefined)
            return await interaction.editReply({ content: "There is no active voice connection!" });

        let currentChannelId = connection.joinConfig.channelId;

        let state = interaction.member.voice;
        if(!state.channel)
            return await interaction.editReply({ content: "You are not in a voice channel in this guild!" });
        if(state.channel.id !== currentChannelId)
            return await interaction.editReply({ content: "You are not in the same voice channel as I am!" });

        let songs = await MediaManager.fetchSongQueue(interaction.guild);
        if(songs == undefined) return await interaction.editReply({ content: "Could not find queue data. Try making one with `/play`!" });

        let rIndex = options.getInteger('index') - 1;
        if(rIndex < 0 || rIndex > songs.length)
            return await interaction.editReply({ content: "The index is out of bounds, must be between 1 and " + songs.length });

        let removed = await MediaManager.removeIndexSong(interaction.guild, rIndex);
        
        let embed = await MediaManager.generateSongEmbed(interaction.guild, removed, 'nowPlaying');
        embed.setColor(0xff8080).setFooter({ text: "Song Removed" }).setTimestamp(Date.now()).setFields([embed.data.fields[0]]);

        return await interaction.editReply({ content: "The following song from position " + (rIndex + 1) + " was removed!", embeds: [embed] });
    }
})