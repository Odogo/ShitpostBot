import { AuditLogEvent } from "discord.js";
import { ShitLogging } from "../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../structure/database/MLogging";
import { Logging } from "../../structure/modules/Logging";
import { Utilities } from "../../structure/Utilities";

export default new ShitLogging({
    logEvent: AuditLogEvent.GuildUpdate,

    config: {
        type: MLoggingTypeKeys.GuildUpdated,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const changes = entry.changes;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: "The guild was modified.\n" +
                "There were a total of **" + changes.length + "** changes made to the guild." +
                (changes.length > 25 ? "\nNote: Dute to a field limitations, I can only display 25 changes.": ""),
        });

        for(let i=0; i<Math.min(changes.length, 25); i++) {
            embed.addFields([{
                name: Utilities.auditLogKey(changes[i].key),
                value: "Changed from `" + changes[i].old + "` to `" + changes[i].new + "`"
            }]);
        }

        return embed;
    }
});