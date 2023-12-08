import { AuditLogEvent, PermissionsBitField, Role } from "discord.js";
import { KLogging } from "../../../classes/objects/KLogging";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { EmbedColors } from "../../../modules/Logging";
import { PermFlags, flagsFindDifference, transEmoji } from "../../../types/PermFlags";

export default new KLogging({
    logEvent: AuditLogEvent.RoleUpdate,
    loggingConfig: {
        type: LoggingConfigType.RoleModify,
        category: LoggingConfigCategory.GuildEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as Role;

        const embed = await KLogging.baseEmbed(entry, guild, {
            color: EmbedColors.change,
            description: "The role <@&" + target.id + "> was modified with the changes:\n"
        });

        let roleName = entry.changes.find((v) => v.key === "name");
        if(roleName) embed.setDescription(embed.data.description + "- **Name:** Changed from `" + roleName.old + "` to `" + roleName.new + "` \n");

        let roleColor = entry.changes.find((v) => v.key === "color");
        if(roleColor) embed.setDescription(embed.data.description + "- **Color:** Changed from `#" + (roleColor.old as Number).toString(16) + "` to `#" + (roleColor.new as Number).toString(16) + "`\n");

        let roleHoist = entry.changes.find((v) => v.key === "hoist");
        if(roleHoist) embed.setDescription(embed.data.description + "- **Viewed Separately:** Changed from `" + roleHoist.old + "` to `" + roleHoist.new + "`\n");

        let roleMentionable = entry.changes.find((v) => v.key === "mentionable");
        if(roleMentionable) embed.setDescription(embed.data.description + "- **Mentionable:** Changed from `" + roleMentionable.old + "` to `" + roleMentionable.new + "`\n");

        let rolePerms = entry.changes.find((v) => v.key === "permissions");
        if(rolePerms) {
            const permBitOld = new PermissionsBitField(BigInt(rolePerms.old as number)), permBitNew = new PermissionsBitField(BigInt(rolePerms.new as number));
            const flagsOld = Object.entries(PermissionsBitField.Flags).reduce((obj, [perm, value]) => ({ ...obj, [perm]: permBitOld.has(value) }), {} as PermFlags);
            const flagsNew = Object.entries(PermissionsBitField.Flags).reduce((obj, [perm, value]) => ({ ...obj, [perm]: permBitNew.has(value) }), {} as PermFlags);
            const difference = flagsFindDifference(flagsOld, flagsNew);
            
            let diffMsg = "- **Permissions:**\n";
            for(let i=0; i<difference.size; i++) {
                let indexKey = difference.keyAt(i);
                if(!indexKey) continue;
    
                let diff = difference.get(indexKey);
                if(!diff) continue;
    
                diffMsg += "  - **" + indexKey + ":** Changed from " + transEmoji(diff[0]) + " to " + transEmoji(diff[1]) + "\n";
            }

            embed.setDescription(embed.data.description + diffMsg);
        }

        return embed;
    }
})