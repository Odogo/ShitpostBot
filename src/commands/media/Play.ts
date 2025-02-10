import { ApplicationCommandOptionType } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media, PlayingQueueStatus } from "../../structure/modules/Media";
import { MediaQueueItem, QueueItemSource, QueueItemType } from "../../structure/database/media/MediaQueueItem";
import { getVoiceConnection } from "@discordjs/voice";
import { logWarn } from "../../system";

export default new ShitCommand({
    name: "play",
    description: "Adds a song to the queue and starts playing if the queue is empty",

    options: [
        {
            name: "song",
            description: "The song to play",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        const song = options.getString("song", true);

        const [source, type] = await MediaQueueItem.verifyURL(song);
        if (source === QueueItemSource.INVALID || type === QueueItemType.INVALID) {
            return interaction.followUp({ content: "The given URL is invalid. Please make sure it is a valid YouTube, Spotify, or Soundclound link.", ephemeral: true });
        }

        if (!interaction.inGuild()) return interaction.followUp({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const executingChannel = interaction.channel;
        if (!executingChannel || executingChannel.isThread()) return interaction.followUp({ content: "This command can only be used inside of a non-thread text-based channel.", ephemeral: true });

        const playing = await Media.isPlaying(guild);
        const connection = getVoiceConnection(guild.id);

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.followUp({ content: "You must be in a voice channel to use this command!", ephemeral: true });

        if (!playing || !connection) {
            try {
                const addResult = await Media.createQueueItem(guild, member.user, song);
                if (addResult === null) return interaction.followUp({ content: "An error occurred while adding the song to the queue. Please try again later.\n*(This commonly means that the video is hidden and not available [or the playlist has videos that meet such condition.])*", ephemeral: true });

                const result = await Media.startPlayingQueue(client, guild, voiceState.channel, executingChannel);
                switch (result) {
                    case PlayingQueueStatus.NoSongsInQueue: return interaction.followUp({ content: "There are no songs in the queue to play! Try adding some with `/play`", ephemeral: true });
                    case PlayingQueueStatus.EndOfQueue: return interaction.followUp({ content: "The queue has ended! Try adding more songs with `/play`", ephemeral: true }); // doubt this will ever be reached
                    case PlayingQueueStatus.Success: return interaction.followUp({ content: "The song has been added to the queue and is now playing!", ephemeral: true });
                }
            } catch (error) {
                throw error;
            }
        } else {
            if (voiceState.channel.id !== connection.joinConfig.channelId)
                return interaction.followUp({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

            try {
                // We've already verified the URL, so we can safely assume the song is valid
                const result = await Media.createQueueItem(guild, member.user, song) as MediaQueueItem[];

                let embed = await Media.generateSongEmbed(client, result[0]);
                embed.setTitle("Songs added to Queue");
                if (result.length > 1) embed.setDescription(embed.data.description + `\n\n**+${result.length - 1} more songs were added after this one.**`);
                await interaction.followUp({ embeds: [embed] });
            } catch (error) {
                throw error;
            }
        }
    }
})