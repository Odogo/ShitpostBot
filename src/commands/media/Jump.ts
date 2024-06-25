import { ApplicationCommandOptionType } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { getVoiceConnection } from "@discordjs/voice";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "jump",
    description: "Jumps to a song in the queue",

    options: [
        {
            name: 'index',
            description: "The index of the song to jump to",
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

        const index = options.getInteger('index', true);
        const songItems = await Media.fetchGuildQueueItems(guild);

        if (index < 1) return interaction.reply({ content: "The index must be a positive number!", ephemeral: true });
        if (index >= songItems.length) return interaction.reply({ content: "The index to jump to must be less than the number of songs in the queue!", ephemeral: true });

        await Media.updateGPlayingIndex(guild, index - 2).then(async (result) => {
            if (result === null) return interaction.reply({ content: "The media player could not be found", ephemeral: true });
            const song = songItems[index - 1];
            const details = await song.getSongDetails();

            const embed = await Media.generateSongEmbed(client, song, "NowPlaying");
            embed.setColor(0xffeb94).setTitle("Jumped to Song");

            embed.setDescription("I've jumped to the song at index #" + index + " in the queue!\n" +
                `**[${details.title}](${details.url})** by **${details.artist}**.\n` +
                `**Requested by:** **<@${song.requestorId}>**`);
            
            await Media.skipMediaPlayer(guild);
            await interaction.reply({ embeds: [embed] });
        }).catch(async (error) => {
            await interaction.reply({ content: "An error occurred while jumping to the song at index " + index + "! (" + error + ")", ephemeral: true });
        });
    }
})