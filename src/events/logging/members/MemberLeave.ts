import { Events, EmbedBuilder } from "discord.js";
import { client } from "../../..";
import { KEvent } from "../../../classes/objects/KEvent";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { isGuildTypeLogged, gatherChannelsForLogging, EmbedColors } from "../../../modules/Logging";
import { logWarn } from "../../../system";
import { KLogging } from "../../../classes/objects/KLogging";

export default new KEvent(Events.GuildMemberRemove, async (member) => {
    const guild = member.guild;
    const clientUser = client.user;
    if(clientUser === null) return;

    const user = member.user;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MemberLeave);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMembersEvents);
        if(loggingChannels.length <= 0) return;

        const embed = await KLogging.baseEmbedNoEntry(user, {
            color: EmbedColors.remove,
            description: "<@" + member.id + "> (" + user.displayName + ") left the server!\n" + 
                "**Joined the server** <t:" + Math.floor((member.joinedTimestamp || -1) / 1000) + ":R>\n" +
                "**Account age:** <t:" + Math.floor(member.user.createdTimestamp / 1000) + ":R>",
            thumbnail: {
                url: member.displayAvatarURL({ extension: 'png', size: 1024})
            }
        });

        for(let i=0; i<loggingChannels.length; i++) {
            loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Logging] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});