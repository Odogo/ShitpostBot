import { Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";
import { client } from "../../..";

export default new ShitEvent(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const cUser = client.user;
    if(!cUser || cUser === null) return;

    const { guild } = newMember;

    if(oldMember.nickname === newMember.nickname) return;

    let typeLogged = await Logging.isLoggingType(guild, MLoggingTypeKeys.MemberNickname);
    if(!typeLogged) return;

    let channels = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.MemberEvents);
    if(channels.length <= 0) return;

    const embed = await ShitLogging.fetchBaseEmbed(newMember, {
        color: Logging.EmbedColors.change,
        description: "<@" + newMember.id + "> changed their nickname from `" + oldMember.nickname + "` to `" + newMember.nickname + "`"
    });

    for(let i=0; i<channels.length; i++) {
        await channels[i].send({ embeds: [embed] });
    }
});