import { Client, EmbedBuilder, Guild, User, VoiceBasedChannel } from "discord.js";
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, getVoiceConnection, joinVoiceChannel, NoSubscriberBehavior, VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";
import provider, { SoundCloudPlaylist, SpotifyAlbum, SpotifyPlaylist } from 'play-dl';

import { MediaParsingError, MediaQueueItem, QueueItemSong, QueueItemSource, QueueItemType } from "../database/MediaQueueItem";
import { MediaPlayer, MusicTextBasedChannel, RepeatingType } from '../database/MediaPlayer';
import { sequelInstance } from "../..";
import { logInfo, logWarn } from "../../system";

export enum PlayingQueueStatus { NoSongsInQueue, EndOfQueue, Success }

/**
 * This class is the manager for handling connections to the database through {@link MediaQueueItem} and {@link MediaPlayer}
 * @author Kyomi
 */
export class Media {

    //#region MediaQueueItem
    /**
     * Fetches all the queue items from the database
     * @returns A promise that resolves to the queue items
     */
    public static async fetchAllQueueItems(): Promise<MediaQueueItem[]> {
        return MediaQueueItem.findAll();
    }

    /**
     * Fetches all the queue items from the database for a specific guild
     * @param guild The guild to fetch the queue items for
     * @returns A promise that resolves to the queue items for the guild
     */
    public static async fetchGuildQueueItems(guild: Guild): Promise<MediaQueueItem[]> {
        const items = await MediaQueueItem.findAll({ where: { guildId: guild.id } });
        return items.sort((a, b) => a.queuePosition - b.queuePosition);
    }

    /**
     * Fetches all the queue items from the database for a specific guild and requestor
     * @param queueItems The queue items to fetch the song details for
     * @returns A promise that resolves to the queue items with song details
     */
    public static async generateQueueSongs(queueItems: MediaQueueItem[]): Promise<QueueItemSong[]> {
        const songs = await Promise.all(queueItems.map((queueItems) => queueItems.getSongDetails()));
        return songs.sort((a, b) => a.queueIndex - b.queueIndex);
    }

    /**
     * Fetches the next queue item from the database for a specific guild
     * @param guild The guild to fetch the next queue item for
     * @param requestor The requestor to fetch the next queue item for
     * @param mediaUrl The media URL to fetch the next queue item for
     * @returns A promise that resolves to the next queue item
     */
    public static async createQueueItem(guild: Guild, requestor: User, mediaUrl: string): Promise<MediaQueueItem[] | null> {
        const [source, type] = await MediaQueueItem.verifyURL(mediaUrl);
        if (source === QueueItemSource.INVALID || type === QueueItemType.INVALID) return null;

        if (type === QueueItemType.SONG) {
            const result = await this.createSongQueueItem(guild, requestor, mediaUrl);
            if (result == null) return null; else return [result];
        } else {
            const result = await this.createSongQueueItems(guild, requestor, mediaUrl);
            if (result == null) return null; else return result;
        }
    }

    /**
     * Creates a queue item from a song URL
     * @param guild The guild to create the queue item for
     * @param requestor The requestor to create the queue item for
     * @param mediaUrl The media URL to create the queue item from
     * @returns A promise that resolves to the queue item created
     */
    private static async createSongQueueItem(guild: Guild, requestor: User, mediaUrl: string): Promise<MediaQueueItem | null> {
        const [source, type] = await MediaQueueItem.verifyURL(mediaUrl);
        if (source === QueueItemSource.INVALID || type === QueueItemType.INVALID) return null;
        if (type !== QueueItemType.SONG) return null;

        return sequelInstance.transaction(async (transaction) => {
            const maxQueuePosition = await MediaQueueItem.max<number, MediaQueueItem>("queuePosition", {
                where: { guildId: guild.id },
                transaction
            });

            const nextQueuePosition = maxQueuePosition === null ? 0 : maxQueuePosition + 1;

            return await MediaQueueItem.create({
                guildId: guild.id,
                requestorId: requestor.id,
                songUrl: mediaUrl,
                queuePosition: nextQueuePosition
            }, { transaction });
        });
    }

