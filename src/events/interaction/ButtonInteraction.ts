import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { HandleCategory, HandleMainMenu } from "../../commands/Settings";
import { MSettingsCategories, MSettingsEntry, MSettingsKeys, MSettingsValues } from '../../structure/types/TSettings';
import { Settings } from '../../structure/modules/Settings';
import { logDebug, logError } from "../../system";

export default new ShitEvent(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isButton()) return;

    const { guild } = interaction;
    if(!guild) return;

    const member = await guild.members.fetch(interaction.user.id);

//#region Settings Menu
    if(interaction.customId === "settings:cancel" || interaction.customId === "settings:cat:cancel") {
        return await interaction.update({ components: [], content: "You cancelled the settings selection", embeds: [] });
    }

    if(interaction.customId === "settings:cat:back") {
        await interaction.message.delete();
        return await HandleMainMenu(guild, member, interaction);
    }

    if(interaction.customId.startsWith("settings:category:")) {
        const category = interaction.customId.split(":")[2] as MSettingsCategories;
        await interaction.message.delete();
        return await HandleCategory(guild, member, interaction, category);
    }

    if(interaction.customId.startsWith("settings:cat:")) {
        const key = interaction.customId.split(":")[2] as MSettingsKeys;
        const settingEntry = new MSettingsEntry(key);

        await interaction.message.delete();
        await interaction.deferReply();

        if(settingEntry.type === "boolean") {
            await Settings.promptBoolean({ interaction: interaction, guild: guild, member: member, key: key}).then(async (value) => {
                await interaction.editReply({ content: "Successfully set " + key + " to " + value });
            }).catch(async (reason) => {
                await interaction.editReply({ content: "Failed to get response: " + reason });
            });
        } else if(settingEntry.type === "string") {
            await Settings.promptString({ interaction: interaction, guild: guild, member: member, key: key}).then(async (value) => {
                await interaction.editReply({ content: "Successfully set " + key + " to " + value });
            }).catch(async (reason) => {
                await interaction.editReply({ content: "Failed to get response: " + reason });
            });
        } else if(settingEntry.type === "number") {
            await Settings.promptNumber({ interaction: interaction, guild: guild, member: member, key: key}).then(async (value) => {
                await interaction.editReply({ content: "Successfully set " + key + " to " + value });
            }).catch(async (reason) => {
                await interaction.editReply({ content: "Failed to get response: " + reason });
            });
        } else {
            logError("------ CRITICAL ERROR ------");
            logError("Failed to complete action: Unknown type");
            logError("Verify that this key " + key + " is valid type of either boolean, string, or number!");
            logError("From " + interaction.user.username + " (" + interaction.user.id + ") in " + guild.name + " (" + guild.id + ")");
            logError("------ CRITICAL ERROR ------");
            await interaction.editReply({ content: "Failed to complete action: Unknown type" });
        }
    }
//#endregion
});