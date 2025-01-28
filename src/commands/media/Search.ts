import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import provider from '@recordbot/play-dl';
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "search",
    description: "Search for a specific song through keywords",

    options: [
        {
            name: "query",
            description: "The search query to search for",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        if (Media.isDisabled())
            return interaction.reply({ content: "The media module is disabled. Please visit https://github.com/Odogo/ShitpostBot/issues/55 for more information." });

        const query = options.getString("query", true);

        const search = await provider.search(query, { limit: 10 });
        if (search.length === 0) return interaction.reply({ content: "No results were found for the search query!", ephemeral: true });

        const results = search.map((result, index) => {
            return `${index + 1}. **[${result.title}](${result.url})** by **${result.channel?.name || "Unknown"}**`;
        });

        const embed = new EmbedBuilder({
            author: {
                name: interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL({ extension: 'png', size: 1024 })
            },
            color: 0x94ebff,
            title: "Search Results",
            description: results.join("\n"),
            footer: {
                text: "Right click to copy the URL of the song"
            }
        });

        await interaction.reply({ embeds: [embed] });
    }
});