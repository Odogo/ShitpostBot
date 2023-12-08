import { AuditLogEvent, Role } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.RoleCreate,
    loggingConfig: {
        type: LoggingConfigType.RoleAdd,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const role = entry.target as Role;

        const embed = await KLogging.baseEmbed(entry, guild, {
			color: EmbedColors.add,
            description: "A new role was created: <@&" + role.id + ">"
		});

        return embed;
    }
});