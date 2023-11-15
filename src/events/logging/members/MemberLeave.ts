import { Events, EmbedBuilder } from "discord.js";
import { client } from "../../..";
import { KEvent } from "../../../classes/objects/KEvent";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { isGuildTypeLogged, gatherChannelsForLogging, EmbedColors } from "../../../modules/Logging";
import { logWarn } from "../../../system";

export default new KEvent(Events.GuildMemberRemove, async (member) => {
    const guild = member.guild;
    const clientUser = client.user;
    if(clientUser === null) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MemberLeave);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMembersEvents);
        if(loggingChannels.length <= 0) return;

        const embed = new EmbedBuilder({
            color: EmbedColors.remove,
            author: {
                name: guild.name,
                iconURL: guild.iconURL({ extension: 'png', size: 2048 }) || undefined
            },
            footer: {
                text: clientUser.displayName,
                iconURL: clientUser.avatarURL({ extension: 'png', size: 2048 }) || undefined
            },
            description: "<@" + member.id + "> left the server!\n" + 
                "**Joined the server** <t:" + Math.floor((member.joinedTimestamp || -1) / 1000) + ":R>\n" +
                "**Account age:** <t:" + Math.floor(member.user.createdTimestamp / 1000) + ":R>",
            thumbnail: {
                url: member.displayAvatarURL({ extension: 'png', size: 1024})
            }
        }).setTimestamp();

        for(let i=0; i<loggingChannels.length; i++) {
            loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Logging] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});