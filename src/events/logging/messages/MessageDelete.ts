import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { client } from "../../..";
import { KLogging } from "../../../classes/objects/KLogging";
import { logWarn } from "../../../system";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";

export default new KEvent(Events.MessageDelete, async (msg) => {
    try {
        let { guild } = msg;
        if(guild === null) {
            if(msg.guildId === null) return;
            guild = await client.guilds.fetch(msg.guildId);
        }

        console.log(guild);

        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MessageDelete);
        if(!isTypeLogged) return;

        console.log(isTypeLogged);

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.MessageEvents);
        if(loggingChannels.length <= 0) return;

        console.log(loggingChannels);

        if(msg.author !== null && msg.author.bot) return;

        console.log(msg.author);
    
        let entries = (await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete })).entries;
        const entry = entries.first();

        console.log(entry);
        if(entry === undefined) return;

        const channel = entry.extra.channel;
        const executor = entry.executor;

        console.log(executor);
        if(executor === null) return;
 
        console.log(msg.author);
        if(msg.author !== null && entry.target.id !== msg.author.id) return;

        let embed = await KLogging.baseEmbed(entry, guild, { 
            color: EmbedColors.remove,
            description: (msg.partial ? "**Note:** Some information could not be gathered, I've tried to gather as much as I could.\n" : "") +
                "A " + (msg.url === null ? "message" : "[message](" + msg.url + ")") + " by " + (msg.author === null ? "<Could not fetch>" : "<@" + msg.author.id + ">") + " was deleted in <#" + channel.id + ">\n",
            fields: [
                { name: "Content", value: (msg.content === null ? "Content could not be fetch" : (msg.content.length > 1024 ? msg.content.substring(0, 1024-3) + "..." : msg.content)) }
            ]
        });

        for(let i=0; i<loggingChannels.length; i++)
            await loggingChannels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn(error);
        console.log(error);
    }
});