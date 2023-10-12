import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../modules/Logging";
import { logWarn } from "../../system";

export default new KEvent(Events.MessageBulkDelete, async (msgs, channel) => {
    let guild = channel.guild;

    if(await isTypeLogged(guild, LoggingConfigType.MessagePurged)) {
        let logChannelId = await isCategoryLogged(guild, LoggingConfigCategory.MessageEvents);
        if(logChannelId == undefined) return;

        await guild.channels.fetch(logChannelId).then(async (logChannel) => {
            if(logChannel != null && logChannel.isTextBased()) {
                const embed = new EmbedBuilder({
                    color: 0x7dffc7,
                    description: msgs.size + " was deleted (in bulk) from <#" + channel.id + ">",
                    fields: [
                        { name: "", value: ""}
                    ],
                    author: {
                        name: guild.members.me.displayName,
                        icon_url: guild.members.me.avatarURL({ size: 4096, extension: "png" })
                    }
                });

                await logChannel.send({ embeds: [embed] });
            } else {
                logWarn("Failed to post log attempt (found channel): " + channel + " [channel object]");
            }
        }).catch((reason) => {
            logWarn("Failed to post log attempt: " + reason);
        });
    }
});