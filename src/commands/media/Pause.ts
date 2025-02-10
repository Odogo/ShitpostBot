import { getVoiceConnection } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "pause",
    description: "Pauses the media player, if it is playing",

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        await Media.toggleMediaPlayer(guild, false);
        await interaction.reply({ content: "The player has been paused! You can unpause it with `/resume`" });
    }
});