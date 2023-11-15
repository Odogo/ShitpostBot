import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { client } from "../../..";
import { logWarn } from "../../../system";

export default new KEvent(Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const clientUser = client.user;
    if(clientUser === null) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MemberJoin);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMembersEvents);
        if(loggingChannels.length <= 0) return;

        const embed = new EmbedBuilder({
            color: EmbedColors.add,
            author: {
                name: guild.name,
                iconURL: guild.iconURL({ extension: 'png', size: 2048 }) || undefined
            },
            footer: {
                text: clientUser.displayName,
                iconURL: clientUser.avatarURL({ extension: 'png', size: 2048 }) || undefined
            },
            description: "<@" + member.id + "> joined the server!\n" + 
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