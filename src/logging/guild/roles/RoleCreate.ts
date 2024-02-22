import { AuditLogEvent, Role } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.RoleCreate,

    config: {
        type: MLoggingTypeKeys.RoleCreated,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const role = entry.target as Role;
        
        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "A new role was created: <@&" + role.id + ">"
        });
    }
})