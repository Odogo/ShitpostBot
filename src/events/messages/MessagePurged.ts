import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { LoggingConfigCategory, LoggingConfigType, isCategoryLogged, isTypeLogged } from "../../modules/Logging";
import { logWarn } from "../../system";
import { client } from "../..";

export default new KEvent(Events.MessageBulkDelete, async (msgs, channel) => {
    let guild = channel.guild;

    if(await isTypeLogged(guild, LoggingConfigType.MessagePurged)) {
        let logChannelId = await isCategoryLogged(guild, LoggingConfigCategory.MessageEvents);
        if(logChannelId == undefined) return;

        await guild.channels.fetch(logChannelId).then(async (logChannel) => {
            if(logChannel != null && logChannel.isTextBased()) {
                const embed = new EmbedBuilder({
                    color: 0x7dffc7,
                    description: msgs.size + " messages were deleted (in bulk) from <#" + channel.id + ">",
                    author: {
                        name: guild.members.me.displayName,
                        icon_url: client.user.avatarURL({ extension: 'png', size: 4096 })
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