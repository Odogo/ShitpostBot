import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { client } from "../../..";
import { KLogging } from "../../../classes/objects/KLogging";
import { logWarn } from "../../../system";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";

export default new KEvent(Events.MessageDelete, async (msg) => {
    try {
        let { guild } = msg;
        if(guild === null) {
            if(msg.guildId === null) return;
            guild = await client.guilds.fetch(msg.guildId);
        }

        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MessageDelete);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.MessageEvents);
        if(loggingChannels.length <= 0) return;

        if(msg.author !== null && msg.author.bot) return;
    
        let entries = (await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete })).entries;
        const entry = entries.first();
        if(entry === undefined) return;

        const channel = entry.extra.channel;
        const executor = entry.executor;

        if(executor === null) return;

        let embed: EmbedBuilder | null = null;
        if(msg.author !== null && entry.target.id !== msg.author.id) {
            embed = await KLogging.baseEmbedNoEntry(msg.author, {
                color: EmbedColors.remove,
                description: "A [message](" + msg.url + ") by <@" + msg.author + "> was deleted in <#" + msg.channel.id + ">",
                fields: [
                    { name: "Content", value: (msg.content === null ? "<Could not fetch>" : (msg.content.length > 1024 ? msg.content.substring(0, 1024-3) + "..." : msg.content)) }
                ]
            });
        } else {
            embed = await KLogging.baseEmbed(entry, guild, { 
                color: EmbedColors.remove,
                description: (msg.partial ? "**Note:** Some information could not be gathered, I've tried to gather as much as I could.\n" : "") +
                    "A " + (msg.url === null ? "message" : "[message](" + msg.url + ")") + " by " + (msg.author === null ? "<Could not fetch>" : "<@" + msg.author.id + ">") + " was deleted in <#" + channel.id + ">\n",
                fields: [
                    { name: "Content", value: (msg.content === null ? "<Could not fetch>" : (msg.content.length > 1024 ? msg.content.substring(0, 1024-3) + "..." : msg.content)) }
                ]
            });
        }

        if(msg.attachments.size > 0) {
            let attachments = msg.attachments.map((a) => " " + a.url);
            for(let i = 0; i<attachments.length; i++) {
                let split = attachments[i].split("?");
                attachments[i] = split[0];
            }
            embed.addFields({ name: "Attachments", value: " " + attachments, inline:  true});
        }

        for(let i=0; i<loggingChannels.length; i++)
            await loggingChannels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn(error);
        console.log(error);
    }
});