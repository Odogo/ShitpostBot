import { AuditLogEvent, GuildMember, NonThreadGuildBasedChannel, Role } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelOverwriteDelete,

    config: {
        type: MLoggingTypeKeys.ChannelModified,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const extra = entry.extra as GuildMember | Role;
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.remove,
            description: "A [channel's](" + channel.url + ") permissions override was modified to remove:\n" +
                "<#" + channel.id + "> (ID: " + channel.id + ")\n" +
                (extra instanceof Role ? "<@&" + extra.id + "> (Role ID: " + extra.id + ")" : "<@" + extra.id + "> (ID: " + extra.id + ")")
        });

        return embed;
    }
})