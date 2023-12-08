import { APIRole, AuditLogEvent, User } from "discord.js";
import { KLogging } from "../../classes/objects/KLogging";
import { LoggingConfigType } from "../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/logging/LoggingConfigCategory";
import { EmbedColors } from "../../modules/Logging";

export default new KLogging({
    logEvent: AuditLogEvent.MemberRoleUpdate,
    loggingConfig: {
        type: LoggingConfigType.MemberRole,
        category: LoggingConfigCategory.GuildMemberEvents
    },

    // Check the key to see if it was a remove or add
    // Check for a "$remove" or "$add"
    embedCallback: async (entry, guild) => {
        const target = entry.target as User;
        const changes = entry.changes[0];

        const member = await guild.members.fetch(target.id);
        const roles = member.roles.cache;

        return await KLogging.baseEmbed(entry, guild, {
            color: (changes.key === "$add" ? EmbedColors.add : EmbedColors.remove),
            description: "<@" + target.id + "> roles were updated.\n\n" + 
                "**Role " + (changes.key === "$add" ? "Added": "Removed") + "**: <@&"+ (changes.new as APIRole[])[0].id + ">\n" +
                "**Roles:** " + roles.filter(role => role.id !== guild.id).map((v, k) => "<@&" + v.id + ">")
        });
    }
})