import { ActionRowBuilder, ApplicationCommandOptionType, BooleanCache, ButtonBuilder, ButtonStyle, ComponentType, InteractionResponse } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { getVoiceConnection } from "@discordjs/voice";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "shuffle",
    description: "Shuffles the queue of songs",

    options: [
        {
            name: "keepplaying",
            description: "Keep the currently playing song at the front of the queue or not",
            type: ApplicationCommandOptionType.Boolean,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        if (Media.isDisabled())
            return interaction.reply({ content: "The media module is disabled. Please visit https://github.com/Odogo/ShitpostBot/issues/55 for more information." });
        
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        const keepPlaying = options.getBoolean("keepplaying", true);

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

        const message = keepPlaying
            ? "The currently playing song will be kept at the front of the queue and playback will not be disrupted!"
            : "Playback will be disrupted and the currently playing song will be moved to a random position in the queue!";

        const response = await interaction.reply({ content: `## Hold Up!\n Are you sure you want to shuffle the queue? ${message}`, components: [actionRow] });
        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60_000, filter: (interaction) => interaction.user.id === member.id });

        collector.on("collect", async (bInteraction) => {
            if (bInteraction.customId === "confirm_clear") {
                await bInteraction.deferUpdate();
                await Media.shuffleQueue(guild, keepPlaying).then(async (result) => {
                    switch (result) {
                        case true: return await bInteraction.followUp({ content: "The queue was shuffled without disruptions!", components: [] });
                        case false: return await bInteraction.followUp({ content: (keepPlaying ? "The queue was shuffled without disruptions!" : "The queue was shuffled with the currently playing song moved to a random position! (due to an error)"), components: [] });
                        case null: return await bInteraction.followUp({ content: "The queue is empty, there is nothing to shuffle!", components: [] });
                    }
                });
            } else if (bInteraction.customId === "cancel_clear") {
                await bInteraction.update({ content: "Action cancelled! The queue will remain the same!", components: [] });
            }

            collector.stop();
        });
    }
})