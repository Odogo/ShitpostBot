import { DataTypes, Model } from "sequelize";
import { seqInstance } from "../..";

export class ServerQueueModel extends Model {
    declare guildId: string;

    declare queueList: string;
    declare queueIndex: number;

    declare textChannelId: string;
    declare voiceChannelId: string;

    declare isPlaying: boolean;
    declare playbackVolume: number;

    declare isRepeating: boolean;
    declare repeatState: "single" | "list";
    
    public static async initialize() {
        return ServerQueueModel.init({
            // -- identifiers --
            guildId: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },

            // -- data --
            // queue
            queueList: { type: DataTypes.JSON },
            queueIndex: { type: DataTypes.NUMBER, allowNull: false, defaultValue: -1 },

            // channels
            textChannelId: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
            voiceChannelId: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
            
            // playback
            isPlaying: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            playbackVolume: { type: DataTypes.NUMBER, allowNull: false, defaultValue: 2 },

            // repeating
            isRepeating: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            repeatState: { type: DataTypes.STRING, allowNull: false, defaultValue: "single", values: ["single", "list"]}
        }, {
            tableName: "serverQueue",
            timestamps: false,
            sequelize: seqInstance
        });
    }
}