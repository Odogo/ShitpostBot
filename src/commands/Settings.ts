import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, EmbedBuilder, Guild, GuildMember } from "discord.js";
import { ShitCommand } from "../structure/ShitCommand";
import { MSettingsCategories } from "../structure/types/TSettings";
import { Settings } from "../structure/modules/Settings";
import { logWarn } from "../system";

export default new ShitCommand({
    name: "settings",
    description: "Allows you to modify how the bot handles certain things in your server.",

    options: [],

    run: async (client, interaction, options) => {
        const { guild } = interaction;
        if(!guild) return;

        const member = await guild.members.fetch(interaction.user.id);
        return await HandleMainMenu(guild, member, interaction);
    }
});

export async function HandleMainMenu(
    guild: Guild,
    executor: GuildMember,
    interaction: CommandInteraction | ButtonInteraction
): Promise<any> {
    const embed = new EmbedBuilder({
        title: guild.name + " - Settings",
        description: "Here you may modify specific settings that I will handle for your server." +
            "Each section are different 'modules' that I have, and each module has different settings you can modify.\n\n" +
            "Select a module to view and modify its settings.",
        color: 0x8FFFCD,
        author: {
            name: executor.nickname || executor.user.username,
            iconURL: executor.user.displayAvatarURL()
        }
    });

    const cancel = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel("Cancel")
        .setCustomId("settings:cancel");
    
    const buttons = Object.keys(MSettingsCategories).map((key) => {
        return new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel(key)
            .setCustomId("settings:category:" + key);
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons).addComponents(cancel);

    return await interaction.reply({ embeds: [embed], components: [row] });
}

export async function HandleCategory(
    guild: Guild,
    executor: GuildMember,
    interaction: CommandInteraction | ButtonInteraction,
    category: MSettingsCategories
): Promise<any> {
    const settings = await Settings.fetchMap(guild);
    const entries = Array.from(settings.entries()).filter((entry) => entry[1].category === category).map((entry) => entry[1]);

    const embed = new EmbedBuilder({
        title: guild.name + " - Settings > " + category,
        description: "You are currently viewing the settings for the " + category + " module.\n\n",
        color: 0x8FFFCD,
        author: {
            name: executor.nickname || executor.user.username,
            iconURL: executor.user.displayAvatarURL()
        }
    });

    embed.setDescription(embed.data.description + entries.map((v) => {
        return "`" + v.key + "`: " + v.description + " (default: " + v.defaultValue + ")";
    }).join("\n"));

    const back = new ButtonBuilder()
        .setStyle(ButtonStyle.Secondary)
        .setLabel("Back")
        .setCustomId("settings:cat:back");
    
    const cancel = new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setLabel("Cancel")
        .setCustomId("settings:cat:cancel");
    
    const buttons = entries.map((entry) => {
        return new ButtonBuilder()
            .setStyle(ButtonStyle.Primary)
            .setLabel(entry.key)
            .setCustomId("settings:cat:" + entry.key);
    });
    
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons).addComponents(back).addComponents(cancel);
    
    return await interaction.reply({ embeds: [embed], components: [row] });
}