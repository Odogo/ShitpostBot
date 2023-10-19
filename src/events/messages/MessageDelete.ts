import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { logWarn } from "../../system";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(msg.guild === null) return;
    if(msg.author === null) return;
    if(msg.author.bot) return;
    if(msg.content === null) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(msg.guild, LoggingConfigType.MessageDelete);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(msg.guild, LoggingConfigCategory.MessageEvents);

        let auditLogs = await msg.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete });
        let auditEntry = auditLogs.entries.first();
        if(auditEntry === undefined) return;
        const executor = auditEntry.executor;
        if(executor === null) return;

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "**Message deleted**",
            author: {
                name: msg.author.displayName,
                icon_url: msg.author.displayAvatarURL({ size: 2048, extension: 'png' })
            },
            fields: [
                { name: "Deleted by", value: "<@" + executor.id + ">" },
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