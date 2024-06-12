import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";
import { Client, Guild, User } from "discord.js";

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
    public async fetchGuild(client: Client): Promise<Guild> {
        return client.guilds.fetch(this.guildId);
    }
    
    /**
     * Fetches the user who requested the song.
     * @param client the discord client
     * @returns a promise that resolves with the user
     */
    public async fetchRequestor(client: Client): Promise<User> {
        return client.users.fetch(this.requestorId);
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