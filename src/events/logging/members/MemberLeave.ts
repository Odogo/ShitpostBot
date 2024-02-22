import { Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { client } from "../../..";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";
import { logWarn } from "../../../system";

export default new ShitEvent(Events.GuildMemberRemove, async (member) => {
    const guild = member.guild;
    const cUser = client.user;
    if(!cUser || cUser === null) return;

    const user = member.user;

    try {
        let typeLogged = await Logging.isLoggingType(guild, MLoggingTypeKeys.MemberLeft);
        if(!typeLogged) return;

        let channels = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.GuildDoorEvents);
        if(channels.length <= 0) return;

        const embed = await ShitLogging.fetchBaseEmbed(user, {
            color: Logging.EmbedColors.remove,
            description: "<@" + member.id + "> (" + user.displayName + ") left the server!\n" +
                "**Joined the server:** <t:" + Math.floor((member.joinedTimestamp || -1) / 1000) + ":R>\n" +
                "**Account age:** <t:" + Math.floor(user.createdTimestamp / 1000) + ":R>",
            thumbnail: {
                url: member.displayAvatarURL({ extension: 'png', size: 1024 })
            }
        });

        for(let i=0; i<channels.length; i++) {
            await channels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Logging - MLeave] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});