import { AuditLogEvent, Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { client } from "../../..";
import { KLogging } from "../../../classes/objects/KLogging";
import { logWarn } from "../../../system";
import { EmbedColors } from "../../../modules/Logging";

export default new KEvent(Events.MessageDelete, async (msg) => {
    if(msg.partial) 
        await msg.fetch().then((newMsg) => msg = newMsg).catch(logWarn);

    let { guild } = msg;
    if(guild === null) {
        if(msg.guildId === null) return;
        guild = await client.guilds.fetch(msg.guildId);
    }

    if(msg.author !== null && msg.author.bot) return;
    
    let entries = (await guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete })).entries;
    const entry = entries.first();
    if(entry === undefined || msg.author === null || entry.target.id !== msg.author.id) {
        return;
    }

    msg
    const embed = await KLogging.baseEmbed(entry, guild, {
        color: EmbedColors.remove,
        description: "A [message](" + 
    });
});