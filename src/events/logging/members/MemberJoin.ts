import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";
import { client } from "../../..";
import { logWarn } from "../../../system";
import { KLogging } from "../../../classes/objects/KLogging";

export default new KEvent(Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const clientUser = client.user;
    if(clientUser === null) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MemberJoin);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMembersEvents);
        if(loggingChannels.length <= 0) return;

        const embed = await KLogging.baseEmbedNoEntry(member, {
            color: EmbedColors.add,
            description: "<@" + member.id + "> joined the server!\n" + 
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