import { AuditLogChange, AuditLogEvent, NonThreadGuildBasedChannel, PermissionsBitField, Role } from "discord.js";
import { ShitLogging } from "../../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../../structure/database/MLogging";
import { PermFlags, defaultPermFlags, flagsFindDifference, transEmoji } from "../../../../structure/types/PermFlags";
import { Logging } from "../../../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.ChannelOverwriteUpdate,

    config: {
        type: MLoggingTypeKeys.ChannelModified,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const extra = entry.extra;
        const channel = entry.target as NonThreadGuildBasedChannel;

        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: `A [channel's](${channel.url}) permissions override modified\n` +
                `${extra instanceof Role ? `<@&${extra.id}> (Role ID: ${extra.id})` : `<@${extra.id}> (ID: ${extra.id})`}\n` +
                "with the following changes:\n",
            fields: [
                { name: "Channel", value: `<#${channel.id}> (ID: ${channel.id})` }
            ]
        });

        let oldFlags = defaultPermFlags(), newFlags = defaultPermFlags();

        processChange(entry.changes.find((v) => v.key === "allow"), oldFlags, newFlags, true);
        processChange(entry.changes.find((v) => v.key === "deny"), oldFlags, newFlags, false);

        const difference = flagsFindDifference(oldFlags, newFlags);
        let diffMsg = Array.from(difference.entries())
            .filter(([key, diff]) => key && diff)
            .map(([key, diff]) => `- **${key}:** Changed from ${transEmoji(diff[0])} to ${transEmoji(diff[1])}`)
            .join("\n");

        embed.setDescription(`${embed.data.description}${diffMsg}`);

        return embed;
    }
});

function processChange(
    change: AuditLogChange | undefined,
    oldFlags: PermFlags,
    newFlags: PermFlags, 
    value: boolean
) {
    if(change) {
        let old = new PermissionsBitField(BigInt(change.old + "")), 
            newPerm = new PermissionsBitField(BigInt(change.new + ""));

        const oldSer = old.serialize();
        for(const key in oldSer) {
            if(oldSer[key as keyof typeof oldSer] === true)
                oldFlags[key as keyof typeof oldFlags] = value;
        }

        const newSer = newPerm.serialize();
        for(const key in newSer) {
            if(newSer[key as keyof typeof newSer] === true) 
                newFlags[key as keyof typeof newFlags] = value;
        }
    }
}