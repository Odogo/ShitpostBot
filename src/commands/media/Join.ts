import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { MediaManager, PlayingQueueStatus } from "../../structure/classes/MediaManager";
import { ApplicationCommandOptionType } from "discord.js";

export default new KyCommand({
    name: "join",
    description: "Joins your current voice channel, optionally begins processing the queue",
    options: [
        {
            name: "process",
            description: "Should we begin processing the queue at it's current position?",
            type: ApplicationCommandOptionType.Boolean
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        let voiceState = interaction.member.voice;
        if(!voiceState) return await interaction.editReply({ content: "Could not find your voice connection" });
        if(!voiceState.channel) return await interaction.editReply({ content: "Could not find your voice connection" });

        if(!voiceState.channel.joinable || voiceState.channel.permissionsFor(interaction.guild.members.me)) {
            return await interaction.reply({ content: "The voice channel you currently are in is unaccessible to my knowledge." });
        }

        if(getVoiceConnection(interaction.guild.id) == undefined) {
            await MediaManager.createConnection(interaction.guild, voiceState.channel);
        } else {
            joinVoiceChannel({
                guildId: interaction.guild.id,
                channelId: voiceState.channel.id,
                selfMute: false,
                selfDeaf: true,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
        }

        let process = options.getBoolean("process") || false;
        if(process) {
            await MediaManager.setQueueIndex(interaction.guild, (await MediaManager.fetchQueueIndex(interaction.guild)) - 1);

            let result = await MediaManager.beginPlayingQueue(interaction.guild, voiceState.channel, interaction.channel);
            switch(result) {
                case PlayingQueueStatus.NoQueueData: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_queue_data`]"});
                case PlayingQueueStatus.NoSongsInQueue: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_songs_in_queue`]"});
                case PlayingQueueStatus.NoQueueIndex: return await interaction.editReply({ content: "Could not process queue: There is no present data of a queue existing, try making one first! [use `/play`] [Code: `no_queue_index`]"});
                case PlayingQueueStatus.EndOfQueue: return await interaction.editReply({ content: "Could not process queue: End of the queue was reached. [Code: `end_of_queue`]" });
                case PlayingQueueStatus.Success: break;
                default: break;
            }

            return await interaction.editReply({ content: "Successfully joined the voice channel and begun processing the queue!" });
        }
        
        return await interaction.editReply({ content: "Successfully joined the voice channel!" });
    }
});