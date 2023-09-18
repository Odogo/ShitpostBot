// -- Package Imports --
import provider, { SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack } from 'play-dl';
import { APIEmbedField, EmbedBuilder, Guild, TextChannel, VoiceChannel } from 'discord.js';

// -- Local Imports --
import { info, warn } from '../../utilities/System';
import { SongDetails } from './SongDetails';
import { ServerQueueModel } from '../../utilities/database/ServerQueueModel';
import { AudioPlayerStatus, NoSubscriberBehavior, StreamType, VoiceConnection, VoiceConnectionStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';

export enum PlayingQueueStatus { NoQueueData, NoSongsInQueue, NoQueueIndex, EndOfQueue, Success }

export class MediaManager {

    /**
     * Finds a valid song regarding the URL given. The URLs accepted are:
     * >- YouTube
     * >- Spotify
     * >- Soundcloud
     * 
     * Any other URL will be rejected. 
     *
     * @param url a https valid url, with the guidelines above
     * @returns the final resulting URL(s)
     * 
     * Update: added .then() and .catch() to promises for proper error handling.
     */
    public static async finalizeURL(url: string): Promise<string[]> {
        return new Promise(async (resolve, reject) => {
            if(!url.startsWith("https")) { reject(new Error("Invalid URL")); }

            let urls = new Array<string>();
            let spValidate = provider.sp_validate(url), soValidate = await provider.so_validate(url), ytValidate = provider.yt_validate(url);

            // Spotify Validation
            if(spValidate && spValidate !== 'search') {
                if(provider.is_expired()) { await provider.refreshToken().catch(reject); }

                await provider.spotify(url).then(async (spot) => {
                    if(spot.type === 'track') {
                        spot = spot as SpotifyTrack
                        await provider.search(spot.name)
                            .then((fsong) => urls.push(fsong[0].url))
                            .catch(warn);
                    } else {
                        spot = spot as SpotifyPlaylist | SpotifyAlbum;
                        await spot.all_tracks().then(async (tracks) => {
                            for(let i=0; i<tracks.length; i++) {
                                await provider.search(tracks[i].name).then((fsong) => urls.push(fsong[0].url));
                            }
                        }).catch(reject);
                    }
                });
            }

            // Soundcloud Validation
            else if(soValidate && soValidate !== 'search') {
                await provider.soundcloud(url).then(async (cloud) => {
                    if(cloud.type === 'track') {
                        cloud = cloud as SoundCloudTrack;
                        await provider.search(cloud.name)
                            .then((fsong) => urls.push(fsong[0].url))
                            .catch(warn)
                    } else {
                        cloud = cloud as SoundCloudPlaylist;
                        await cloud.all_tracks().then(async tracks => {
                            for(let i=0; i<tracks.length; i++) {
                                await provider.search(tracks[i].url)
                                    .then((fsong) => urls.push(fsong[0].url))
                                    .catch(warn);
                            }
                        }).catch(reject);
                    }
                }).catch(reject);
            }

            // YouTube Validation
            else if(ytValidate === 'video') { urls.push(url); }
            else if(ytValidate === 'playlist') {
                await provider.playlist_info(url).then(async (playlist) => {
                    await playlist.all_videos().then(tracks => {
                        for(let i=0; i<tracks.length; i++) { urls.push(tracks[i].url); }
                    }).catch(warn);
                }).catch(reject);
            } else {
                reject(new Error("Invalid URL"));
            }

            resolve(urls);
        });
    }

    /**
     * Using the keywords, searches for a video and returns a single url.
     * 
     * @param keywords the keywords to search for
     * @returns the resulting URL
     */
    public static async searchForURL(keywords: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            await provider.search(keywords, { limit: 1 })
                .then(result => resolve(result[0].url))
                .catch(reject);
        });
    }

	// -- Queue Data --

    /**
     * Using the provided guild, pulls from the database to find the specific queue for the guild.
     * The method will return the entire list of URLs since the bot joined the voice channel, if it exists.
     * 
     * @param guild the guild to pull from
     * @returns an array of urls, otherwise undefined.
     */
    public static async fetchSongQueue(guild: Guild): Promise<Array<SongDetails> | undefined> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id } }).then(async data => {
                if(!data) resolve(undefined);

                let songs = new Array<SongDetails>();

                let parsed = JSON.parse(data.queueList);
                for(let i=0; i<parsed.length; i++) {
                    let result = SongDetails.fromJsonString(JSON.stringify(parsed[i]));
                    if(result != null) songs.push(result);
                }

                resolve(songs);
            }).catch(reject);
        });
    }

    /**
     * @deprecated Internal use only.
     * 
     * Sets the entire list of songs into the database.
     * 
     * @param guild the guild to set the list of songs to
     * @param songs the aforementioned list of songs
     */
    public static async setSongQueue(guild: Guild, songs: Array<SongDetails>): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
                if(!data) {
                    await ServerQueueModel.create({ guildId: guild.id, queueList: JSON.stringify(songs) })
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    await ServerQueueModel.update({ queueList: JSON.stringify(songs)}, { where: { guildId: guild.id }})
                        .then(() => resolve())
                        .catch(reject);
                }
            }).catch(reject);
        });
    }

    /**
     * Fetches the current list of songs in the queue, and adds the array of songs provided into the queue
     * and sets the new array back into the database while also returning it.
     * 
     * @param guild the guild to add a song to
     * @param songs the aforementioned song
     * @returns the new complete list of songs for the guild
     */
    public static async addSongsToQueue(guild: Guild, songs: Array<SongDetails>): Promise<Array<SongDetails>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSongQueue(guild).then(async (details) => {
                if(details == undefined)
                    details = new Array<SongDetails>();

                for(let i=0; i<songs.length; i++)
                    details.push(songs[i]);

                await this.setSongQueue(guild, details)
                    .then(() => resolve(details))
                    .catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Goes through the entire queue and finds all index points of where a match of the song exists.
     * 
     * @param guild the guild to grab from
     * @param song the song to look for [realistically only needs a url]
     * @returns all instance indexes of where the given song is
     */
    public static async hasSong(guild: Guild, song: SongDetails): Promise<Array<number>> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSongQueue(guild).then(async (details) => {
                let indexs = new Array<number>();

                for(let i=0; i<details.length; i++) {
                    if(details[i].songUrl === song.songUrl)
                        indexs.push(i);
                }

                resolve(indexs);
            }).catch(reject);
        });
    }

    /**
     * Removes a song at the current index point and returns it back.
     * 
     * @param guild the guild to grab a queue from
     * @param index the index of the queue to remove
     * @returns the removed song
     */
    public static async removeIndexSong(guild: Guild, index: number): Promise<SongDetails> {
        return new Promise(async (resolve, reject) => {
            await this.fetchSongQueue(guild).then(async (details) => {
                let s = details[index];
                delete details[index];

                await this.setSongQueue(guild, details).then(() => {
                    resolve(s);
                }).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Fetches the current index of the song queue.
     * >- If the returned index is -1, the queue has not been started and/or was stopped.
     * >- If undefined was returned, there is no active data for that guild id.
     * 
     * @param guild the guild to fetch from
     * @returns the current index, otherwise -1, undefined if no data exists
     */
    public static async fetchQueueIndex(guild: Guild): Promise<number | undefined> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
                if(!data) resolve(undefined);

                resolve(data.queueIndex);
            }).catch(reject);
        });
    }

    /**
     * Creates (or updates) an entry into the database with the new index.
     * 
     * @param guild the guild to set new data into
     * @param newIndex the new index data
     */
    public static async setQueueIndex(guild: Guild, newIndex: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
                if(!data) {
                    await ServerQueueModel.create({ guildId: guild.id, queueIndex: newIndex })
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    await ServerQueueModel.update({ queueIndex: newIndex }, { where: { guildId: guild.id }})
                        .then(() => resolve())
                        .catch(reject);
                }
            });
        });
    }

	// -- Queue Data (end) --

	// -- Rest of the Data --

	/**
	 * Fetches the text channel id from the database using the Guild.
	 * @param guild the guild id to fetch the text channel id from
	 * @returns the channel id, in string, undefined otherwise
	 */
    public static async fetchTextChannelId(guild: Guild): Promise<string | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				
				resolve(data.textChannelId);
			}).catch(reject);
		});
	}

	/**
	 * Sets the text channel id with the guild into the database.
	 * @param guild the guild to set data into
	 * @param channelId the text channel id to set
	 */
	public static async setTextChannelId(guild: Guild, channelId: string): Promise<void> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) {
					await ServerQueueModel.create({ guildId: guild.id, textChannelId: channelId })
						.then(() => resolve())
						.catch(reject);
				} else {
					await ServerQueueModel.update({ textChannelId: channelId }, {where: { guildId: guild.id }})
						.then(() => resolve())
						.catch(reject);
				}
			}).catch(reject);
		});
	}

	/**
	 * Fetches the voice channel id from the database using the Guild.
	 * @param guild the guild id to fetch the text channel id from
	 * @returns the channel id, in string, undefined otherwise
	 */
	public static async fetchVoiceChannelId(guild: Guild): Promise<string | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				resolve(data.voiceChannelId);
			}).catch(reject);
		});
	}

	/**
	 * Sets the voice channel id with the guild into the database.
	 * @param guild the guild to set data into
	 * @param channelId the voice channel id to set
	 */
	public static async setVoiceChannelId(guild: Guild, channelId: string): Promise<void> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) {
					await ServerQueueModel.create({ guildId: guild.id, voiceChannelId: channelId })
						.then(() => resolve())
						.catch(reject);
				} else {
					await ServerQueueModel.update({ voiceChannelId: channelId }, {where: { guildId: guild.id }})
						.then(() => resolve())
						.catch(reject);
				}
			}).catch(reject);
		});
	}

	/**
 	 * Fetches the playing state from the ServerQueue model.
 	 * If this is true, the current queue is being played at the current index.
 	 * If this is false, one of two things will be true based on the Current Queue Index (CQI)
 	 *  >- If false and the CQI is NOT -1, the queue is paused.
 	 *  >- Otherwise, if false and CQI IS -1, the queue is stopped.
 	 * 
 	 * @param guild the guild id to fetch from
 	 * @returns whether the queue is being played
 	*/
	public static async isPlaying(guild: Guild): Promise<boolean | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				resolve(data.isPlaying);
			}).catch(reject);
		});
	}

	/**
 	 * Sets the playing state to the ServerQueue model. The following table should be used:
 	 * 
 	 * If this is true, the current queue is being played at the current index.
 	 * 
 	 * If this is false, one of two things will be true based on the Current Queue Index (CQI) 
 	 * >- If the CQI is NOT -1, the queue is paused.
 	 * >- Otherwise, if the CQI IS -1, the queue is stopped.
 	 * 
 	 * @param guild the guild id to set into
 	 * @param newState whether the playback should be playing or not
 	*/
	public static async setPlaying(guild: Guild, newState: boolean): Promise<void> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) {
					await ServerQueueModel.create({ guildId: guild.id, isPlaying: newState })
						.then(() => resolve())
						.catch(reject);
				} else {
					await ServerQueueModel.update({ isPlaying: newState }, {where: { guildId: guild.id }})
						.then(() => resolve())
						.catch(reject);
				}
			}).catch(reject);
		});
	}

	/**
 	 * Fetches the current volume of the playback
 	 * 
 	 * @param guild the guild to pull from
 	 * @returns the current volume number
 	*/
	public static async fetchVolume(guild: Guild): Promise<number | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				resolve(data.playbackVolume);
			}).catch(reject);
		});
	}

	/**
 	 * Sets the playback volume to the new value
 	 * 
 	 * @param guild  the guild to set into
 	 * @param newVolume the new volume number
 	*/
	public static async setVolume(guild: Guild, newVolume: number): Promise<void> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) {
					await ServerQueueModel.create({ guildId: guild.id, playbackVolume: newVolume })
						.then(() => resolve())
						.catch(reject);
				} else {
					await ServerQueueModel.update({ playbackVolume: newVolume }, {where: { guildId: guild.id }})
						.then(() => resolve())
						.catch(reject);
				}
			}).catch(reject);
		});
	}

	/**
	 * Fetches whether or not the playback should be repeating or not
 	 * 
 	 * @param guild the guild id to pull from
 	 * @returns {Promise<boolean | undefined>} whether we should be repeating
 	*/
	public static async isRepeating(guild: Guild): Promise<boolean | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				resolve(data.isRepeating);
			}).catch(reject);
		});
	}

	/**
 	 * Fetches what type of repeating we should do, whether it's the single track it's currently playing
 	 * or the entire queue.
 	 * 
	 * @param guild the guild to pull from
	 * @returns the current state it's repeating
 	*/
	public static async fetchRepeatState(guild: Guild): Promise<"single" | "list" | undefined> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) resolve(undefined);
				resolve(data.repeatState);
			}).catch(reject);
		});
	}

	/**
	 * Sets whether or not the playback should be repeated and at what state it should repeat as.
 	 * >- "single" -> repeats the currently playing song
	 * >- "list" -> repeats the entire queue
	 * >- "keep" -> keeps whatever current value in the database
	 * 
	 * @param guild the guild to set into
	 * @param isRepeating whether to repeat or not
	 * @param state "single" loops the current song, "list" loops the entire queue, "keep" keeps whatever current value is in the database.
	 */
	public static async setRepeating(guild: Guild, isRepeating: boolean, state: "single" | "list" | "keep"): Promise<void> {
		return new Promise(async (resolve, reject) => {
			await ServerQueueModel.findOne({ where: { guildId: guild.id }}).then(async (data) => {
				if(!data) {
					if(state === "keep") reject(new Error("state 'keep' cannot be used"));
	
					await ServerQueueModel.create({ 
						guildId: guild.id,
						isRepeating: isRepeating,
						repeatState: state
					}).then(() => resolve()).catch(reject);
				} else {
					await ServerQueueModel.update({
						isRepeating: isRepeating,
						repeatState: (state === "keep" ? data.repeatState: state),
					}, {where: { guildId: guild.id }})
						.then(() => resolve())
						.catch(reject);
				}
			}).catch(reject);
		});
	}

	/**
	 * Creates a new voice connection to the specified voice channel.
	 * 
	 * @param guild the guild the voice channel is in
	 * @param channel the voice channel to join
	 * @returns the new voice connection
	 */
	public static async createConnection(guild: Guild, channel: VoiceChannel): Promise<VoiceConnection> {
		return new Promise(async (resolve, reject) => {
			const connection = joinVoiceChannel({
				guildId: guild.id,
				channelId: channel.id,
				selfMute: false,
				selfDeaf: true,
				adapterCreator: guild.voiceAdapterCreator
			});

			connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
				await Promise.race([
					entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
					entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
				]).then(async (connection) => {
					// Connecrtion is being retried. We will not do anything.
					// ..unless we need to.
				}).catch(async (error) => {
					warn("Handled error occured when changing voice states for GID: " + guild.id);
					warn(error);

					await this.setPlaying(guild, false);
					await this.setQueueIndex(guild, -1);
					await this.setSongQueue(guild, []);

					await this.setTextChannelId(guild, undefined);
					await this.setVoiceChannelId(guild, undefined);

					try {
						connection.destroy();
					} catch(error2) {
						warn("Handled error occured during handling disconnect: " + error2);
					}

					info("Successfully cleaned up queue data for GID: " + guild.id);
				});
			});

			resolve(connection);
		});
	}

	public static async beginPlayingQueue(guild: Guild, voiceChannel: VoiceChannel, textChannel: TextChannel): Promise<PlayingQueueStatus> {
		// Create the voice connection [or get it if it exists] and verifies we've connected
		const connection = getVoiceConnection(guild.id) || await this.createConnection(guild, voiceChannel);
		await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

		// Check if the queue exists and if there are songs inside of the queue.
		let songs = await this.fetchSongQueue(guild);
		if(songs === undefined) return PlayingQueueStatus.NoQueueData;
		if(songs.length <= 0) return PlayingQueueStatus.NoSongsInQueue;

		// Check if the index exists.
		let index = await this.fetchQueueIndex(guild);
		if(index === undefined) return PlayingQueueStatus.NoQueueIndex;

		// Add to the index to advance the queue forward by one.
		// if(index == -1) { index = 0; await setQueueIndex(guild.id, index); } [dont need this anymore]
		if(index < -1) { index = -1; }
		index += 1;

		// Final check to see if we've reached the end of the queue.
		if(index >= songs.length) return PlayingQueueStatus.EndOfQueue;

		// Create the stream from the provider and create the song resource to give to the Player.
		let stream = await provider.stream(songs[index].songUrl, { discordPlayerCompatibility: true });
		let resource = createAudioResource(stream.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });

		// Speaking of player, we create that here.
		const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause }});

		// Setting the databse up correctly with the correct information,
		// since we are ready to play the next song in the queue.
		await this.setPlaying(guild, true);
		await this.setQueueIndex(guild, index);
		await this.setVoiceChannelId(guild, voiceChannel.id);
		await this.setTextChannelId(guild, textChannel.id);

		// Play the resource and subscribe the player to the connection.
		player.play(resource);
		connection.subscribe(player);

		// Grab the details and announce to console we've started to play a song.
		// We also announce to the given text channel that we've started playing.
		let details = (await provider.video_info(songs[index].songUrl)).video_details;
		info("Connected and began processing queue at index " + index + " [GID: " + guild.id + "]");
		info("Song started playing: " + details.title + " by " + details.channel.name + " [GID: " + guild.id + "]");

		// textChannel.send({ embeds: [await generateSongEmbed(guild, songs[index], "nowPlaying")]});

		player.on('error', async (error) => {
			warn("An error occured while attempting to use the AudioPlayer: " + error);
			warn(error);

			textChannel.send({ content: "An error occured while attempting to use the AudioPlayer: " + error });
			connection.disconnect();
		});

		player.on(AudioPlayerStatus.Idle, async () => {
			info("Reached IDLE state for GID " + guild.id + ", checking for songs in the queue.");

			// Update the song and index variables from pulling them from the database.
			songs = await this.fetchSongQueue(guild);
			index = await this.fetchQueueIndex(guild);
			if(songs == undefined || index == undefined) {
				warn("Failed to update song queue and/or current index!");
				textChannel.send({ content: "Could not continue playing! Error: failed to update song list and/or current index from database!"});
            	return connection.disconnect();
			}

			// Grab the repeating states
			let repeating = await this.isRepeating(guild);
			let repeatState = await this.fetchRepeatState(guild);

			// Check if repeating isn't undefined and if we are repeating a SINGLE song.
			if(repeating !== undefined && repeatState !== undefined) {
				if(repeating && repeatState === 'single') {
					info("Repeating is active and set to repeat single, restarting song!");

					// Recreate the stream and resources
					stream = await provider.stream(songs[index].songUrl, { discordPlayerCompatibility: true });
					resource = createAudioResource(stream.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });

					// Play the resource again
					player.play(resource);

					// Send a message into the text channel about the song now playing.
					// textChannel.send({ embeds: [await generateSongEmbed(guild, songs[index], "nowPlaying")]});

					// Display in console that we've started playing the song.
					details = (await provider.video_info(songs[index].songUrl)).video_details;
                	info("Song started playing: " + details.title + " by " + details.channel.name + " [GID: " + guild.id + "]");
                	return;
				}
			}

			// We aren't playing anything anymore, so we stop. [we'll change this later :3]
			await this.setPlaying(guild, false);

			// Checking if the song queue and index exists incase it was removed from the database.
			if(!(songs.length <= 0)) {
				index += 1; // Increase by one to continue playing

				// Check if we've reached the end of the queue, after we added 1 to the index.
				if(index >= songs.length) {
					// Check if we need to repeat the list or not.
					if(repeating !== undefined && repeatState !== undefined) {
						if(repeating && repeatState === 'list') {
							info("Repeat is active and set to repeat the entire list, returning to the beinning of the queue! [GID: " + guild.id + "]");

							// Update the stream and resource with the new incoming song and play the resource.
							// No need to resubscribe since we've not disconnected and should already be subscribed.
							stream = await provider.stream(songs[index].songUrl, { discordPlayerCompatibility: true });
							resource = createAudioResource(stream.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });
							player.play(resource);

							// Update the database accordingly
							await this.setPlaying(guild, true);
							await this.setQueueIndex(guild, index);

							// Announce to the text channel that we're now playing a new song, and announce to console.
							// textChannel.send({ embeds: [await generateSongEmbed(guild, songs[index], "nowPlaying")]});

							details = (await provider.video_info(songs[index].songUrl)).video_details;
                        	info("Song started playing: " + details.title + " by " + details.channel.name + " [GID: " + guild.id + "]");
                        	return;
						}
					}

					// We've reached the end of the queue and announce to console.
					info("Remaining on state IDLE for GID " + guild.id + ", no new songs exist.");

					// Disconnects the bot after 5 minutes of inactivity.
					setTimeout(async () => {
						let checkIndex = await this.fetchQueueIndex(guild);
	
						if((checkIndex == (index - 1) && player.state.status == AudioPlayerStatus.Idle) || checkIndex >= (await this.fetchSongQueue(guild)).length) {
							await textChannel.send({ content: "**Idle Timeout:** Reached 5 minutes of inactivity, disconnecting!"});
							info("Disconnected instance for GID " + guild.id + ", reached idle timeout and passed checks");
	
							connection.disconnect();
						} else {
							info("Found song(s) are still in queue and/or the player is currently playing, ignoring timeout!");
						}
					}, 5*60*1000); // should be 5 minutes
				} else {
					// We've not reached the end of the queue, keep playing! [Announce to console as well]
					info("Found song, attempting to begin playing. [GID: " + guild.id + "]");

					// Update the stream and resource with the new incoming song and play the resource.
					// No need to resubscribe since we've not disconnected and should already be subscribed.
					stream = await provider.stream(songs[index].songUrl, { discordPlayerCompatibility: true });
					resource = createAudioResource(stream.stream, { inlineVolume: true, inputType: StreamType.Arbitrary });
					player.play(resource);

					// Update the database accordingly
					await this.setPlaying(guild, true);
					await this.setQueueIndex(guild, index);

					// Announce to the text channel that we're now playing a new song, and announce to console.
					// textChannel.send({ embeds: [await generateSongEmbed(guild, songs[index], "nowPlaying")]});

					details = (await provider.video_info(songs[index].songUrl)).video_details;
                    info("Song started playing: " + details.title + " by " + details.channel.name + " [GID: " + guild.id + "]");
				}
			} else return connection.disconnect();
		});

		return PlayingQueueStatus.Success;
	}

	/**
	 * Builds an embed about the active queue list for the guild.
	 * Modifying the perPage and page variables modifies the specific view.
	 * 
	 * @param guild the guild to fetch the songs from
	 * @param perPage [R: 5-15] how many songs to display per page
	 * @param page what page to display
	 * @returns the built embed
	 */
	public static async generateQueueList(guild: Guild, perPage = -1, page = -1): Promise<string | EmbedBuilder> {
		return new Promise(async (resolve, reject) => {
			await this.fetchSongQueue(guild).then(async songs => {
				if(songs == undefined) resolve("There are no songs to make a queue list from.");
				if(perPage < 5 || perPage > 15) resolve("The minimum and maximum limit for each page is between 5 and 15 entries.");

				let totalPages = Math.floor(songs.length / perPage) + (songs.length % perPage == 0 ? 0:1);

				const embed = new EmbedBuilder({
					color: 0x73e1fa,
					footer: { text: "Queue | Page: " + page + "/" + totalPages + " | " + perPage + "/page" },
					timestamp: Date.now(),
					author: { name: guild.name, icon_url: guild.iconURL({extension: 'png', size: 4096}) }
				});

				let start = (page - 1) * perPage;
				let paginate = songs.slice(start, page * perPage);

				let fields = new Array<APIEmbedField>();
				for(let index=0; index<paginate.length; index++) {
					let details = paginate[index];

					let vDetails = (await provider.video_basic_info(details.songUrl)).video_details;
					let placement = "" + ((start + index) + 1);

					if((start + index) == await this.fetchQueueIndex(guild)) {
						placement = "-NOW-";
					} else {
						placement = ".";
					}

					fields.push({
						name: placement + " " + vDetails.title + " by " + vDetails.channel.name,
						value: details.songUrl + " [requested by: <@" + details.submitterId + ">]"
					});
				}

				embed.addFields(fields);
				resolve(embed);
			}).catch(reject);
		});
	}

	public static async shuffleQueue(guild: Guild, shuffleType: "keepPlaying" | "stopShuffle") {
		return new Promise(async (resolve, reject) => {
			const connection = getVoiceConnection(guild.id);
			if(connection === undefined) reject(new Error("No active connection"));
	
			let curIndex = -99;
			if(index == null) {
				curIndex = await this.fetchQueueIndex(guild).catch(error => reject(error));
				if(curIndex === undefined) reject(new Error("No queue data found"));
			} else {
				curIndex = index;
			}
	
			/** @type {PlayerSubscription} */
			let subscription = connection.state.subscription;
			const player = subscription.player;
	
			let songList = [];
			if(songs == null) {
				songList = await this.fetchSongQueue(guild);
				if(songList === undefined) reject(new Error("No queue data found"));
			} else {
				songList = songs;
			}
	
			/** @type {SongDetails[]} */ let newQueue = [];
			if(shuffleType === 'stopShuffle') {
				player.pause();
				newQueue = songList.slice().sort((a,b) => 0.5 - Math.random());
			} else if(shuffleType === 'keepPlaying') {
				newQueue.push(songList[index]);
	
				let shuffled = songList.slice();
				delete shuffled[index];
				shuffled.sort((a,b) => 0.5 - Math.random());
	
				for(let i=0;i<shuffled.length; i++) {
					newQueue.push(shuffled[i]);
				}
			}
	
			try {
				await this.setSongQueue(guild, newQueue);
				await this.setQueueIndex(guild, -1 + (shuffleType === 'keepPlaying' ? 1 : 0));
			} catch(error) { 
				reject(new Error(error));
			}
				
			if(shuffleType === 'stopShuffle') {
				player.stop();
			}
	
			resolve(newQueue);
		});
	}
}