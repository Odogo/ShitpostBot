import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelInstance } from "../..";
import { Channel, Client, StageChannel, VoiceChannel } from "discord.js";
import { logWarn } from "../../system";

export class MChannelFlex
    extends Model<InferAttributes<MChannelFlex>, InferCreationAttributes<MChannelFlex>>
    implements ChannelFlexAttributes {
    
    declare channelId: string;
    declare canRegionModify: boolean;
    declare canLimitModify: boolean;

    public async fetchChannel(client: Client): Promise<Channel> {
        const result = await client.channels.fetch(this.channelId);
        if (result === null) {
            logWarn("[Model: ChannelFlex] Channel " + this.channelId + " could not be fetched, it may have been deleted.");
            logWarn("Deleting ChannelFlex entry for " + this.channelId + "...");
            await this.destroy();
            throw new Error("Channel " + this.channelId + " could not be fetched, it may have been deleted.");
        }

        if (!(result instanceof VoiceChannel || result instanceof StageChannel)) {
            logWarn("[Model: ChannelFlex] Channel " + this.channelId + " is not a voice channel, deleting ChannelFlex entry...");
            await this.destroy();
            throw new Error("Channel " + this.channelId + " is not a voice channel, deleting ChannelFlex entry...");
        }

        return result;
    }

    public static async initialize() {
        return MChannelFlex.init({
            channelId: {
                type: DataTypes.STRING,
                primaryKey: true,
                unique: true
            },
            canRegionModify: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            canLimitModify: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        }, {
            sequelize: sequelInstance,
            tableName: "channelFlex",
            timestamps: false
        });
    }
}

interface ChannelFlexAttributes {
    channelId: string;
    canRegionModify: boolean;
    canLimitModify: boolean;
}