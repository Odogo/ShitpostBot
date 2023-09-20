import { MediaManager } from "../../structure/classes/MediaManager";
import { KyCommand } from "../../structure/classes/discord/KyCommand";

export default new KyCommand({
    name: "playing",
    description: "Replies with a fancy embed showing what is currently playing",

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        let songs = await MediaManager.fetchSongQueue(interaction.guild);
        let index = await MediaManager.fetchQueueIndex(interaction.guild);

        let embed = await MediaManager.generateSongEmbed(interaction.guild, songs[index], 'nowPlaying');
        return await interaction.editReply({ embeds: [embed] });
    }
})