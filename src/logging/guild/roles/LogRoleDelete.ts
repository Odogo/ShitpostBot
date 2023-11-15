import { AuditLogEvent, PermissionsBitField } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { EmbedColors } from "../../../modules/Logging";
import { flagsFilter, PermFlags } from "../../../types/PermFlags";

export default new KLogging({
    logEvent: AuditLogEvent.RoleDelete,
    loggingConfig: {
        type: LoggingConfigType.RoleRemove,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const embed = await KLogging.baseEmbed(entry, guild, {
			color: EmbedColors.remove,
            description: "A role was deleted.\n",
		});

        let roleName = entry.changes.find((v) => v.key === "name");
        if(roleName) embed.setDescription(embed.data.description + "- **Name:** `" + roleName.old + "`\n");

        let roleColor = entry.changes.find((v) => v.key === "color");
        if(roleColor) embed.setDescription(embed.data.description + "- **Color:** `#" + (roleColor.old as Number).toString(16) + "`\n");

        let roleHoist = entry.changes.find((v) => v.key === "hoist");
        if(roleHoist) embed.setDescription(embed.data.description + "- **Viewed Separately:** `" + roleHoist.old + "`\n");

        let roleMentionable = entry.changes.find((v) => v.key === "mentionable");
        if(roleMentionable) embed.setDescription(embed.data.description + "- **Mentionable:** `" + roleMentionable.old + "`\n");

        let rolePerms = entry.changes.find((v) => v.key === "permissions");
        if(rolePerms) {
            let permBit = new PermissionsBitField(BigInt(rolePerms.old as number));
            let filtered = flagsFilter(Object.entries(PermissionsBitField.Flags).reduce((obj, [perm, value]) => ({ ...obj, [perm]: permBit.has(value) }), {} as PermFlags), true);

            //let permMsg = "- **Permissions:** " + Object.keys(filtered).join(", ");
            // embed.setDescription(embed.data.description + permMsg);

            let permMsg = "- **Permissions:**\n";
            for(const key in filtered) permMsg += "  - **" + key + ":** :white_check_mark:\n";
            embed.setDescription(embed.data.description + permMsg);
        }

        return embed;
    }
});