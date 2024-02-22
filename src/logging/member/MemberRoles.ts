import { APIRole, AuditLogEvent, User } from "discord.js";
import { ShitLogging } from "../../structure/ShitLogging";
import { MLoggingConfigKeys, MLoggingSettingsKeys } from "../../structure/database/MLogging";
import { Logging } from "../../structure/modules/Logging";

export default new ShitLogging({
    logEvent: AuditLogEvent.MemberRoleUpdate,

    config: {
        type: MLoggingConfigKeys.MemberRoles,
        category: MLoggingSettingsKeys.MemberEvents
    },

    embedCallback: async (entry, guild) => {
        const target = entry.target as User;
        const changes = entry.changes[0];

        const member = await guild.members.fetch(target.id);
        const roles = member.roles.cache;

        const wasAdd = (changes.key === "$add");

        return await ShitLogging.fetchEntryBaseEmbed(entry, guild, {
            color: (wasAdd ? Logging.EmbedColors.add : Logging.EmbedColors.remove),
            description: "<@" + member.id + "> roles were updated.\n\n" +
                "**Role " + (wasAdd ? "Added" : "Removed") + ":** <@&" + (changes.new as APIRole[])[0].id + ">\n" +
                "**Updated roles:**" + roles.filter(role => role.id !== guild.id).map((v, k) => "<@&" + v.id + ">")
        });
    }
});