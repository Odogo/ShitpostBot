import { DataTypes, InferAttributes, InferCreationAttributes, Model, CreationOptional } from 'sequelize';
import { sequelInstance } from '../..';

export class MMusicPlayer extends Model<InferAttributes<MMusicPlayer>, InferCreationAttributes<MMusicPlayer>> implements MMusicPlayerAttributes {

    declare guildId: string;

    declare voiceChannelId: string;
    declare textChannelId: string;

    declare playing: CreationOptional<boolean>;
    declare volume: CreationOptional<number>;

    declare repeating: CreationOptional<RepeatingType>;

    public static async initialize() {
        return MMusicPlayer.init({
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
            volume: {
                type: DataTypes.NUMBER,
                allowNull: false,
                defaultValue: 1
            },
            repeating: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: "NoRepeat"
            }
        }, {
            sequelize: sequelInstance
        });
    }
}

interface MMusicPlayerAttributes {
    guildId: string; // primary key

    voiceChannelId: string;
    textChannelId: string;

    playing: boolean;
    volume: number;

    repeating: RepeatingType;
}

export type RepeatingType = "NoRepeat" | "Song" | "Playlist";