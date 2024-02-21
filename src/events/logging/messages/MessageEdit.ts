import { EmbedBuilder, Events } from "discord.js";
import { ShitEvent } from "../../../structure/ShitEvent";
import { logWarn } from "../../../system";
import { Logging } from "../../../structure/modules/Logging";
import { MLoggingConfigKeys, MLoggingSettingsKeys } from "../../../structure/database/MLogging";
import { ShitLogging } from "../../../structure/ShitLogging";
import { client } from "../../..";

export default new ShitEvent(Events.MessageUpdate, async (oldMsg, newMsg) => {
    try {
        console.log("fired");
        const cUser = client.user;
        if(!cUser || cUser === null) return;

        console.log("test a");

        if(oldMsg.partial) { oldMsg = await oldMsg.fetch(true); }
        if(newMsg.partial) { newMsg = await newMsg.fetch(true); }

        console.log("test b");

        if(!oldMsg.inGuild() || !newMsg.inGuild()) return;
        const guild = newMsg.guild;

        console.log("test c");

        let typeLogged = await Logging.isLoggingType(guild, MLoggingConfigKeys.MessageEdited);
        if(!typeLogged) return;

        console.log("test d");

        let channels = await Logging.collectChannelsToLog(guild, MLoggingSettingsKeys.MessageEvents);
        if(channels.length <= 0) return;

        console.log("test e");

        if(oldMsg.author.bot) return;

        console.log("test f");

        const channel = oldMsg.channel;
        const embed = ShitLogging.fetchBaseEmbed(cUser, await guild.members.fetch(oldMsg.author.id), {
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

        console.log(embed.data);

        if(embed.data === embedCopy.data) return;

        console.log("test g");

        for(let i=0; i < channels.length; i++) 
            await channels[i].send({ embeds: [embed] });
    } catch(error) {
        logWarn("[Logging - MEdit] An error occured while preparing to log: " + error);
        logWarn(error);
    }
});