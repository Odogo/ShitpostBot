import { VoiceBasedChannel } from "discord.js";
import { MChannelFlex } from "../database/MChannelFlex";

export class ChannelFlex {

    public static async fetchChannelSettings(channel: VoiceBasedChannel): Promise<ChannelFlexSettings> {
        console.log(channel.id);
        const data = await MChannelFlex.findOne({ where: { channelId: channel.id } });
        if (data === null) return { channel, canRegionModify: false, canLimitModify: false };
        return { channel: channel, canRegionModify: data.canRegionModify, canLimitModify: data.canLimitModify };
    }

    public static async canModifyRegion(channel: VoiceBasedChannel): Promise<boolean> {
        return (await ChannelFlex.fetchChannelSettings(channel)).canRegionModify;
    }

    public static async canModifyLimit(channel: VoiceBasedChannel): Promise<boolean> {
        return (await ChannelFlex.fetchChannelSettings(channel)).canLimitModify;
    }

    public static async setChannelSettings(channel: VoiceBasedChannel, settings: SetChannelSettingsOptions): Promise<void> {
        await MChannelFlex.upsert({
            channelId: channel.id,
            canRegionModify: settings.canLimitModify,
            canLimitModify: settings.canLimitModify
        });
    }

    public static async setCanModifyRegion(channel: VoiceBasedChannel, canModify: boolean): Promise<void> {
        await MChannelFlex.upsert({
            channelId: channel.id,
            canRegionModify: canModify,
            canLimitModify: (await ChannelFlex.canModifyLimit(channel))
        });
    }

    public static async setCanModifyLimit(channel: VoiceBasedChannel, canModify: boolean): Promise<void> {
        await MChannelFlex.upsert({
            channelId: channel.id,
            canRegionModify: (await ChannelFlex.canModifyRegion(channel)),
            canLimitModify: canModify
        });
    }

    public static async deleteChannelSettings(channel: VoiceBasedChannel): Promise<void> {
        await MChannelFlex.destroy({ where: { channelId: channel.id } });
    }
}

interface ChannelFlexSettings {
    channel: VoiceBasedChannel;
    canRegionModify: boolean;
    canLimitModify: boolean;
}

interface SetChannelSettingsOptions {
    canRegionModify: boolean;
    canLimitModify: boolean;
}