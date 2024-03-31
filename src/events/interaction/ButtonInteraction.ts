import { Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import Settings, { HandleCategory, HandleMainMenu } from "../../commands/Settings";
import { MSettingsCategories, MSettingsKeys } from "../../structure/types/TSettings";

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
        return await interaction.update({ components: [], content: "You selected " + key, embeds: [] });
    }
//#endregion
});