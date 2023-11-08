import { Events } from "discord.js";
import { KEvent } from "../../classes/objects/KEvent";
import { client } from "../..";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { logWarn } from "../../system";

export default new KEvent(Events.GuildAuditLogEntryCreate, async (entry, guild) => {
    const { action } = entry;

    const logObject = client.logging.get(action);
    if(logObject === undefined) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, logObject.loggingConfig.type);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, logObject.loggingConfig.category);
        if(loggingChannels.length <= 0) return;

        const embed = await logObject.embedCallback(entry, guild);
        if(embed === null) return;

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Logging] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});