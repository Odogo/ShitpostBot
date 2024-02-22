import { AuditLogEvent, PermissionsBitField, Role } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";
import { PermFlags, flagsFilter, getPermFlags } from "../../../structure/types/PermFlags";

export default new ShitLogging({
    logEvent: AuditLogEvent.RoleDelete,

    config: {
        type: MLoggingTypeKeys.RoleDeleted,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const role = entry.target as Role;
        
        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.add,
            description: "A role was deleted.\n",
        });

        for (const key in changeKeys) {
            let change = entry.changes.find((v) => v.key === key);
            if (change) {
                if (key === "permissions") {
                    let permFlags = getPermFlags(new PermissionsBitField(BigInt(change.old as number)));
                    let filtered = flagsFilter(permFlags, true);

                    let permMsg = "- **Permissions:**\n";
                    if (filtered['Administrator']) {
                        permMsg += "  - **Administrator:** :white_check_mark: (all other permissions are superseded)\n";
                    } else {
                        for (const flag in filtered) {
                            permMsg += `  - **${flag}:** :white_check_mark:\n`;
                        }
                    }
                    embed.setDescription(embed.data.description + permMsg);
                } else if (key === "color") {
                    embed.setDescription(embed.data.description + `- **${changeKeys[key]}:** \`#${(change.old as Number).toString(16)}\`\n`);
                } else {
                    embed.setDescription(embed.data.description + `- **${changeKeys[key as keyof typeof changeKeys]}:** \`${change.old}\`\n`);
                }
            }
        }

        return embed;
    }
});

const changeKeys = {
    "name": "Name",
    "color": "Color",
    "hoist": "Viewed Separately",
    "mentionable": "Mentionable",
    "permissions": "Permissions"
};