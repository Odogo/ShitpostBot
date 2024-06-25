import { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { ChannelFlex } from "../../structure/modules/ChannelFlex";

export default new ShitCommand({
    name: "voicesettings",
    description: "Modifies some voice channel settings, like region and limit.",

    options: [
        {
            name: "channel",
            description: "The channel we're modifying.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
            channelTypes: [
                ChannelType.GuildVoice,
                ChannelType.GuildStageVoice
            ]
        },
        {
            name: "regionmodify",
            description: "Whether the region can be modified.",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        },
        {
            name: "limitmodify",
            description: "Whether the limit can be modified.",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],

    run: async (client, interaction, options) => {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        
        const member = await guild.members.fetch(interaction.user.id);
        
        if (!member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "You need the `Manage Channels` permission to use this command.", ephemeral: true });
        }

        const channel = options.getChannel("channel", true, [ChannelType.GuildVoice, ChannelType.GuildStageVoice]);
        const regionModify = options.getBoolean("regionmodify");
        const limitModify = options.getBoolean("limitmodify");

        if (regionModify === null && limitModify === null) {
            return interaction.reply({ content: "You need to specify at least one setting to modify.", ephemeral: true });
        }

        let message = "Successfully modified the channel settings!";

        if(regionModify !== null) {
            await ChannelFlex.setCanModifyRegion(channel, regionModify);
            message += " Region modification is now " + (regionModify ? "enabled" : "disabled") + ".";
        }

        if(limitModify !== null) {
            await ChannelFlex.setCanModifyLimit(channel, limitModify);
            message += " User limit modification is now " + (limitModify ? "enabled" : "disabled") + ".";
        }

        return interaction.reply({ content: message, ephemeral: true });
    }
})