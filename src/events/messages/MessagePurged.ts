import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigType } from "../../enums/LoggingConfigType";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { logWarn } from "../../system";

export default new KEvent(Events.MessageBulkDelete, async (msgs, channel) => {
    try{
        let isTypeLogged = await isGuildTypeLogged(channel.guild, LoggingConfigType.MessagePurged);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(channel.guild, LoggingConfigCategory.MessageEvents);
        if(loggingChannels.length <= 0) return;

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "`" + msgs.size + "` **messages purged**",
            author: {
                name: channel.guild.name,
                icon_url: channel.guild.iconURL({ size: 2048, extension: 'png' }) || undefined
            },
            fields: [
                { name: "In channel", value: "<#" + channel.id + ">" }
            ],
            timestamp: Date.now()
        });

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Event MSGPRG] [Logging] [GID: " + channel.guild.id + "] Failed to log: " + error);
        console.log(error);
    }
});