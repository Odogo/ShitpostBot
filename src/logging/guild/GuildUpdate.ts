import { AuditLogEvent, SystemChannelFlagsBitField } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";
import { Utilities } from "../../classes/Utilities";

export default new KLogging({
    logEvent: AuditLogEvent.GuildUpdate,
    loggingConfig: {
        type: LoggingConfigType.GuildUpdate,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const changes = entry.changes;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
            description: "The guild was modified.\n" + 
                "There were a total of **" + changes.length + "** changes made to the guild." + 
                (changes.length > 25 ? "\nNote: Due to field limitations, I can only display 25 of these changes.": "") 
        });

        for(let i=0; i<Math.min(changes.length, 25); i++) {
            embed.addFields([
                { 
                    name: Utilities.auditLogKey(changes[i].key),
                    value: "Changed from `" + changes[i].old + "` to `" + changes[i].new + "`"
                }
            ])
        }

        return embed;
    }
})