import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { Client, Guild, User } from "discord.js";
import { Readable } from "stream";

import provider, { SoundCloudPlaylist, SoundCloudTrack, SpotifyAlbum, SpotifyPlaylist, SpotifyTrack, YouTubeVideo } from "play-dl";

import { sequelInstance } from "../..";
import { logError } from "../../system";

export class MediaQueueItem
    extends Model<InferAttributes<MediaQueueItem>, InferCreationAttributes<MediaQueueItem>>
    implements MediaQueueItemAttributes {

    declare entryId: CreationOptional<number>;
    declare guildId: string;
    declare requestorId: string;

    declare songUrl: string;
    declare playlistPosition: CreationOptional<number>;
    declare queuePosition: number;

    /**
     * Fetches the guild that this queue item belongs to
     * @param client The client to fetch the guild with
     * @returns A promise that resolves with the guild that this queue item belongs to
     */
    public async getGuild(client: Client): Promise<Guild> {
        return client.guilds.fetch(this.guildId);
    }

    /**
     * Fetches the user that requested this queue item
     * @param client The client to fetch the user with
     * @returns A promise that resolves with the user that requested this queue item
     */
    public async getRequestor(client: Client): Promise<User> {
        return client.users.fetch(this.requestorId);
    }
    
    /**
     * Fetches the source and type of the queue item
     * @returns A promise that resolves with the source and type of the queue item
     */
    private async getQueueItemData(): Promise<[QueueItemSource, QueueItemType]> {
        if (!this.songUrl) return [QueueItemSource.INVALID, QueueItemType.INVALID];
        if (!this.songUrl.startsWith("http://") && !this.songUrl.startsWith("https://")) return [QueueItemSource.INVALID, QueueItemType.INVALID];
        
        let [
            spValidate,
            scValidate,
            ytValidate
        ] = await Promise.all([
            provider.sp_validate(this.songUrl),
            provider.so_validate(this.songUrl),
            provider.yt_validate(this.songUrl)
        ]);
        
        // Prevent all searches from being done, as we've checked that the URL is valid (contains "http://" or "https://" and is not empty)
        switch (true) {
            case spValidate && spValidate === "track":
                return [QueueItemSource.SPOTIFY, QueueItemType.SONG];
            case spValidate && spValidate === "playlist":
                return [QueueItemSource.SPOTIFY, QueueItemType.PLAYLIST];
            case spValidate && spValidate === "album":
                return [QueueItemSource.SPOTIFY, QueueItemType.ALBUM];
            case scValidate && scValidate === "track":
                return [QueueItemSource.SOUNDCLOUD, QueueItemType.SONG];
            case scValidate && scValidate === "playlist":
                return [QueueItemSource.SOUNDCLOUD, QueueItemType.PLAYLIST];
            case ytValidate && ytValidate === "video":
                return [QueueItemSource.YOUTUBE, QueueItemType.SONG];
            case ytValidate && ytValidate === "playlist":
                return [QueueItemSource.YOUTUBE, QueueItemType.PLAYLIST];
            default:
                return [QueueItemSource.INVALID, QueueItemType.INVALID];
        }
    }

    /**
     * Fetches the source of the queue item
     * @returns A promise that resolves with the source of the queue item
     */
    public async getQueueItemSource(): Promise<QueueItemSource> {
        return (await this.getQueueItemData())[0];
    }

    /**
     * Fetches the type of the queue item
     * @returns A promise that resolves with the type of the queue item
     */
    public async getQueueItemType(): Promise<QueueItemType> {
        return (await this.getQueueItemData())[1];
    }

    /**
     * Maps a Spotify track to a {@link QueueItemSong}
     * @param song The Spotify track to map
     * @returns The mapped {@link QueueItemSong}
     */
    private mapSpotifyTrack(song: SpotifyTrack): QueueItemSong {
        return {
            title: song.name,
            artist: song.artists.join(", "),
            duration: song.durationInSec,
            source: QueueItemSource.SPOTIFY,
            url: song.url
        };
    }

    /**
     * Fetches Spotify data for the given URL
     * 
     * If the URL is a playlist or album, the promise will resolve with an array of {@link QueueItemSong}s
     * @param url The URL to fetch Spotify data for
     * @returns A promise that resolves with the fetched Spotify data
     */
    private async fetchSpotifyData(url: string): Promise<Array<QueueItemSong> | QueueItemSong> {
        // Check if the provider is expired and refresh the token if it is
        if (provider.is_expired()) await provider.refreshToken();

        const spotifyData = await provider.spotify(url);
        if (spotifyData instanceof SpotifyAlbum || spotifyData instanceof SpotifyPlaylist) {
            const allTracks = await spotifyData.all_tracks();
            return allTracks.map(this.mapSpotifyTrack);
        } else {
            return this.mapSpotifyTrack(spotifyData);
        }
    }

    /**
     * Maps a SoundCloud track to a {@link QueueItemSong}
     * 
     * If the publisher is not available, it will be set to "Unknown"
     * @param song The SoundCloud track to map
     * @returns The mapped {@link QueueItemSong}
     */
    private mapSoundCloudTrack(song: SoundCloudTrack): QueueItemSong {
        return {
            title: song.name,
            artist: song.publisher?.name || "Unknown",
            duration: song.durationInSec,
            source: QueueItemSource.SOUNDCLOUD,
            url: song.url
        };
    }
    
    /**
     * Fetches SoundCloud data for the given URL
     * 
     * If the URL is a playlist, the promise will resolve with an array of {@link QueueItemSong}s
     * @param url The URL to fetch SoundCloud data for
     * @returns A promise that resolves with the fetched SoundCloud data
     */
    private async fetchSoundCloudData(url: string): Promise<Array<QueueItemSong> | QueueItemSong> {
        const soundcloudData = await provider.soundcloud(url);
        if (soundcloudData instanceof SoundCloudPlaylist) {
            const allTracks = await soundcloudData.all_tracks();
            return allTracks.map(this.mapSoundCloudTrack);
        } else {
            return this.mapSoundCloudTrack(soundcloudData);
        }
    }

    /**
     * Maps a YouTube video to a {@link QueueItemSong}
     * 
     * If the title is not available, it will be set to "Unable to fetch title"
     * 
     * If the artist is not available, it will be set to "Unknown"
     * @param song The YouTube video to map
     * @returns The mapped {@link QueueItemSong}
     */
    private mapYouTubeVideo(song: YouTubeVideo): QueueItemSong {
        return {
            title: song.title || "Unable to fetch title",
            artist: song.channel?.name || "Unknown",
            duration: song.durationInSec,
            source: QueueItemSource.YOUTUBE,
            url: song.url
        };
    }

    /**
     * Fetches YouTube data for the given URL
     * 
     * If the URL is a playlist, the promise will resolve with an array of {@link QueueItemSong}s
     * @param url The URL to fetch YouTube data for
     * @returns A promise that resolves with the fetched YouTube data
     */
    private async fetchYouTubeData(url: string): Promise<Array<QueueItemSong> | QueueItemSong | QueueItemType.INVALID> {
        const type = await this.getQueueItemType();
        if(type === QueueItemType.SONG) {
            let ytData = (await provider.video_basic_info(url)).video_details;
            return this.mapYouTubeVideo(ytData);
        } else if (type === QueueItemType.PLAYLIST) {
            let ytPlaylistData = await provider.playlist_info(url);
            return (await ytPlaylistData.all_videos()).map(this.mapYouTubeVideo);
        } else {
            return QueueItemType.INVALID;
        }
    }

    /**
     * The cache for the songs of the queue item, if any.
     * 
     * We cache the songs to prevent unnecessary API calls to the provider when the songs are already fetched.
     * 
     * If the cache needs to be refreshed, the {@link getSongs} method can be called with the `force` parameter set to `true`.
     */
    private songCache: Array<QueueItemSong> | QueueItemSong | QueueItemType.INVALID | null = null;

    /**
     * Fetches the songs of the queue item and caches them for future use if the cache is null or if the cache needs to be refreshed.
     * 
     * If the cache is not null and the `force` parameter is not set to `true`, the cache will be returned.
     * @param force Whether to force a refresh of the cache
     * @returns A promise that resolves with the songs of the queue item or {@link QueueItemType.INVALID} if the queue item is invalid
     */
    public async getSongs(force?: boolean): Promise<Array<QueueItemSong> | QueueItemSong | QueueItemType.INVALID> {
        // If the song cache is not null and we're not forcing a refresh, return the cache
        if (this.songCache && !force) return this.songCache;
        // If the song cache is null or we're forcing a refresh, fetch the songs

        // Fetch the source and type of the queue item
        let [source, type] = await this.getQueueItemData();

        // If the type is invalid, return the cache as invalid
        if (type === QueueItemType.INVALID) return this.songCache = QueueItemType.INVALID;

        // Fetch the songs based on the source of the queue item and set the cache
        try {
            switch (source) {
                case QueueItemSource.SPOTIFY:
                    return this.songCache = await this.fetchSpotifyData(this.songUrl);
                case QueueItemSource.SOUNDCLOUD:
                    return this.songCache = await this.fetchSoundCloudData(this.songUrl);
                case QueueItemSource.YOUTUBE:
                    return this.songCache = await this.fetchYouTubeData(this.songUrl);
                default:
                    return this.songCache = QueueItemType.INVALID;
            }
        } catch (e) {
            logError("An error occurred while fetching song data for queue item " + this.entryId + "!");
            logError(e);
            return this.songCache = QueueItemType.INVALID;
        }
    }

    /**
     * Fetches the number of songs in the queue item
     * @returns A promise that resolves with the number of songs in the queue item
     * - If the queue item is a playlist or album, the promise will resolve with the number of songs in the playlist or album
     * - If the queue item is a song, the promise will resolve with 1
     * - If the queue item is invalid, the promise will resolve with -1
     */
    public async getSongCount(): Promise<number> {
        const songs = await this.getSongs();
        return Array.isArray(songs) ? songs.length : songs === QueueItemType.INVALID ? -1 : 1;
    }

    private readonly streamOptions = { discordPlayerCompatibility: true }

    /**
     * Streams the queue item at the given playlist index
     * @param playlistIndex The index of the playlist to stream
     * @returns A promise that resolves with the stream of the queue item or null if the queue item is invalid
     */
    public async stream(playlistIndex = this.playlistPosition): Promise<Readable | null> {
        const songs = await this.getSongs();
        if (songs === QueueItemType.INVALID) return null;

        if(playlistIndex < 0 || playlistIndex >= (await this.getSongCount())) return null;

        if (Array.isArray(songs)) {
            return this.handleStream(songs[playlistIndex]);
        } else {
            return this.handleStream(songs);
        }
    }

    /**
     * Handles the streaming of the queue item based on the source
     * 
     * If the source is Spotify, the song will be searched for and streamed
     * @param song The song to stream
     * @returns
     */
    private async handleStream(song: QueueItemSong): Promise<Readable | null> {
        switch (song.source) {
            case QueueItemSource.YOUTUBE || QueueItemSource.SOUNDCLOUD: {
                return (await provider.stream(song.url, this.streamOptions)).stream;
            }
                
            // Since Spotify is cringe, we have to handle it differently.
            case QueueItemSource.SPOTIFY: {
                return (await provider.stream(provider.search(song.title + " " + song.artist, { limit: 1 })[0].url, this.streamOptions)).stream;
            }
                
            default: return null;
        }
    }

    /**
     * Initializes the database table for {@link MediaQueueItem}
     * @returns A promise that resolves when the database table has been initialized
     */
    public static async initialize() {
        return MediaQueueItem.init({
            entryId: {
                type: DataTypes.NUMBER,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            requestorId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            songUrl: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            playlistPosition: {
                type: DataTypes.NUMBER,
                allowNull: false,
                defaultValue: 0
            },
            queuePosition: {
                type: DataTypes.NUMBER,
                allowNull: false,
                unique: false
            },
        }, {
            sequelize: sequelInstance,
            timestamps: true,
            createdAt: "requestedAt",
            tableName: "mediaQueue"
        });
    }
}

interface MediaQueueItemAttributes {
    entryId: number; // unique ID

    guildId: string;
    requestorId: string;

    songUrl: string;
    playlistPosition: number;
    queuePosition: number;
}

export interface QueueItemSong {
    title: string;
    artist: string;
    duration: number;

    source: QueueItemSource;

    url: string;
}

export enum QueueItemSource {
    YOUTUBE = "youtube",
    SOUNDCLOUD = "soundcloud",
    SPOTIFY = "spotify",
    INVALID = "invalid"
}

export enum QueueItemType {
    SONG = "song",
    PLAYLIST = "playlist",
    ALBUM = "album",
    INVALID = "invalid"
}