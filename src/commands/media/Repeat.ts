import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { getVoiceConnection } from "@discordjs/voice";
import { MediaManager } from "../../structure/classes/MediaManager";
import { warn } from "../../utilities/System";

export default new KyCommand({
    name: "repeat",
    description: "Displays [or sets] the current status of the repeating system",
    options: [
        {
            name: "repeating",
            description: "Sets whether or not we should repeat?",
            required: false,
            type: ApplicationCommandOptionType.Boolean
        }, {
            name: "state",
            description: "How should the bot repeat the queue?",
            required: false,
            choices: [
                { name: "Single", value: "single"},
                { name: "Entire Queue", value: "list" }
            ],
            type: ApplicationCommandOptionType.String
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        const connection = getVoiceConnection(interaction.guild.id);
        if(!connection)
            return await interaction.editReply({ content: "There is no active connection to modifyy a repeat system on. "});

        let voiceState = interaction.member.voice;
        if(!voiceState || !voiceState.channel || voiceState.channel.id !== connection.joinConfig.channelId)
            return await interaction.editReply({ content: "You must be in the same voice channel as I am to execute this!" });

        let inRepeat = options.getBoolean("repeating");
        let inState = options.getString("state");

        let repeating = await MediaManager.isRepeating(interaction.guild);
        let repeatState = await MediaManager.fetchRepeatState(interaction.guild);

        if(repeating == undefined || repeatState == undefined)
            return await interaction.editReply({ content: "Could not fetch the current data for repeat status. Try playing a song before using this command!" });

        if(inRepeat == null && inState == null) {
            return await interaction.editReply({ embeds: [new EmbedBuilder({
                color: 0x5586fa,
                footer: { text: "Repeating Status" },
                timestamp: Date.now(),
                fields: [
                    { name: "Repeating", value: (repeating ? "Yes": "No") },
                    { name: "Repeating State", value: repeatState }
                ],
                author: {
                    name: (interaction.member.nickname == null ? MediaManager.capFirstChar(interaction.member.displayName): MediaManager.capFirstChar(interaction.member.nickname)),
                    icon_url: interaction.user.avatarURL({extension: 'png', size: 4096})
                }
            })]});
        }

        let stateFn = (state: string): "single" | "list" | "keep" => {
            switch(state.toLowerCase()) {
                case "single": return "single";
                case "list": return "list";
                default: return "keep";
            }
        }

        await MediaManager.setRepeating(interaction.guild, inRepeat, stateFn(inState)).then(async () => {
            return await interaction.editReply({ embeds: [new EmbedBuilder({
                color: 0x5586fa,
                footer: { text: "Repeating Status" },
                timestamp: Date.now(),
                title: "Updated values",
                fields: [
                    { name: "Repeating", value: (repeating ? "Yes": "No") + " -> " + (inRepeat ? "Yes": "No") },
                    { name: "Repeating State", value: repeatState + " -> " + inState }
                ],
                author: {
                    name: (interaction.member.nickname == null ? MediaManager.capFirstChar(interaction.member.displayName): MediaManager.capFirstChar(interaction.member.nickname)),
                    icon_url: interaction.user.avatarURL({extension: 'png', size: 4096})
                }
            })]});
        }).catch(async (error) => {
            warn("An error occured while modifying the repeat state(s) of GID " + interaction.guild.id + " with reason: " + error);
            warn(error);

            await interaction.editReply({ content: "An error occured while attempting to modify the repeat state(s): " + error});
        });
    }
})