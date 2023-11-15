import { AuditLogEvent } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";

export default new KLogging({
    logEvent: AuditLogEvent.MemberMove,
    loggingConfig: {
        type: LoggingConfigType.VoiceSwitch,
        category: LoggingConfigCategory.VoiceEvents
    },

    embedCallback: async (entry, guild) => {
        const embed = await KLogging.baseEmbed(entry, guild, {
            
        });
        
        return embed;
    }
})