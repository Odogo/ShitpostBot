import { EmbedBuilder, Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { logWarn } from "../../../system";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";
import { client } from "../../..";

export default new ShitEvent(Events.MessageUpdate, async (oldMsg, newMsg) => {
    try {
        const cUser = client.user;
        if(!cUser || cUser === null) return;

        if(oldMsg.partial) { oldMsg = await oldMsg.fetch(true); }
        if(newMsg.partial) { newMsg = await newMsg.fetch(true); }

        if(!oldMsg.inGuild() || !newMsg.inGuild()) return;
        const guild = newMsg.guild;

        let typeLogged = await Logging.isLoggingType(guild, MLoggingTypeKeys.MessageEdited);
        if(!typeLogged) return;

        let channels = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.MessageEvents);
        if(channels.length <= 0) return;

        if(oldMsg.author.bot) return;

        const channel = oldMsg.channel;
        const embed = ShitLogging.fetchBaseEmbed(await guild.members.fetch(oldMsg.author.id), {
            color: Logging.EmbedColors.change,
            description: "A [message](" + newMsg.url + ") was edited in <#" + channel.id + ">"
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

        if(embed.data === embedCopy.data) return;

        for(let i=0; i < channels.length; i++) 
            await channels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn("[Logging - MEdit] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});