import { DiscordGatewayAdapterCreator, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "join",
    description: "Joins the voice channel of the user who issued the command",

    run: async (client, interaction, options) => {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });
        
        const member = await guild.members.fetch(interaction.user.id);
        const voiceState = member.voice;
        if (!voiceState.channel) return interaction.reply({ content: "You must be in a voice channel to use this command!", ephemeral: true });
        
        const channel = voiceState.channel;
        if (!channel.joinable || !channel.permissionsFor(await guild.members.fetchMe()))
            return interaction.reply({ content: "I don't have permission to join your voice channel!", ephemeral: true });

        if (getVoiceConnection(guild.id) === undefined) {
            await Media.createConnection(guild, channel);
        } else {
            joinVoiceChannel({
                guildId: guild.id,
                channelId: channel.id,
                adapterCreator: guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
                selfMute: false,
                selfDeaf: true
            });
        }

        return interaction.reply({ content: "Joined your voice channel!", ephemeral: true });
    }
})