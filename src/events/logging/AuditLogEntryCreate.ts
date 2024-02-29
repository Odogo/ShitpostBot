import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { logWarn } from "../../system";
import { Logging } from "../../structure/modules/Logging";

export default new ShitEvent(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    const { action } = entry;
    
    const logObject = client.logging.get(action);
    if(!logObject) return;

    try {
        let typeLogged = await Logging.isGuildLoggingType(guild, logObject.config.type);
        if(!typeLogged) return;

        let channels = await Logging.collectChannelsToLog(guild, logObject.config.category);
        if(channels.length <= 0) return;

        const embed = await logObject.generateEmbed(entry, guild);
        if(!embed) return;

        for(let i=0; i < channels.length; i++) {
            await channels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[AuditLog] Failed to handle audit log entry: " + error);
        logWarn(error);
    }
});