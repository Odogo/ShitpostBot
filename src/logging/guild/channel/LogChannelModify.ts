import { AuditLogEvent, NonThreadGuildBasedChannel } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { EmbedColors } from "../../../modules/Logging";
import { Utilities } from "../../../classes/Utilities";

export default new KLogging({
    logEvent: AuditLogEvent.ChannelUpdate,
    loggingConfig: {
        type: LoggingConfigType.ChannelModify,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
            description: "A [channel](" + channel.url + ") was updated\n<#" + channel.id + "> (ID: " + channel.id + ")",
        });

        if(channel.parent !== null) { embed.addFields({ name: "Under category", value: channel.parent.name }); }
        
        const changes = entry.changes.sort((a, b) => a.key.localeCompare(b.key));
        for(let i = 0; i < changes.length; i++) {
            let newKey = Utilities.auditLogKey(changes[i].key);
            let newOld = changes[i].old === undefined || changes[i].old === null || ((changes[i].old as String).length <= 0) ? "Not set": changes[i].old;
            let newNew = changes[i].new === undefined || changes[i].new === null || ((changes[i].new as String).length <= 0) ? "Not set": changes[i].new;

            embed.addFields([
                { name: newKey, value: "Previously `" + newOld + "`, now `" + newNew + "`" }
            ]);
        }

        return embed;
    }
})