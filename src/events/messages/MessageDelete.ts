import { KEvent } from "../../classes/KEvent";
import { ChannelType, EmbedBuilder, Events } from 'discord.js';
import { logWarn } from "../../system";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../modules/Logging";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(msg.author?.bot) return;
    if(msg.guild === null) return;

    if(await isTypeLogged(msg.guild, LoggingConfigType.MessageDelete)) {
        let channelId = await isCategoryLogged(msg.guild, LoggingConfigCategory.MessageEvents);
        if(channelId === undefined) return;

        await msg.guild.channels.fetch(channelId).then(async (channel) => {
            if(channel !== null && channel.isTextBased()) {
                
            } else {
                logWarn("Failed to post log attempt (found channel): " + channel + " [channel object]");
            }
        }).catch((reason) => {
            logWarn("Failed to post log attempt: " + reason);
        });
    }
});