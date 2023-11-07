import { AuditLogEvent, EmbedBuilder } from "discord.js";
import { KLogging } from "../classes/KLogging";
import { LoggingConfigCategory } from "../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../enums/LoggingConfigType";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelCreate,
    loggingConfig: {
        category: LoggingConfigCategory.GuildEvents,
        type: LoggingConfigType.ChannelAdd
    },

    embedCallback: (entry) => {
        return new EmbedBuilder({
            color: 0xFFFF00,
            description: "This is a testing embed"
        });
    }
});