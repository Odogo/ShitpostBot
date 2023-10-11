import { KEvent } from "../../classes/KEvent";
import { logDebug, logWarn } from "../../system";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../modules/Logging";
import { EmbedBuilder, Events } from "discord.js";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(msg.partial) {
        msg = await msg.fetch(true);
    }

    if(msg.author.bot) return;

    if(await isTypeLogged(msg.guild, LoggingConfigType.MessageDelete)) {
        let channelId = await isCategoryLogged(msg.guild, LoggingConfigCategory.MessageEvents);
        if(channelId === undefined) return;
        
        await msg.guild.channels.fetch(channelId).then(async (channel) => {
            if(channel !== null && channel.isTextBased()) {
                const embed = new EmbedBuilder({
                    color: 0x7dffc7,
                    description: `[Message](${msg.url}) by <@${msg.author.id}> was **deleted!**`,
                    fields: [
                        { name: "Channel", value: "<#" + msg.channel.id + ">"},
                        { name: "Contents", value: msg.content },
                    ],
                    author: {
                        name: msg.author?.username,
                        icon_url: msg.author?.avatarURL({ size: 4096, extension: 'png' })
                    },
                    timestamp: Date.now(),
                });
                
                await channel.send({ embeds: [embed]});
            } else {
                logWarn("Failed to post log attempt (found channel): " + channel + " [channel object]");
            }
        }).catch((reason) => {
            logWarn("Failed to post log attempt: " + reason);
        });
    }
});