import { AuditLogEvent } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelUpdate,
    loggingConfig: {
        type: LoggingConfigType.ChannelModify,
        category: LoggingConfigCategory.GuildEvents
    },
    embedCallback: async (entry, guild) => {
        console.log(entry);

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
        });

        return embed;
    }
})