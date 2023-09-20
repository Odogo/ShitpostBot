import { ApplicationCommandOptionType } from "discord.js";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { MediaManager } from "../../structure/classes/MediaManager";
import { warn } from "../../utilities/System";

export default new KyCommand({
    name: "queue",
    description: "Generates a report with the current queue of songs [can take a few seconds]",
    options: [
        {
            name: 'page',
            description: 'What page should we display?',
            type: ApplicationCommandOptionType.Integer
        }, {
            name: 'perpage',
            description: 'How many entries should we display?',
            minValue: 5,
            maxValue: 15,
            type: ApplicationCommandOptionType.Integer
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        let page = options.getNumber("page"), perPage = options.getNumber("perpage") || 10;

        if(page == null) {
            let index = await MediaManager.fetchQueueIndex(interaction.guild);
            page = Math.floor(index / perPage) + 1;
        }

        await MediaManager.generateQueueList(interaction.guild, perPage, page).then(async (embed) => {
            await interaction.editReply({ embeds: [embed] });
        }).catch(async (reason) => {
            warn("An error occured while trying to generate a queue list for GID " + interaction.guild.id + " with reason " + reason);
            warn(reason);
            
            return await interaction.editReply({ content: "An error occured while trying to generate the queue list: " + reason });
        });
    }
})