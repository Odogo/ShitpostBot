import { ApplicationCommandOptionType } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";

import { ShitCommand } from "../../structure/ShitCommand";
import { RepeatingType } from '../../structure/database/media/MediaPlayer';
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "repeat",
    description: "Toggles the various repeat modes for the media player",

    options: [
        {
            name: "mode",
            description: "The repeat mode to set",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "None",
                    value: RepeatingType.NoRepeat
                },
                {
                    name: "Single",
                    value: RepeatingType.Song
                },
                {
                    name: "Queue",
                    value: RepeatingType.Playlist
                }
            ]
        }
    ],

    run: async (client, interaction, options) => {
        if (!interaction.inGuild()) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        const guild = await client.guilds.fetch(interaction.guildId);
        const member = await guild.members.fetch(interaction.user.id);

        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I am not connected to a voice channel, and thus not playing anything.", ephemeral: true });

        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        if (voiceState.channel.id !== connection.joinConfig.channelId) return interaction.reply({ content: "You must be in the same voice channel as I am to use this command!", ephemeral: true });

        const mode = options.getString("mode") as RepeatingType | null;
        if (mode === null) {
            await interaction.reply({ content: `The current repeat mode is: \`${parseRepeatingType(await Media.fetchRepeating(guild))}\`` });
        } else {
            await Media.updateGRepeating(guild, mode);
            await interaction.reply({ content: `The repeat mode has been set to: \`${parseRepeatingType(mode)}\`` });
        }
    }
});

function parseRepeatingType(type: RepeatingType): string {
    switch (type) {
        case RepeatingType.NoRepeat:
            return "None";
        case RepeatingType.Song:
            return "Single";
        case RepeatingType.Playlist:
            return "Queue";
    }
}