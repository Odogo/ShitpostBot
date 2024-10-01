import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model, Op } from "sequelize";
import { Client, Guild, User } from "discord.js";
import provider, { SoundCloudTrack, SpotifyTrack, YouTubeVideo } from "play-dl";

import { sequelInstance as sequelize } from '../../..';

export class MediaQueueItem
    extends Model<InferAttributes<MediaQueueItem>, InferCreationAttributes<MediaQueueItem>>
    implements MediaQueueItemAttributes {

    declare entryId: CreationOptional<number>;
    declare guildId: string;
    declare requestorId: string;

    declare songUrl: string;
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
     * Fetches the source of the queue item
     * @returns A promise that resolves with the source of the queue item
     */
    public async getQueueItemSource(): Promise<QueueItemSource> {
        return (await MediaQueueItem.verifyURL(this.songUrl))[0];
    }

    /**
     * Fetches the type of the queue item
     * @returns A promise that resolves with the type of the queue item
     */
    public async getQueueItemType(): Promise<QueueItemType> {
        return (await MediaQueueItem.verifyURL(this.songUrl))[1];
    }

    /**
     * Fetches the details of the song in the queue item
     * @returns A promise that resolves with the details of the song in the queue item
     */
    public async getSongDetails(): Promise<QueueItemSong> {
        if (this.songUrl === "") throw new MediaParsingError("Song URL is empty");

        // const type = await this.getQueueItemType();
        // if (type === QueueItemType.ALBUM || type === QueueItemType.PLAYLIST) throw new MediaParsingError("Invalid URL provided: Expected a song, got a playlist or album instead");

        const source = await this.getQueueItemSource();
        switch (source) {
            case QueueItemSource.SPOTIFY: {
                if (provider.is_expired()) await provider.refreshToken(); // Refresh the token if it's expired
                const song = await provider.spotify(this.songUrl) as SpotifyTrack;
                return MediaQueueItem.mapSong(song, this.queuePosition);
            }
            case QueueItemSource.SOUNDCLOUD: {
                const song = await provider.soundcloud(this.songUrl) as SoundCloudTrack;
                return MediaQueueItem.mapSong(song, this.queuePosition);
            }
            case QueueItemSource.YOUTUBE: {
                const song = await provider.video_info(this.songUrl);
                return MediaQueueItem.mapSong(song.video_details, this.queuePosition);
            }
            default: throw new MediaParsingError("Invalid source provided");
        }
    }

    /**
     * Generates a stream for the song in the queue item to be played
     * @returns A promise that resolves with a stream for the song in the queue item
     */
    public async generateStream() {
        if (this.songUrl === "") throw new MediaParsingError("Song URL is empty");

        const source = await this.getQueueItemSource();
        switch (source) {
            case QueueItemSource.SPOTIFY: {
                if (provider.is_expired()) await provider.refreshToken(); // Refresh the token if it's expired
                const song = await provider.spotify(this.songUrl) as SpotifyTrack;

                const search = await provider.search(song.name + " " + song.artists.map(artist => artist.name).join(" "), { limit: 1 });
                const stream = await provider.stream(search[0].url, { discordPlayerCompatibility: true, quality: 2 });
                return stream.stream;
            }
            case QueueItemSource.SOUNDCLOUD:
            case QueueItemSource.YOUTUBE: {
                return (await provider.stream(this.songUrl, { discordPlayerCompatibility: true, quality: 2 })).stream;
            }
            default: throw new MediaParsingError("Invalid source provided");
        }
    }

    /**
     * Initializes the database table for {@link MediaQueueItem}
     * @returns A promise that resolves when the database table has been initialized
     */
    public static async initialize() {
        return MediaQueueItem.init({
            entryId: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true
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
            queuePosition: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: false
            },
        }, {
            sequelize: sequelize,
            timestamps: true,
            createdAt: "requestedAt",
            tableName: "mediaQueue",
            hooks: {
                // Prevent invalid URLs from being added to the database
                beforeCreate: async (instance, options) => {
                    let [source, type] = await MediaQueueItem.verifyURL(instance.songUrl);
                    if (source === QueueItemSource.INVALID || type === QueueItemType.INVALID) {
                        throw new Error("Invalid URL provided");
                    }
                },

                // After a destory, we need to shift the queue positions of all items after the deleted item
                afterDestroy: async (instance, options) => {
                    const queueItems = await MediaQueueItem.findAll({
                        where: {
                            guildId: instance.guildId,
                            queuePosition: {
                                [Op.gt]: instance.queuePosition
                            }
                        },
                        transaction: options.transaction
                    });

                    await Promise.all(queueItems.map(async (queueItem) => {
                        queueItem.queuePosition -= 1;
                        await queueItem.save({ transaction: options.transaction });
                    }));
                }
            }
        });
    }

    /**
     * Verifies the URL provided is a valid media source and type
     * @param url The URL to verify
     * @returns A promise that resolves with the source and type of the URL
     */
    public static async verifyURL(url: string): Promise<[QueueItemSource, QueueItemType]> {
        if (!url) return [QueueItemSource.INVALID, QueueItemType.INVALID];
        if (!url.startsWith("https://") && !url.startsWith("http://")) return [QueueItemSource.INVALID, QueueItemType.INVALID];

        let [
            spValidate,
            soValidate,
            ytValidate
        ] = await Promise.all([
            provider.sp_validate(url),
            provider.so_validate(url),
            provider.yt_validate(url)
        ]).then(([sp, so, yt]) => [sp, so, yt])
            .catch((reason) => {
                throw new MediaParsingError("Failed to validate URL: " + reason.message || "Unknown error")
            });

        switch (true) {
            case spValidate && spValidate === "track":
                return [QueueItemSource.SPOTIFY, QueueItemType.SONG];
            case spValidate && spValidate === "playlist":
                return [QueueItemSource.SPOTIFY, QueueItemType.PLAYLIST];
            case spValidate && spValidate === "album":
                return [QueueItemSource.SPOTIFY, QueueItemType.ALBUM];
            case soValidate && soValidate === "track":
                return [QueueItemSource.SOUNDCLOUD, QueueItemType.SONG];
            case soValidate && soValidate === "playlist":
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
     * Maps a song to a {@link QueueItemSong}
     * @param song The song to map
     * @param queueIndex The index of the song in the queue
     * @returns The song mapped to a {@link QueueItemSong}
     */
    public static mapSong(song: SpotifyTrack | SoundCloudTrack | YouTubeVideo, queueIndex: number): QueueItemSong {
        switch (true) {
            case song instanceof SpotifyTrack: {
                return {
                    title: song.name,
                    artist: song.artists.map(artist => artist.name).join(", ") || "Unknown",
                    duration: song.durationInMs / 1000,
                    source: QueueItemSource.SPOTIFY,
                    url: song.url,
                    queueIndex: queueIndex
                };
            }
            case song instanceof SoundCloudTrack: {
                return {
                    title: song.name,
                    artist: song.publisher?.name || song.publisher?.artist || "Unknown",
                    duration: song.durationInMs / 1000,
                    source: QueueItemSource.SOUNDCLOUD,
                    url: song.url,
                    queueIndex: queueIndex
                };
            }
            case song instanceof YouTubeVideo: {
                return {
                    title: song.title || "Unable to fetch title",
                    artist: song.channel?.name || "Unknown",
                    duration: song.durationInSec,
                    source: QueueItemSource.YOUTUBE,
                    url: song.url,
                    queueIndex: queueIndex
                };
            }
            default: throw new MediaParsingError("[Unreachable] Invalid song type")
        }
    }
}

interface MediaQueueItemAttributes {
    entryId: number; // unique ID

    guildId: string;
    requestorId: string;

    songUrl: string;
    queuePosition: number;
}

export interface QueueItemSong {
    title: string;
    artist: string;
    duration: number;

    source: QueueItemSource;
    url: string;

    queueIndex: number;
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

export class MediaParsingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MediaParsingError";
    }
}