    /**
     * Creates multiple queue items from a playlist or album URL
     * @param guild The guild to create the queue items for
     * @param requestor The requestor to create the queue items for
     * @param mediaUrl The media URL to create the queue items from
     * @returns A promise that resolves to the queue items created
     */
    private static async createSongQueueItems(guild: Guild, requestor: User, mediaUrl: string): Promise<MediaQueueItem[] | null> {
        const [source, type] = await MediaQueueItem.verifyURL(mediaUrl);
        if (source === QueueItemSource.INVALID || type === QueueItemType.INVALID) return null;
        if (type === QueueItemType.SONG) return null;

        return sequelInstance.transaction(async (transaction) => {
            const maxQueuePosition = await MediaQueueItem.max<number, MediaQueueItem>("queuePosition", {
                where: { guildId: guild.id },
                transaction
            });

            const nextQueuePosition = maxQueuePosition === null ? 0 : maxQueuePosition + 1;

            try {
                switch (source) {
                    case QueueItemSource.SPOTIFY: {
                        if (provider.is_expired()) await provider.refreshToken(); // Refresh the token if it's expired
                        const songListItem = await provider.spotify(mediaUrl) as SpotifyPlaylist | SpotifyAlbum;

                        // Quick little sanity check to make sure the URL is a playlist or album
                        if (songListItem.type === "track") throw new MediaParsingError("Invalid URL provided: Expected a playlist or album, got a song instead");

                        const songs = await songListItem.all_tracks();

                        // Use bulk create to add all of the songs
                        return await MediaQueueItem.bulkCreate(songs.map((song, index) => ({
                            guildId: guild.id,
                            requestorId: requestor.id,
                            songUrl: song.url,
                            queuePosition: nextQueuePosition + index
                        })), { transaction });
                    }
                    case QueueItemSource.SOUNDCLOUD: {
                        const songListItem = await provider.soundcloud(mediaUrl) as SoundCloudPlaylist;

                        // Quick little sanity check to make sure the URL is a playlist
                        if (songListItem.type === "track" || songListItem.type === "user") throw new MediaParsingError("Invalid URL provided: Expected a playlist, got a song or user instead");

                        const songs = await songListItem.all_tracks();

                        return await MediaQueueItem.bulkCreate(songs.map((song, index) => ({
                            guildId: guild.id,
                            requestorId: requestor.id,
                            songUrl: song.url,
                            queuePosition: nextQueuePosition + index
                        })), { transaction });
                    }
                    case QueueItemSource.YOUTUBE: {
                        const songListItem = await provider.playlist_info(mediaUrl);
                        const songs = await songListItem.all_videos();

                        return await MediaQueueItem.bulkCreate(songs.map((song, index) => ({
                            guildId: guild.id,
                            requestorId: requestor.id,
                            songUrl: song.url,
                            queuePosition: nextQueuePosition + index
                        })), { transaction });
                    }

                    default: return null;
                }
            } catch (error) {
                logWarn("Failed to add album or playlist to queue: " + error.message);
                logWarn(error);

                return null;
            }
        });
    }

    /**
     * Destroys a queue item from the database
     * @param queueItem The queue item to destroy
     */
    public static async removeQueueItem(queueItem: MediaQueueItem): Promise<void> {
        await queueItem.destroy();
    }

    /**
     * Destroys multiple queue items from the database
     * @param queueItems The queue items to destroy
     */
    public static async removeQueueItems(queueItems: MediaQueueItem[]): Promise<void> {
        await Promise.all(queueItems.map((queueItem) => queueItem.destroy()));
    }

    /**
     * Removes a queue item from the database for a specific guild and position
     * @param guild The guild to remove the queue item for
     * @param position The position to remove the queue item for
     * @returns 
     */
    public static async removePositionQueueItem(guild: Guild, position: number): Promise<MediaQueueItem | undefined> {
        const queueItem = await MediaQueueItem.findOne({ where: { guildId: guild.id, queuePosition: position } });
        if (queueItem == null) return undefined;

        await queueItem.destroy();
        return queueItem;
    }

    /**
     * Destroys all queue items from the database for a specific guild
     * @param guild The guild to destroy the queue items for
     */
    public static async removeAllQueueItems(guild: Guild): Promise<void> {
        await MediaQueueItem.destroy({ where: { guildId: guild.id } });
    }
    //#endregion

    //#region MediaPlayer
    //#region Getters
    /**
     * Creates a new media player in the database for a specific guild
     * @param guild The guild to create the media player for
     * @returns A promise that resolves to the media player associated with the guild 
     */
    public static async getMediaPlayer(guild: Guild): Promise<MediaPlayer | null> {
        return MediaPlayer.findOne({ where: { guildId: guild.id } });
    }

