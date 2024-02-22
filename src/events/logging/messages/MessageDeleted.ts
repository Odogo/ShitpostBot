import { AuditLogEvent, EmbedBuilder, Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { client } from "../../..";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingConfigKeys, MLoggingSettingsKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";
import { logWarn } from "../../../system";

export default new ShitEvent(Events.MessageDelete, async (msg) => {
    try {
        const cUser = client.user;
        if(!cUser || cUser === null) return;

        let { guild } = msg;
        if(guild === null) {
            if(msg.guildId === null) return;
            guild = await client.guilds.fetch(msg.guildId);
        }

        let typeLogged = await Logging.isLoggingType(guild, MLoggingConfigKeys.MessageDeleted);
        if(!typeLogged) return;

        let channels = await Logging.collectChannelsToLog(guild, MLoggingSettingsKeys.MessageEvents);
        if(channels.length <= 0) return;

        if(msg.author === null) return;
        if(msg.author.bot) return;

        let embed: EmbedBuilder | null = null;

        let entries = (await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete })).entries;
        const entry = entries.first();

        if (entry && entry.target.id === msg.author?.id && entry.extra.channel.id === msg.channel.id) {
            const channel = entry.extra.channel;
        
            embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, { 
                color: Logging.EmbedColors.remove,
                description: (msg.partial ? "**Note:** Some information could not be gathered, I've tried to gather as much as I could.\n" : "") +
                    "A " + (msg.url === null ? "message" : "[message](" + msg.url + ")") + " by " + (msg.author === null ? "<Could not fetch>" : "<@" + msg.author.id + ">") + " was deleted in <#" + channel.id + ">\n",
                fields: [
                    { name: "Content", value: (msg.content === null ? "<Could not fetch>" : (msg.content.length > 1024 ? msg.content.substring(0, 1024-3) + "..." : msg.content)) }
                ]
            });
        } else {
            embed = ShitLogging.fetchBaseEmbed(msg.author, {
                color: Logging.EmbedColors.remove,
                description: "A [message](" + msg.url + ") by <@" + msg.author + "> was deleted in <#" + msg.channel.id + ">",
                fields: [
                    { name: "Content", value: (msg.content === null ? "<Could not fetch>" : (msg.content.length > 1024 ? msg.content.substring(0, 1024 - 3) + "..." : msg.content)) }
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

        for(let i=0; i<channels.length; i++)
            await channels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn("[Logging - MDelete] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});