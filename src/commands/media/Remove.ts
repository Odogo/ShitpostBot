import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { getVoiceConnection } from "@discordjs/voice";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "remove",
    description: "Removes a song from the queue by its position",

    options: [
        {
            name: 'position',
            description: "The position of the song in the queue to remove",
            type: ApplicationCommandOptionType.Integer,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        const position = options.getInteger('position', true);
        if (position < 1) return interaction.reply({ content: "The position must be greater than 0!", ephemeral: true });
        if (position > (await Media.fetchGuildQueueItems(guild)).length) return interaction.reply({ content: "The position is greater than the number of songs in the queue!", ephemeral: true });

        await Media.removePositionQueueItem(guild, position).then(async (result) => {
            if (result === undefined) return interaction.reply({ content: "There is no song at that position.", ephemeral: true });
            const details = await result.getSongDetails();

            const embed = await Media.generateSongEmbed(client, result, "NowPlaying");
            embed.setColor(0xff94a4).setTitle("Song Removed from Queue");

            embed.setDescription("The song below was removed from the queue at position #" + position + ":\n" +
                `**[${details.title}](${details.url})** by **${details.artist}**.\n` +
                `**Requested by:** **<@${result.requestorId}>**`);

            await interaction.reply({ embeds: [embed] });
        }).catch(async (error) => {
            await interaction.reply({ content: "An error occurred while removing the song from the queue! (" + error + ")", ephemeral: true });
        });
    }
})