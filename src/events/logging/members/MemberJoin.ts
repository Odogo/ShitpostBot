import { Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { client } from "../../..";
import { logWarn } from "../../../system";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";

export default new ShitEvent(Events.GuildMemberAdd, async (member) => {
    const guild = member.guild;
    const cUser = client.user;
    if(!cUser || cUser === null) return;

    try {
        let typeLogged = await Logging.isLoggingType(guild, MLoggingTypeKeys.MemberJoined);
        if(!typeLogged) return;

        let channels = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.GuildDoorEvents);
        if(channels.length <= 0) return;

        const embed = ShitLogging.fetchBaseEmbed(member, {
            color: Logging.EmbedColors.add,
            description: "<@" + member.id + "> joined the server!\n" +
                "**Account age:** <t:" + Math.floor(member.user.createdTimestamp / 1000) + ":R>",
            thumbnail: {
                url: member.displayAvatarURL({ extension: 'png', size: 1024})
            }
        });

        for(let i=0; i<channels.length; i++)
            await channels[i].send({ embeds: [embed ]});
    } catch(error) {
        logWarn("[Logging - MJoin] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});