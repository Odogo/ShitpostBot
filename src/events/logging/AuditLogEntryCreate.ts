import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { logWarn } from "../../system";

export default new ShitEvent(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    const { action } = entry;
    
    const logObject = client.logging.get(action);
    if(!logObject) return;

    try {
        // do database checks here

        const embed = await logObject.generateEmbed(entry, guild);
        if(!embed) return;

        // send to channels with logging enabled :P
    } catch(error) {
        logWarn("[AuditLog] Failed to handle audit log entry: " + error);
        logWarn(error);
    }
});