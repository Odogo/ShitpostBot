import { getVoiceConnection } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "clear",
    description: "Clears the queue and stops the player. Use with caution!",
    
    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        const actionRow = new ActionRowBuilder<ButtonBuilder>({
            components: [
                new ButtonBuilder({
                    customId: "confirm_clear",
                    label: "Confirm",
                    style: ButtonStyle.Success,
                    emoji: "✅"

                }),
                new ButtonBuilder({
                    customId: "cancel_clear",
                    label: "Cancel",
                    style: ButtonStyle.Danger,
                    emoji: "❌"
                })
            ]
        });

        const response = await interaction.reply({ content: "## Hold Up!\n Are you sure you want to clear the queue? This action cannot be undone!", components: [actionRow] });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000, filter: (interaction) => interaction.user.id === member.id });

        collector.on("collect", async (bInteraction) => {
            if (bInteraction.customId === "confirm_clear") {
                await Media.removeAllQueueItems(guild);
                await Media.skipMediaPlayer(guild);

                await bInteraction.update({ content: "The queue has been cleared and the player has been stopped!", components: [] });
            } else if (bInteraction.customId === "cancel_clear") {
                await bInteraction.update({ content: "Action cancelled! The queue and player will continue!", components: [] });
            }

            collector.stop();
        });
    }
})