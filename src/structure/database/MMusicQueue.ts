import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";
import { Client, Guild, User } from "discord.js";

import provider from "play-dl";

export class MMusicQueue extends Model<InferAttributes<MMusicQueue>, InferCreationAttributes<MMusicQueue>> implements MMusicQueueAttributes {

    declare entryId: CreationOptional<number>;

    declare guildId: string;
    declare queuePosition: number;

    declare songUrl: string;
    declare requestorId: string;

    /**
     * Fetches the guild where this song was requested in.
     * @param client the discord client
     * @returns a promise that resolves with the guild
     */
    public fetchGuild(client: Client): Promise<Guild> {
        return client.guilds.fetch(this.guildId);
    }
    
    /**
     * Fetches the user who requested the song.
     * @param client the discord client
     * @returns a promise that resolves with the user
     */
    public fetchRequestor(client: Client): Promise<User> {
        return client.users.fetch(this.requestorId);
    }


    public async getSongProvider(): Promise<SongProvider> {
        if (!this.songUrl.startsWith("http://") || !this.songUrl.startsWith("https://")) return SongProvider.INVALID;
        
        const [spotifyData, soundcloudData, youtubeData] = await Promise.all([
            provider.sp_validate(this.songUrl),
            provider.so_validate(this.songUrl),
            provider.yt_validate(this.songUrl)
        ]);

        if (spotifyData && spotifyData !== "search") return SongProvider.SPOTIFY;
        if (soundcloudData && soundcloudData !== "search") return SongProvider.SOUNDCLOUD;
        if (youtubeData && youtubeData !== "search") return SongProvider.YOUTUBE;
        return SongProvider.INVALID;
    }

    public async isURLValid(): Promise<boolean> {
        return await this.getSongProvider() !== SongProvider.INVALID;
    }

    public static async initialize() {
        return MMusicQueue.init({
            entryId: {
                type: DataTypes.NUMBER,
                primaryKey: true
            },
            guildId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            queuePosition: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            songUrl: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            requestorId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            }
        }, {
            sequelize: sequelInstance,
            timestamps: true,
            createdAt: "requestedAt",
            tableName: "mediaQueue"
        });
    }
}

interface MMusicQueueAttributes {
    entryId: number; // unique ID

    guildId: string;
    queuePosition: number;

    songUrl: string;
    requestorId: string;
}

export enum SongProvider {
    YOUTUBE = "youtube",
    SOUNDCLOUD = "soundcloud",
    SPOTIFY = "spotify",
    INVALID = "invalid"
}