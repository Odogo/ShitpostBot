import { KEvent } from "../../classes/KEvent";
import { EmbedBuilder, Events } from 'discord.js';
import { LoggingType, fetchLoggingChannel, isLoggingEnabled } from "../../modules/Logging";
import { logWarn } from "../../system";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(await isLoggingEnabled(msg.guild, LoggingType.MessageEvents)) {
        let channel = await fetchLoggingChannel(msg.guild, LoggingType.MessageEvents);
        if(channel.isTextBased()) {
            const embed = new EmbedBuilder({
                color: 0x7dffc7,
                title: "Message Deleted",
                fields: [
                    { name: "In channel", value: "<#" + msg.channel.id + ">" },
                    { name: "Contents", value: msg.content },
                ],
                author: {
                    name: msg.author.username,
                    icon_url: msg.author.avatarURL({ size: 4096, extension: 'png' })
                }
            });
            
            await channel.send({ embeds: [embed]});
        } else {
            logWarn("The given channel for type " + LoggingType.MessageEvents + " was not a text based channel.");
        }
    }
});