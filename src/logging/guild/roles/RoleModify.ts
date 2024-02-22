import { AuditLogEvent, PermissionsBitField, Role } from "discord.js";
import { ShitLogging } from "../../../structure/ShitLogging";
import { MLoggingConfigKeys, MLoggingCategoryKeys } from "../../../structure/database/MLogging";
import { Logging } from "../../../structure/modules/Logging";
import { getPermFlags, flagsFindDifference, transEmoji, PermFlags } from "../../../structure/types/PermFlags";

export default new ShitLogging({
    logEvent: AuditLogEvent.RoleUpdate,

    config: {
        type: MLoggingConfigKeys.RoleModified,
        category: MLoggingCategoryKeys.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as Role;
        
        const embed = await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: Logging.EmbedColors.change,
            description: "The role <@&" + target.id + "> was modified with the changes:\n"
        });

        for (const key in changeKeys) {
            let change = entry.changes.find((v) => v.key === key);
            if (change) {
                if (key === "permissions") {
                    const permBitOld = new PermissionsBitField(BigInt(change.old as number)), permBitNew = new PermissionsBitField(BigInt(change.new as number));
                    const flagsOld = getPermFlags(permBitOld);
                    const flagsNew = getPermFlags(permBitNew);
                    const difference = flagsFindDifference(flagsOld, flagsNew);

                    let diffMsg = "- **Permissions:**\n";
                    const adminDiff = difference.get('Administrator');
                    if (adminDiff) { // Administrator permission has changed
                        diffMsg += `  - **Administrator:** Changed from ${transEmoji(adminDiff[0])} to ${transEmoji(adminDiff[1])}\n`;
                        if (adminDiff[1] === true) { // Administrator permission is enabled
                            diffMsg += "  (all other permissions are superseded)\n";
                        } else {
                            
                            diffMsg += "\n(The following permissions are disabled, but were superseded by 'Administrator')\n"
                            const list = Array.from(difference.keys()).filter(key => difference.get(key) && difference.get(key)![0] && !difference.get(key)![1]);
                            diffMsg += list.map((v) => "**" + v + "**").join(", ");
                        }
                    } else {
                        for (const [indexKey, diff] of difference.entries()) {
                            diffMsg += `  - **${indexKey}:** Changed from ${transEmoji(diff[0])} to ${transEmoji(diff[1])}\n`;
                        }
                    }

                    embed.setDescription(embed.data.description + diffMsg);
                } else if (key === "color") {
                    embed.setDescription(embed.data.description + `- **${changeKeys[key]}:** Changed from \`#${(change.old as Number).toString(16)}\` to \`#${(change.new as Number).toString(16)}\`\n`);
                } else {
                    embed.setDescription(embed.data.description + `- **${changeKeys[key as keyof typeof changeKeys]}:** Changed from \`${change.old}\` to \`${change.new}\`\n`);
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