import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { SongDetails } from "../../structure/classes/SongDetails";
import { MediaManager, PlayingQueueStatus } from "../../structure/classes/MediaManager";
import { getVoiceConnection } from "@discordjs/voice";
import { debug, warn } from "../../utilities/System";

export default new KyCommand({
    name: "play",
    description: "Joins your voice channel and gets ready to play music!",
    options: [
        {
            name: "song",
            description: "A query of keywords or a URL to search for the song!",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        let songDatas = new Array<SongDetails>();
        await MediaManager.finalizeURL(options.getString("song")).then((tracks) => {
            let time = Date.now();
            for(let i=0; i<tracks.length; i++) songDatas.push(new SongDetails(tracks[i], interaction.member.id, "" + time));
        }).catch(async (error) => {
            if(error === "Invalid URL") {
                await interaction.followUp({ content: "Could not validate URL, attempting to search via keywords!", ephemeral: true });
                
                await MediaManager.searchForURL(options.getString("song")).then((url) => {
                    songDatas.push(new SongDetails(url, interaction.member.id, Date.now() + ""));
                }).catch(async err => {
                    return await interaction.editReply({ content: null, embeds: [new EmbedBuilder({
                        author: {
                            name: (interaction.member.nickname == null ? MediaManager.capFirstChar(interaction.user.username): MediaManager.capFirstChar(interaction.member.nickname)),
                            icon_url: interaction.user.avatarURL({extension: 'png', size: 4096})
                        },
                        footer: { text: "Error" },
                        timestamp: Date.now(),
                        color: 0xff8080,
                        title: "An error occured!",
                        fields: [
                            { name: "Error", value: error + "" },
                            { name: "Error", value: err + "" }
                        ]
                    })]});
                });
            } else {
                return await interaction.editReply({ content: null, embeds: [new EmbedBuilder({
                    author: {
                        name: (interaction.member.nickname == null ? MediaManager.capFirstChar(interaction.user.username): MediaManager.capFirstChar(interaction.member.nickname)),
                        icon_url: interaction.user.avatarURL({extension: 'png', size: 4096})
                    },
                    footer: { text: "Error" },
                    timestamp: Date.now(),
                    color: 0xff8080,
                    title: "An error occured!",
                    fields: [
                        { name: "Error", value: error + "" },
                    ]
                })]});
            }
        });

        if(songDatas.length <= 0)
            return await interaction.editReply({ content: "We couldn't find any song datas. Validate the URL and/or try again!" });

        let playing = await MediaManager.isPlaying(interaction.guild);
        let connection = getVoiceConnection(interaction.guild.id);

        let voiceState = interaction.member.voice;
        debug(voiceState);
        if(!voiceState.channel)
            return await interaction.editReply({ content: "You are not connected to any voice channel!"});

        if(!playing || !connection) {
            await MediaManager.addSongsToQueue(interaction.guild, songDatas).catch(async (reason) => {
                warn("Failed to add song(s) into the queue [GID: " + interaction.guild.id + "] with reason: " + reason);
                warn(reason);

                return await interaction.editReply({ content: "Failed to add song(s) into the queue with reason: " + reason });
            });

            let result = await MediaManager.beginPlayingQueue(interaction.guild, voiceState.channel, interaction.channel);
            switch(result) {
                case PlayingQueueStatus.NoQueueData: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_queue_data`]"});
                case PlayingQueueStatus.NoSongsInQueue: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_songs_in_queue`]"});
                case PlayingQueueStatus.NoQueueIndex: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_queue_index`]"});
                case PlayingQueueStatus.EndOfQueue: return await interaction.editReply({ content: "Could not process queue: End of the queue was reached. [Code: `end_of_queue`]" });
                case PlayingQueueStatus.Success: break;
                default: break;
            }

            return await interaction.editReply({ content: "Your song(s) were added to the queue amd we've begun playing!"});
        } else {
            if(!(voiceState.channel.id === connection.joinConfig.channelId))
                return await interaction.editReply({ content: "You must be in the same voice channel as I am to do this!" });

            await MediaManager.addSongsToQueue(interaction.guild, songDatas).catch(async (reason) => {
                warn("Failed to add song(s) into the queue [GID: " + interaction.guild.id + "] with reason: " + reason);
                warn(reason);
    
                return await interaction.editReply({ content: "Failed to add song(s) into the queue with reason: " + reason });
            });

            let embed = await MediaManager.generateSongEmbed(interaction.guild, songDatas[0], 'addedToQueue');
            if(songDatas.length > 1) {
                embed.addFields([{ name: "Added " + songDatas.length  + " additonal songs", value: '\u200b'}]);
            }

            return await interaction.editReply({ content: "", embeds: [embed]});
        }
    }
});