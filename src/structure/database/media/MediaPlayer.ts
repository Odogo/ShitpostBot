import { DataTypes, InferAttributes, InferCreationAttributes, Model, CreationOptional } from 'sequelize';
import { sequelInstance } from '../../..';
import { Client, Guild, NewsChannel, StageChannel, TextChannel, VoiceBasedChannel, VoiceChannel } from 'discord.js';

export class MediaPlayer
    extends Model<InferAttributes<MediaPlayer>, InferCreationAttributes<MediaPlayer>>
    implements MediaPlayerAttributes {

    declare guildId: string;

    declare voiceChannelId: string;
    declare textChannelId: string;

    declare playing: CreationOptional<boolean>;
    declare playingIndex: CreationOptional<number>;

    declare volume: CreationOptional<number>;
    declare repeating: CreationOptional<RepeatingType>;

    /**
     * Fetches the guild associated with this player.
     * @param client the discord client
     * @returns a promise that resolves with the guild
     */
    public fetchGuild(client: Client): Promise<Guild> {
        return client.guilds.fetch(this.guildId);
    }

    /**
     * Fetches the voice channel associated with this player.
     * @param client the discord client
     * @returns a promise that resolves with the voice channel
     */
    public async fetchVoiceChannel(client: Client): Promise<VoiceBasedChannel> {
        return new Promise((resolve, reject) => {
            this.fetchGuild(client).then((guild) => {
                guild.channels.fetch(this.voiceChannelId).then(channel => {
                    if (channel == null) return reject("channel does not exist");
                    if (!channel.isVoiceBased()) return reject("channel is not of voice type");

                    resolve(channel);
                }).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Fetches the text channel associated with this player.
     * @param client the discord client
     * @returns a promise that resolves with the text channel
     */
    public async fetchTextChannel(client: Client): Promise<MusicTextBasedChannel> {
        return new Promise((resolve, reject) => {
            this.fetchGuild(client).then((guild) => {
                guild.channels.fetch(this.textChannelId).then(channel => {
                    if (channel == null) return reject("channel does not exist");
                    if (!channel.isTextBased()) return reject("channel is not of voice type");
                    if (channel.isThread()) return reject("channel is a thread");

                    resolve(channel);
                }).catch(reject);
            }).catch(reject);
        });
    }

    public static async initialize() {
        return MediaPlayer.init({
            guildId: {
                type: DataTypes.STRING,
                primaryKey: true
            },
            voiceChannelId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            textChannelId: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: false
            },
            playing: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            playingIndex: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: -1
            },
            volume: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1
            },
            repeating: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "NoRepeat"
            }
        }, {
            sequelize: sequelInstance,
            tableName: "mediaPlayer",
            timestamps: false
        });
    }
}

interface MediaPlayerAttributes {
    guildId: string; // primary key

    voiceChannelId: string;
    textChannelId: string;

    playing: boolean;
    playingIndex: number;

    volume: number;
    repeating: RepeatingType;
}

export enum RepeatingType {
    NoRepeat = "NoRepeat",
    Song = "Song",
    Playlist = "Playlist"

}

export type MusicTextBasedChannel = NewsChannel | StageChannel | TextChannel | VoiceChannel;