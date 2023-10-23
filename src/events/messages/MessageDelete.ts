import { EmbedBuilder, Events } from "discord.js";

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
        if(loggingChannels.length <= 0) return;

        const content = msg.content.slice(0, 1900) + (msg.content.length >= 1900 ? "...": "");

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "A **message** was deleted in <#" + msg.channel.id + ">"
                + "\n"
                + "\n**Contents:**\n" + content,
            author: {
                name: msg.author.displayName,
                icon_url: msg.author.displayAvatarURL({ size: 2048, extension: 'png' })
            },
            timestamp: Date.now()
        });

        if(msg.attachments.size > 0) {
            let attachments = msg.attachments.map((a) => " " + a.url);
            for(let i = 0; i<attachments.length; i++) {
                let split = attachments[i].split("?");
                attachments[i] = split[0];
            }
            embed.addFields({ name: "Attachments", value: " " + attachments, inline:  true});
        }

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Event MSGDEL] [Logging] [GID: " + msg.guild.id + "] Failed to log: " + error);
        console.log(error);
    }
});