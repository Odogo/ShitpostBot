import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../modules/Logging";
import { logWarn } from "../../system";

export default new KEvent(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if(oldMsg.partial) oldMsg = await oldMsg.fetch();
    if(newMsg.partial) newMsg = await newMsg.fetch();

    if(oldMsg.author?.bot || newMsg.author?.bot) return;
    if(oldMsg.content === newMsg.content) return;

    let guild = oldMsg.guild || newMsg.guild;
    if(guild == null) {
        logWarn("Failed to find guild for message, ignoring!");
        return;
    }

    if(await isTypeLogged(guild, LoggingConfigType.MessageEdited)) {
        let channelId = await isCategoryLogged(guild, LoggingConfigCategory.MessageEvents);
        if(channelId === undefined) return;

        await guild.channels.fetch(channelId).then(async (channel) => {
            if(channel !== null && channel.isTextBased()) {
                const embed = new EmbedBuilder({
                    color: 0x7dffc7,
                    description: `[Message](${newMsg.url}) by <@${newMsg.author.id}> was **edited!**`,
                    fields: [
                        { name: "Channel", value: "<#" + newMsg.channel.id + ">"},
                        { name: "Previous Message", value: oldMsg.content },
                        { name: "Modified Message", value: newMsg.content }
                    ],
                    author: {
                        name: oldMsg.author?.username,
                        icon_url: oldMsg.author?.avatarURL({ size: 4096, extension: 'png' })
                    },
                    timestamp: Date.now(),
                });

                embed.data.fields
        
                await channel.send({ embeds: [embed] });
            } else {
                logWarn("Failed to post log attempt (found channel): " + channel + " [channel object]");
            }
        }).catch((reason) => {
            logWarn("Failed to post log attempt: " + reason);
        });
    }
});