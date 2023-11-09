import { AuditLogEvent, Role } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";

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