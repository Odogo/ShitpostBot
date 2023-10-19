import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";

import { KEvent } from "../../classes/KEvent";
import { logWarn } from "../../system";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(msg.partial) {
        await msg.fetch(true)
            .then((newMsg) => { msg = newMsg; })
            .catch(logWarn);
    }

    if(msg.guild === null || msg.author === null|| msg.content === null) return;
    if(msg.author.bot) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(msg.guild, LoggingConfigType.MessageDelete);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(msg.guild, LoggingConfigCategory.MessageEvents);

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "**Message deleted**",
            author: {
                name: msg.author.displayName,
                icon_url: msg.author.displayAvatarURL({ size: 2048, extension: 'png' })
            },
            fields: [
                { name: "In channel", value: "<#" + msg.channel.id + ">" },
                { name: "Message Contents", value: (msg.content.length >= 1024 - 3 ? msg.content.substring(0, 1024-3) + "...": msg.content)}
            ],
            timestamp: Date.now()
        });

        if(msg.attachments.size >= 1) {
            let attachments = "";
            for(let i = 0; i < msg.attachments.size; i++) {
                let url = msg.attachments.at(i)?.url;
                if(url === undefined) continue;

                if(attachments.length + url.length >= 1024) {
                    attachments += "And " + (msg.attachments.size - i) + " more...";
                    break;
                } else {
                    attachments += url + " \n";
                }
            }

            embed.addFields({ name: "Attachments", value: attachments });
        }

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Event MSGDEL] [Logging] [GID: " + msg.guild.id + "] Failed to log: " + error);
        console.log(error);
    }
});