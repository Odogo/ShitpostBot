import { EmbedBuilder, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { logWarn } from "../../system";
import { gatherChannelsForLogging, isGuildTypeLogged } from "../../modules/Logging";
import { LoggingConfigCategory } from "../../enums/LoggingConfigCategory";
import { LoggingConfigType } from "../../enums/LoggingConfigType";

export default new KEvent(Events.MessageUpdate, async (oldMsg, newMsg) => {
    if(oldMsg.partial) {
        await oldMsg.fetch(true)
            .then((msg) => oldMsg = msg)
            .catch(logWarn);
    }

    if(newMsg.partial) {
        await newMsg.fetch(true)
            .then((msg) => newMsg = msg)
            .catch(logWarn);
    }

    // Null checks cause 'strictNullChecks' goes brrr
    if(oldMsg.guild == null || oldMsg.author == null || oldMsg.content == null) return;
    if(newMsg.guild == null || newMsg.author == null || newMsg.content == null) return;

    if(oldMsg.author.bot) return;

    try {
        let isTypeLogged = await isGuildTypeLogged(newMsg.guild, LoggingConfigType.MessageDelete);
        if(!isTypeLogged) return;

        let loggingChannels = await gatherChannelsForLogging(newMsg.guild, LoggingConfigCategory.MessageEvents);
        if(loggingChannels.length <= 0) return;

        const embed = new EmbedBuilder({
            color: 0x7DFFC7,
            description: "A **[message](" + newMsg.url + ")** was edited in <#" + newMsg.channel.id + ">",
            author: {
                name: newMsg.author.displayName,
                icon_url: newMsg.author.displayAvatarURL({ size: 2048, extension: 'png' })
            },
            timestamp: Date.now()
        });
        const embedCopy = new EmbedBuilder(embed.data);

        if(oldMsg.content !== newMsg.content) {
            const oldContent = oldMsg.content.slice(0, 1900) + (oldMsg.content.length >= 1900 ? "...": "");
            const newContent = newMsg.content.slice(0, 1900) + (newMsg.content.length >= 1900 ? "...": "");

            embed.setDescription(embed.data.description + "\n\n**Previously:**\n" + oldContent + "\n**Currently:**\n" + newContent);
        }

        if(oldMsg.attachments.size > 0 && oldMsg.attachments.size !== newMsg.attachments.size) {
            let oldAttach = oldMsg.attachments.map((a) => " " + a.url);
            for(let i = 0; i<oldAttach.length; i++) {
                let split = oldAttach[i].split("?");
                oldAttach[i] = split[0];
            }
            embed.addFields({ name: "Previous Attachments", value: " " + oldAttach, inline:  true});

            let newAttach = newMsg.attachments.map((a) => " " + a.url);
            for(let i = 0; i<newAttach.length; i++) {
                let split = newAttach[i].split("?");
                newAttach[i] = split[0];
            }
            embed.addFields({ name: "Current Attachments", value: " " + newAttach, inline: true})
        }

        if(embed === embedCopy) return;

        for(let i = 0; i < loggingChannels.length; i++) {
            await loggingChannels[i].send({ embeds: [embed] });
        }
    } catch(error) {
        logWarn("[Event MSGEDT] [Logging] [GID: " + newMsg.guild.id + "] Failed to log: " + error);
        console.log(error);
    }
});