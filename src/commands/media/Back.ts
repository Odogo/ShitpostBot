import { getVoiceConnection } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "back",
    description: "Plays the previous song in the queue if there is one",

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        await Media.backMediaPlayer(guild).then(async (result) => {
            if (result === true) {
                interaction.reply({ content: "Playing the previous song!" });
            } else if (result === false) {
                interaction.reply({ content: "Cannot go back any further in the queue!", ephemeral: true });
            } else {
                interaction.reply({ content: "There are no songs in the queue to skip! Try adding some with `/play`", ephemeral: true });
            }
        });
    }
});