    /**
     * Fetches the voice channel where the media player is connected
     * @param guild The guild to fetch the voice channel for
     * @param client Optionally, the client to fetch the voice channel with
     * @returns A promise that resolves to the voice channel
     */
    public static async fetchVoiceChannel(guild: Guild, client: Client): Promise<VoiceBasedChannel | null> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return null;
            return player.fetchVoiceChannel(client);
        });
    }

    /**
     * Fetches the text channel where the media player is connected
     * @param guild The guild to fetch the text channel for
     * @param client Optionally, the client to fetch the text channel with
     * @returns A promise that resolves to the text channel
     */
    public static async fetchTextChannel(guild: Guild, client: Client): Promise<MusicTextBasedChannel | null> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return null;
            return player.fetchTextChannel(client);
        });
    }

    /**
     * Fetches whether or not the media player is playing
     * 
     * <b>NOTE:</b> This does not determine if the media player is connected to a voice channel.
     * @param guild The guild to fetch the playing status for
     * @returns A promise that resolves to whether or not the media player is playing
     */
    public static async isPlaying(guild: Guild): Promise<boolean> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return false;
            return player.playing;
        });
    }

    /**
     * Fetches the current playing index of the media player
     * @param guild The guild to fetch the playing index for
     * @returns A promise that resolves to the playing index
     */
    public static async fetchPlayingIndex(guild: Guild): Promise<number> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return -1;
            return player.playingIndex;
        });
    }

    /**
     * Fetches the volume of the media player
     * @param guild The guild to fetch the volume for
     * @returns A promise that resolves to the volume
     */
    public static async fetchVolume(guild: Guild): Promise<number> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return 1;
            return player.volume;
        });
    }

    /**
     * Fetches the repeating status of the media player
     * @param guild The guild to fetch the repeating status for
     * @returns A promise that resolves to the repeating status
     */
    public static async fetchRepeating(guild: Guild): Promise<RepeatingType> {
        return this.getMediaPlayer(guild).then((player) => {
            if (player == null) return RepeatingType.NoRepeat;
            return player.repeating;
        });
    }
    //#endregion
    //#region Setters
    /**
     * Create a new media player in the database for a specific guild
     * @param options The options to create the media player with
     * @returns A promise that resolves to the media player associated with the guild
     */
    public static async createMediaPlayer(options: MPCreateOptions): Promise<MediaPlayer> {
        const data = await MediaPlayer.findOne({ where: { guildId: options.guild.id } });
        if (data != null) return data;

        return await MediaPlayer.create({
            guildId: options.guild.id,
            voiceChannelId: options.voiceChannel.id,
            textChannelId: options.textChannel.id,

            playing: options.playing || undefined,
            playingIndex: options.playingIndex || undefined,

            volume: options.volume || undefined,
            repeating: options.repeating || undefined
        });
    }

    /**
     * Update the media player in the database
     * @param player The media player to update
     * @returns A promise that resolves to the updated media player
     */
    public static async updateMediaPlayer(player: MediaPlayer): Promise<MediaPlayer> {
        return player.save();
    }

    /**
     * Update the media player in the database with specific options
     * @param player The media player to update
     * @param options The options to update the media player with, if any
     * @returns A promise that resolves to the updated media player, or the original media player if no options were provided
     */
    public static async updateMediaPlayerOptions(player: MediaPlayer, options?: MPUpdateOptions): Promise<MediaPlayer> {
        if (options == null) return player;

        if (options.voiceChannel != null) player.voiceChannelId = options.voiceChannel.id;
        if (options.textChannel != null) player.textChannelId = options.textChannel.id;

        if (options.playing != null) player.playing = options.playing;
        if (options.playingIndex != null) player.playingIndex = options.playingIndex;

        if (options.volume != null) player.volume = options.volume;
        if (options.repeating != null) player.repeating = options.repeating;

        return player.save();
    }

    /**
     * Destroy the media player in the database
     * @param guild The guild to destroy the media player for
     * @returns A promise that resolves when the media player has been destroyed
     */
    public static async destroyMediaPlayer(guild: Guild): Promise<void> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return;

        await player.destroy();
    }

    /**
     * Update the voice channel of the media player
     * @param player The media player to update
     * @param voiceChannel The voice channel to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateVoiceChannel(player: MediaPlayer, voiceChannel: VoiceBasedChannel): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { voiceChannel });
    }

    /**
     * Update the text channel of the media player
     * @param player The media player to update
     * @param textChannel The text channel to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateTextChannel(player: MediaPlayer, textChannel: MusicTextBasedChannel): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { textChannel });
    }

    /**
     * Update the playing status of the media player
     * @param player The media player to update
     * @param playing The playing status to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updatePlaying(player: MediaPlayer, playing: boolean): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { playing });
    }

    /**
     * Update the playing index of the media player
     * @param player The media player to update
     * @param playingIndex The playing index to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updatePlayingIndex(player: MediaPlayer, playingIndex: number): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { playingIndex });
    }

    /**
     * Update the volume of the media player
     * @param player The media player to update
     * @param volume The volume to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateVolume(player: MediaPlayer, volume: number): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { volume });
    }

    /**
     * Update the repeating status of the media player
     * @param player The media player to update
     * @param repeating The repeating status to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateRepeating(player: MediaPlayer, repeating: RepeatingType): Promise<MediaPlayer> {
        return this.updateMediaPlayerOptions(player, { repeating });
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param voiceChannel The voice channel to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGVoiceChannel(guild: Guild, voiceChannel: VoiceBasedChannel): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updateVoiceChannel(player, voiceChannel);
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param textChannel The text channel to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGTextChannel(guild: Guild, textChannel: MusicTextBasedChannel): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updateTextChannel(player, textChannel);
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param playing The playing status to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGPlaying(guild: Guild, playing: boolean): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updatePlaying(player, playing);
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param playingIndex The playing index to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGPlayingIndex(guild: Guild, playingIndex: number): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updatePlayingIndex(player, playingIndex);
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param volume The volume to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGVolume(guild: Guild, volume: number): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updateVolume(player, volume);
    }

    /**
     * Update the media player in the database for a specific guild
     * @param guild The guild to update the media player for
     * @param repeating The repeating status to update the media player with
     * @returns A promise that resolves to the updated media player
     */
    public static async updateGRepeating(guild: Guild, repeating: RepeatingType): Promise<MediaPlayer | null> {
        const player = await this.getMediaPlayer(guild);
        if (player == null) return null;

        return this.updateRepeating(player, repeating);
    }

    //#endregion
    //#endregion

    //#region Connection and Playback
    /**
     * Creates a voice connection to a voice channel in a guild
     * @param guild The guild to create the voice connection in
     * @param channel The voice channel to create the voice connection to
     * @returns A promise that resolves to the voice connection
     */
    public static async createConnection(guild: Guild, channel: VoiceBasedChannel): Promise<VoiceConnection> {
        logInfo("[Media] Creating voice connection in " + guild.name + " (ID: " + guild.id + ")  to channel " + channel.id + ".")

        const connection = joinVoiceChannel({
            guildId: guild.id,
            channelId: channel.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfMute: false,
            selfDeaf: true
        });

        connection.on(VoiceConnectionStatus.Ready, async () => {
            logInfo("[Media] Successfully connected to voice channel in " + guild.name + " to channel " + connection.joinConfig.channelId);
        });

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
            ]).then(async (connection) => {
                logInfo("[Media] Reconnected to voice channel in " + guild.name + " (ID: " + guild.id + ")  to channel " + connection.joinConfig.channelId);
            }).catch(async (error) => {
                logWarn("[Media] Handling error when changing voice states. (Guild: " + guild.name + " (ID: " + guild.id + "))");
                logWarn(error);

                await this.destroyMediaPlayer(guild);
                await this.removeAllQueueItems(guild);

                try {
                    connection.destroy();
                } catch (error2) {
                    logWarn("[Media] Handled error occured durig connection destruction. (Guild: " + guild.id + ")");
                    logWarn("[Media] Ignoring error: " + error2);
                }

                logInfo("[Media] Successfully cleaned up voice connection in " + guild.name + " (ID: " + guild.id + ")");
            });
        });

        return connection;
    }

    /**
     * Creates a new voice connection [if one does not exist] and starts playing the queue in a guild.
     * 
     * Creates a new media player [if one does not exist] and starts playing the queue in a guild.
     * @param guild The guild to find the connection, create one, and start playing the queue in
     * @param voiceChannel The voice channel to create the connection to
     * @param textChannel The text channel to send messages to
     * @returns A promise that resolves to the status of the queue playing
     */
    public static async startPlayingQueue(client: Client, guild: Guild, voiceChannel: VoiceBasedChannel, textChannel: MusicTextBasedChannel): Promise<PlayingQueueStatus> {
        // Create the voice connection [or get it if it exists] and verify it is ready
        const connection = getVoiceConnection(guild.id) || await this.createConnection(guild, voiceChannel);
        await entersState(connection, VoiceConnectionStatus.Ready, 20_000);

        // Fetch the media player, or create one if it does not exist
        let mediaPlayer = await this.getMediaPlayer(guild);
        if (mediaPlayer == null) mediaPlayer = await this.createMediaPlayer({ guild, voiceChannel, textChannel });

        // Fetch the queue items and songs to play
        const queueItems = await this.fetchGuildQueueItems(guild);
        if (queueItems.length == 0) return PlayingQueueStatus.NoSongsInQueue;
        const songs = await this.generateQueueSongs(queueItems);

        // Fetch the playing index and verify it is valid
        // If it is not valid, set it to -1
        // Increment the playing index by 1 (this is why we start at -1)
        let playingIndex = await this.fetchPlayingIndex(guild);
        if (playingIndex < -1) playingIndex = -1;
        playingIndex += 1;

        // Quick sanity check to ensure the playing index is valid
        if (playingIndex >= songs.length) return PlayingQueueStatus.EndOfQueue;

        // We're ready! Create the stream and resource
        let stream = await queueItems[playingIndex].generateStream();
        let resource = createAudioResource(stream, { inlineVolume: true });

        // oh and dont forget the player
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });

        // Debugging purposes :P
        player.on('stateChange', async (oldstate, newstate) => {
            console.log("oldstate", oldstate.status, "newstate", newstate.status);
        });

        // Update the media player with the new options
        await this.updateMediaPlayerOptions(mediaPlayer, {
            playing: true,
            playingIndex,
        });

        // Play the resource and subscribe the player to the connection
        player.play(resource);
        connection.subscribe(player);

        // Send a message to the text channel and log the event
        logInfo("[Media] Queue processing has started! The first song playing is " + songs[playingIndex].title + " (by: " + songs[playingIndex].artist + ") in " + guild.name + " (ID: " + guild.id + ")");
        await textChannel.send({ embeds: [await this.generateSongEmbed(client, queueItems[playingIndex], "NowPlaying")] });

        // Handle the player events
        // If an error occurs, disconnect the connection
        player.on('error', async (error) => {
            logWarn("[Media] An error occured while playing a song in " + guild.name + " (ID: " + guild.id + "): " + error);
            logWarn(error);

            textChannel.send({ content: "An error occured while playing the song: " + error });
            connection.disconnect();
        });

        // If the player reaches the end of the song, handle accordingly
        player.on(AudioPlayerStatus.Idle, async () => {
            logInfo("[Media] Reached Idle state in " + guild.name + " (ID: " + guild.id + ") , checking for songs in the queue.");

            // Fetch the media player and verify it exists
            let mediaPlayer = await this.getMediaPlayer(guild);
            if (mediaPlayer == null) mediaPlayer = await this.createMediaPlayer({ guild, voiceChannel, textChannel, playing: true, playingIndex });

            // Fetch the queue items and songs to play
            const queueItems = await this.fetchGuildQueueItems(guild);
            if (queueItems.length == 0) {
                // If there are no songs in the queue, disconnect the connection
                logInfo("[Media] No songs in the queue in " + guild.name + " (ID: " + guild.id + ") , disconnecting.");

                await textChannel.send({ content: "No songs in the queue, disconnecting!" });

                return connection.disconnect();
            }

            // Generate the song metadata
            const songs = await this.generateQueueSongs(queueItems);

            // Fetch the repeating status and handle accordingly
            const isRepeating = await this.fetchRepeating(guild);
            if (isRepeating === "Song") { // If the repeating status is set to "Song", repeat the current song
                logInfo("[Media] Repeating state is set to 'Song' in " + guild.name + " (ID: " + guild.id + ") , repeating the current song.");

                // Create the stream and resource
                const stream = await queueItems[playingIndex].generateStream();
                const resource = createAudioResource(stream, { inlineVolume: true });

                // Play the resource and update the media player
                player.play(resource);
                return await textChannel.send({ content: ":white_check_mark: Repeating song...", embeds: [await this.generateSongEmbed(client, queueItems[playingIndex], "NowPlaying")] });
            }

            // Increment the playing index by 1
            await this.updateGPlaying(guild, false);
            let index = await this.fetchPlayingIndex(guild);

            if (songs.length <= 0) return connection.disconnect();
            index += 1;

            // If the index is greater than or equal to the length of the songs, handle accordingly
            if (index >= songs.length) {
                // Fetch the repeating status and handle accordingly
                if (isRepeating === "Playlist") { // If the repeating status is set to "Playlist", repeat the playlist
                    logInfo("[Media] Repeating state is set to 'Playlist' in " + guild.name + " (ID: " + guild.id + ") , repeating the playlist.");
                    index = 0; // Reset the index to 0

                    // Create the stream and resource
                    const stream = await queueItems[index].generateStream();
                    const resource = createAudioResource(stream, { inlineVolume: true });

                    // Play the resource
                    player.play(resource);

                    // Update the media player with the new options
                    await this.updateMediaPlayerOptions(mediaPlayer, { playing: true, playingIndex: index });

                    // Send a message to the text channel
                    return await textChannel.send({ content: "**:white_check_mark: Repeating playlist...**", embeds: [await this.generateSongEmbed(client, queueItems[index], "NowPlaying")] });
                }

                // If the repeating status is set to "NoRepeat", begin the idle timeout
                logInfo("[Media] End of queue reached in " + guild.name + " (ID: " + guild.id + ")");
                setTimeout(async () => {
                    // Fetch the current playing index
                    const checkIndex = await this.fetchPlayingIndex(guild);

                    // If the index hasn't changed and the player is idle OR the index is greater than or equal to the length of the queue items, disconnect the connection
                    if ((checkIndex == (index - 1) && player.state.status == AudioPlayerStatus.Idle) || checkIndex >= (await this.fetchGuildQueueItems(guild)).length) {
                        await textChannel.send({ content: "**Idle Timeout:** Reached 5 minutes of inactivity, disconnecting!" });
                        logInfo("[Media] Idle timeout reached in " + guild.name + " (ID: " + guild.id + ") , disconnecting.");

                        connection.disconnect();
                    } else { // Otherwise, the queue has been updated, ignore the timeout
                        logInfo("[Media] Idle timeout reached in " + guild.name + " (ID: " + guild.id + ") , but the queue has been updated. Ignoring.");
                    }
                }, 1000 * 60 * 5);
            } else { // Otherwise, play the next song in the queue
                logInfo("[Media] Playing next song " + songs[index].title + " (by: " + songs[index].artist + ") in " + guild.name + " (ID: " + guild.id + ")");

                // Create the stream and resource and play the resource
                const stream = await queueItems[index].generateStream();
                const resource = createAudioResource(stream, { inlineVolume: true });
                player.play(resource);

                // Update the media player with the new options
                await this.updateMediaPlayerOptions(mediaPlayer, { playing: true, playingIndex: index });

                // Send a message to the text channel
                await textChannel.send({ embeds: [await this.generateSongEmbed(client, queueItems[index], "NowPlaying")] });
            }
        });

        return PlayingQueueStatus.Success;
    }

    //#endregion
    //#region Playback Controls

    /**
     * Toggles the playing status of the media player in a guild
     * @param guild The guild to toggle the playing status for
     * @param isPlaying Optionally, the playing status to toggle the media player to
     * @returns A promise that resolves when the playing status has been toggled
     */
    public static async toggleMediaPlayer(guild: Guild, isPlaying?: boolean): Promise<void> {
        const mediaPlayer = await this.getMediaPlayer(guild);
        if (mediaPlayer == null) return;

        const connection = getVoiceConnection(guild.id);
        if (connection == null) return;

        const connectionState = connection.state;
        if (connectionState.status !== VoiceConnectionStatus.Ready) return;
        if (!connectionState.subscription) return;
        const player = connectionState.subscription.player;

        if (isPlaying === undefined) {
            player.state.status === AudioPlayerStatus.Paused ? player.unpause() : player.pause();
        } else {
            isPlaying ? player.unpause() : player.pause();
        }

        await this.updateGPlaying(guild, player.state.status === AudioPlayerStatus.Playing);
    }

    /**
     * Skips the current song in the media player in a guild
     * @param guild The guild to skip the current song for
     * @returns A promise that resolves when the current song has started skipped
     */
    public static async skipMediaPlayer(guild: Guild): Promise<true | void> {
        const mediaPlayer = await this.getMediaPlayer(guild);
        if (mediaPlayer == null) return;

        const connection = getVoiceConnection(guild.id);
        if (connection == null) return;

        const connectionState = connection.state;
        if (connectionState.status !== VoiceConnectionStatus.Ready) return;
        if (!connectionState.subscription) return;
        const player = connectionState.subscription.player;

        player.stop();
        return true;
    }

    /**
     * Plays the previous song in the media player in a guild
     * @param guild The guild to play the previous song for
     * @returns A promise that resolves when the previous song has started played
     */
    public static async backMediaPlayer(guild: Guild): Promise<boolean | void> {
        const mediaPlayer = await this.getMediaPlayer(guild);
        if (mediaPlayer == null) return;

        const connection = getVoiceConnection(guild.id);
        if (connection == null) return;

        const connectionState = connection.state;
        if (connectionState.status !== VoiceConnectionStatus.Ready) return;
        if (!connectionState.subscription) return;
        const player = connectionState.subscription.player;


        mediaPlayer.playingIndex -= 2;
        if (mediaPlayer.playingIndex < -1) return false;
        await mediaPlayer.save();

        player.stop();
        return true;
    }
    //#endregion

    //#region Queue Controls

    /**
     * Pauses the media player in a guild
     * @param guild The guild to pause the media player for
     * @param maintainCurrentPlaying Optionally, whether or not to keep the playing song as the first song in the queue
     * @returns A promise that resolves with a boolean, indicating if the queue was full shuffled or not.
     *   - If the queue was full shuffled, it will resolve with `false`
     *   - If the queue was not full shuffled and playback was not disrupted, it will resolve with `true`
     */
    public static async shuffleQueue(guild: Guild, maintainCurrentPlaying = true): Promise<boolean | null> {
        const queueItems = await this.fetchGuildQueueItems(guild);
        if (queueItems.length <= 0) return null;

        if (maintainCurrentPlaying) {
            return await this.maintainCurrentlyPlayingShuffle(guild, queueItems);
        } else {
            await this.fullQueueShuffle(guild, queueItems);
            return false;
        }
    }

    private static async maintainCurrentlyPlayingShuffle(guild: Guild, queueItems: MediaQueueItem[]): Promise<boolean> {
        const playingIndex = await this.fetchPlayingIndex(guild);
        if (playingIndex < 0) {
            await this.fullQueueShuffle(guild, queueItems);
            return false;
        }

        const playingSong = queueItems[playingIndex];
        queueItems.splice(playingIndex, 1);

        let indexes = queueItems.map((queueItem) => queueItem.queuePosition);
        for (let i = 0; i < indexes.length; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }

        await playingSong.update({ queuePosition: 0 });
        await Promise.all(queueItems.map((queueItem, index) => queueItem.update({ queuePosition: indexes[index] + 1 })));
        await this.updateGPlayingIndex(guild, 0);
        return true;
    }

    private static async fullQueueShuffle(guild: Guild, queueItems: MediaQueueItem[]): Promise<void> {
        await this.toggleMediaPlayer(guild, false);

        let indexes = queueItems.map((queueItem) => queueItem.queuePosition);
        for (let i = 0; i < indexes.length; i++) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }

        await Promise.all(queueItems.map((queueItem, index) => queueItem.update({ queuePosition: indexes[index] })));

        await this.toggleMediaPlayer(guild, true);
        await this.updateGPlayingIndex(guild, -1);
        await this.skipMediaPlayer(guild);
    }
    //#endregion

    //#region Embed Generation
    /**
     * Generates an embed for a song
     * @param song The song to generate the embed for
     * @param type The type of embed to generate, either "AddedToQueue" or "NowPlaying"
     * @returns A promise that resolves to the generated embed for the song
     */
    public static async generateSongEmbed(client: Client, song: MediaQueueItem, type: "AddedToQueue" | "NowPlaying" = "NowPlaying"): Promise<EmbedBuilder> {
        const guild = await song.getGuild(client);

        const details = await song.getSongDetails();
        const requester = await song.getRequestor(client);

        switch (type) {
            case "AddedToQueue": {
                return new EmbedBuilder({
                    author: {
                        name: requester.displayName,
                        iconURL: requester.displayAvatarURL({ extension: "png", size: 1024 })
                    },
                    color: 0x69ff78,
                    title: "Song added to queue!",
                    description: `**[${details.title}](${details.url})** by **${details.artist}** has been added to the queue by **<@${requester.id}>**.`,
                    timestamp: Date.now()
                });
            }
            case "NowPlaying": {
                const connection = getVoiceConnection(guild.id);
                if (connection == null) throw new Error("No voice connection found");

                const connState = connection.state;
                if (connState.status !== VoiceConnectionStatus.Ready) throw new Error("Voice connection is not ready, which means nothing is playing.");
                if (!connState.subscription) throw new Error("No subscription found, which menas nothing is playing.");

                const player = connState.subscription.player;
                const playerState = player.state;
                if (playerState.status === AudioPlayerStatus.Idle) throw new Error("Player is not playing anything.");

                const playbackSeek = (playerState.status === AudioPlayerStatus.Buffering) ? 0 : Math.ceil(playerState.playbackDuration / 1000);
                const playbackDuration = details.duration;

                return new EmbedBuilder({
                    author: {
                        name: requester.displayName,
                        iconURL: requester.displayAvatarURL({ extension: "png", size: 1024 })
                    },
                    color: 0x69cfff,
                    title: "Currently Broadcasting",
                    description: "The current song that is being broadcasted is:\n" +
                        `**[${details.title}](${details.url})** by **${details.artist}**.\n` +
                        `**Duration:** ${playbackSeek} / ${playbackDuration} seconds (${Math.floor((playbackSeek / playbackDuration) * 100)}%)\n` +
                        `**Requested by:** **<@${requester.id}>**`,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Generates an embed for the now playing song
     * 
     * <b>NOTE:</b> This method is a shorthand for {@link Media.generateSongEmbed} with the type set to "NowPlaying"
     * @param guild The guild to generate the now playing embed for
     * @returns A promise that resolves to the generated embed for the now playing song
     */
    public static async generateNowPlayingEmbed(client: Client, guild: Guild): Promise<EmbedBuilder> {
        const queueItems = await this.fetchGuildQueueItems(guild);
        if (queueItems.length <= 0) throw new Error("No queue items found");

        const playingIndex = await this.fetchPlayingIndex(guild);
        if (playingIndex < 0) throw new Error("No playing index found");

        const song = queueItems[playingIndex];
        return this.generateSongEmbed(client, song, "NowPlaying");
    }

    /**
     * Generates an embed for the queue
     * @param guild The guild to generate the queue embed for
     * @param perPage The amount of songs per page
     * @param page The page to generate the queue embed for
     * @returns A promise that resolves to the generated embed for the queue
     */
    public static async generateQueueEmbed(guild: Guild, perPage = 10, page = 1): Promise<EmbedBuilder> {
        const queueItems = await this.fetchGuildQueueItems(guild);
        if (queueItems.length <= 0) throw new Error("No queue items found");
        if (perPage < 5 || perPage > 15) throw new Error("perPage must be between 5 and 15");

        let totalPages = Math.floor(queueItems.length / perPage) + (queueItems.length % perPage == 0 ? 0 : 1);

        const embed = new EmbedBuilder({
            color: 0x69cfff,
            title: "Current Queue",
            description: "Below is the upcoming queue of songs that will be played.\n\n",
            timestamp: Date.now(),
            footer: {
                text: `Page ${(page - 1) + 1} of ${totalPages} | ${queueItems.length} songs in queue | ${perPage} songs per page`
            }
        })

        let start = (page - 1) * perPage;
        let paginate = queueItems.slice(start, page * perPage);

        const songDetails = await Promise.all(paginate.map((queueItem) => queueItem.getSongDetails()));
        const playingIndex = await this.fetchPlayingIndex(guild);

        let fields = songDetails.map((details, index) => {
            let position = (start + index == playingIndex) ? "▶️" : `${start + index + 1}.`;
            return `**${position}** [${details.title}](${details.url}) by ${details.artist} - <@${paginate[index].requestorId}>`;
        });

        embed.setDescription(embed.data.description + fields.join("\n"));
        return embed;
    }
    //#endregion

    //#region On Startup / On Shutdown
    public static async onStartup(client: Client): Promise<void> {
        const data = await MediaPlayer.findAll();
        if (data.length <= 0) return;

        data.forEach(async (player) => {
            const guild = await player.fetchGuild(client);

            try {
                const voiceChannel = await player.fetchVoiceChannel(client);
                const textChannel = await player.fetchTextChannel(client);

                await this.updateGPlayingIndex(guild, player.playingIndex - 1); 

                console.log("voiceChannel", voiceChannel);
                console.log("textChannel", textChannel);

                const result = await this.startPlayingQueue(client, guild, voiceChannel, textChannel);
                switch (result) {
                    case PlayingQueueStatus.NoSongsInQueue: {
                        logWarn("[Media] No songs in the queue in " + guild.name + " (ID: " + guild.id + ") , disconnecting.");
                        await textChannel.send({ content: "No songs in the queue, disconnecting!" });
                        break;
                    }
                    case PlayingQueueStatus.EndOfQueue: {
                        logWarn("[Media] End of queue reached in " + guild.name + " (ID: " + guild.id + " , disconnecting.");
                        await textChannel.send({ content: "End of queue reached, disconnecting!" });
                        break;
                    }
                    case PlayingQueueStatus.Success: {
                        logInfo("[Media] Successfully restarted queue in " + guild.name + " (ID: " + guild.id + ") after restart");
                        break;
                    }
                }
            } catch (error) {
                logWarn("[Media] An error occured when restarting a media player in " + guild.name + " (ID: " + guild.id + "): " + error);
                logWarn(error);
                logWarn("[Media] Deleting the media player and all queue items.")

                await this.destroyMediaPlayer(guild);
                await this.removeAllQueueItems(guild);
            }
        });
    }

    public static async onShutdown(client: Client): Promise<void> {
        const data = await MediaPlayer.findAll();
        if (data.length <= 0) return;

        data.forEach(async (player) => {
            const guild = await player.fetchGuild(client);

            try {
                const textChannel = await player.fetchTextChannel(client);

                await textChannel.send({ content: "I've received a shutdown request. I'm disconnected, but I will be back after I return!" });
                logInfo("[Media] Successfully shut down media player in " + guild.name + " (ID: " + guild.id + ")");
            } catch (error) {
                logWarn("[Media] An error occured when shutting down a media player in " + guild.name + " (ID: " + guild.id + "): " + error);
                logWarn(error);
            }
        });

        return;
    }
    //#endregion
}

interface MPCreateOptions {
    guild: Guild;
    voiceChannel: VoiceBasedChannel;
    textChannel: MusicTextBasedChannel;

    playing?: boolean;
    playingIndex?: number;

    volume?: number;
    repeating?: RepeatingType;
}

interface MPUpdateOptions {
    voiceChannel?: VoiceBasedChannel;
    textChannel?: MusicTextBasedChannel;

    playing?: boolean;
    playingIndex?: number;

    volume?: number;
    repeating?: RepeatingType;
}