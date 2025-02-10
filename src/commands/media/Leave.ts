import { getVoiceConnection } from "@discordjs/voice";
import { ShitCommand } from "../../structure/ShitCommand";
import { Media } from "../../structure/modules/Media";

export default new ShitCommand({
    name: "leave",
    description: "Leaves the voice channel",

    run: async (client, interaction, options) => {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "This command can only be used in a server!", ephemeral: true });

        const member = await guild.members.fetch(interaction.user.id);
        
        const connection = getVoiceConnection(guild.id);
        if (!connection) return interaction.reply({ content: "I'm not currently in a voice channel, so there's nothing to leave.", ephemeral: true });
        
        const currentChannelId = connection.joinConfig.channelId;
         const userChannel = member.voice.channel;

        if (!member.permissions.has("ModerateMembers")) 
            if (!userChannel || userChannel.id !== currentChannelId)
                return interaction.reply({ content: "You must be in the same voice channel to use this.", ephemeral: true });
        
        connection.disconnect();
        return interaction.reply({ content: "Left the voice channel!"});
    }
})