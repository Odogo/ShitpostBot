import { getVoiceConnection } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "playing",
    description: "Shows the currently playing song in the queue",

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        await interaction.reply({ embeds: [await Media.generateNowPlayingEmbed(client, guild)] });
    }
});