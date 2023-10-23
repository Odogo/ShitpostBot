import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../../classes/KEvent";
import { logWarn } from "../../../system";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../../modules/Logging";
import { LoggingConfigCategory } from "../../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../../enums/LoggingConfigType";

export default new KEvent(Events.ChannelCreate, async (channel) => {
    let guild = channel.guild;

    try {
        let isTypeLogged = await isGuildTypeLogged(guild, LoggingConfigType.ChannelAdd);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(guild, LoggingConfigCategory.GuildEvents);
        if(loggingChannels.length <= 0) return;

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "A [channel](" + channel.url + ") was created",
            fields: [
                { name: "Created", value: "<t:" + channel.createdTimestamp + ":R>"}
            ],
            author: {
                name:  guild.name,
                icon_url: guild.iconURL({ size: 2048, extension: 'png' }) || undefined
            },
            timestamp: Date.now()
        });

        if(channel.parent !== null) {
            embed.addFields({ name: "Under category", value: channel.parent.name });
        }

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Event CHLADD] [Logging] [GID: " + guild.id + "] Failed to log: " + error);
        console.log(error);
    }
});