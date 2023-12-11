import { Events } from "discord.js";
import { KEvent } from "../../../classes/objects/KEvent";
import { KLogging } from "../../../classes/objects/KLogging";
import { EmbedColors, gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigType } from "../../../enums/logging/LoggingConfigType";
import { LoggingConfigCategory } from "../../../enums/logging/LoggingConfigCategory";

export default new KEvent(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const { guild } = newMember;

    if(oldMember.nickname === newMember.nickname) return;

    let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.MemberName);
    if(!isTypeLogged) return;

    let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildMemberEvents);
    if(loggingChannels.length <= 0) return;

    const embed = await KLogging.baseEmbedNoEntry(newMember, {
        color: EmbedColors.change,
        description: "<@" + newMember.id + "> changed their nickname from `" + oldMember.nickname + "` to `" + newMember.nickname + "`"
    });
    
    for(let i=0; i<loggingChannels.length; i++) {
        await loggingChannels[i].send({ embeds: [embed] });
    }
});