import { ApplicationCommandOptionType } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";
import { getVoiceConnection } from "@discordjs/voice";

export default new ShitCommand({
    name: "queue",
    description: "Shows the current queue of songs",

    options: [
        {
            name: 'page',
            description: "What page of the queue to show",
            type: ApplicationCommandOptionType.Integer
        },
        {
            name: "perpage",
            description: "How many songs to show per page",
            type: ApplicationCommandOptionType.Integer
        }
    ],

    run: async (client, interaction, options) => {     
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        let page = options.getInteger("page") || 1;
        let perPage = options.getInteger("perpage") || 10;

        return await Media.generateQueueEmbed(guild, perPage, page).then(async (embed) => {
            await interaction.reply({ embeds: [embed] });
        }).catch(async (error) => {
            await interaction.reply({ content: "There was an error generating the queue embed: " + error, ephemeral: true });
        });
    }
});