import { ApplicationCommandOptionType, ApplicationCommandType, PermissionFlagsBits } from "discord.js";
import { ShitCommand } from "../../structure/ShitCommand";
import { parseVoiceRegion, VoiceRegion } from "../../structure/enums/VoiceRegion";
import { ChannelFlex } from "../../structure/modules/ChannelFlex";

export default new ShitCommand({
    name: "voicechange",
    description: "Modifies some voice channel settings, like region and limit.",

    options: [
        {
            name: "region",
            description: "The region to set the voice channel to.",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Automatic", value: VoiceRegion.Automatic },
                { name: "Brazil", value: VoiceRegion.Brazil },
                { name: "Hong Kong", value: VoiceRegion.HongKong },
                { name: "India", value: VoiceRegion.India },
                { name: "Japan", value: VoiceRegion.Japan },
                { name: "Rotterdam", value: VoiceRegion.Rotterdam },
                { name: "Russia", value: VoiceRegion.Russia },
                { name: "Singapore", value: VoiceRegion.Singapore },
                { name: "South Korea", value: VoiceRegion.SouthKorea },
                { name: "South Africa", value: VoiceRegion.SouthAfrica },
                { name: "Sydney", value: VoiceRegion.Sydney },
                { name: "US Central", value: VoiceRegion.USCentral },
                { name: "US East", value: VoiceRegion.USEast },
                { name: "US South", value: VoiceRegion.USSouth },
                { name: "US West", value: VoiceRegion.USWest },
            ]
        },
        {
            name: "limit",
            description: "The user limit for the voice channel.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 0,
            max_value: 99
        }
    ],

    run: async (client, interaction, options) => {
        const guild = interaction.guild;
        if(!guild) return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });

        const member = await guild.members.fetch(interaction.user.id);
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({ content: "You need to be in a voice channel to use this command.", ephemeral: true });
        }

        if (!(await guild.members.fetchMe()).permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "I need the `MANAGE_CHANNELS` permission to use this command.", ephemeral: true });
        }
        
        const regionInput = options.getString("region");
        const limitInput = options.getInteger("limit");

        let message = "Voice channel settings updated.";

        let regionFailed = false, limitFailed = false;

        if (regionInput) {
            if (await ChannelFlex.canModifyRegion(voiceChannel) === false && regionInput !== VoiceRegion.Automatic && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                message += " Region modification is disabled for this channel.";
                regionFailed = true;
            } else {
                const region = parseVoiceRegion(regionInput);
                await voiceChannel.setRTCRegion(region, "Region change requested by " + interaction.user.tag);
                message += ` Region set to ${region}.`;
            }
        }

        if (limitInput !== null) {
            if (await ChannelFlex.canModifyLimit(voiceChannel) === false && !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                message += " User limit modification is disabled for this channel.";
                limitFailed = true;
            } else {
                await voiceChannel.setUserLimit(limitInput, "User limit change requested by " + interaction.user.tag);
                message += ` User limit set to ${limitInput}.`;
            }
        }

        if (regionFailed && limitFailed) message = "Failed to update voice channel settings, both region and limit modification are disabled for this channel.";
        else if (regionInput && limitFailed) message = "Limit modification failed (disabled), region was successfully updated.";
        else if (limitInput !== null && regionFailed) message = "Region modification failed (disabled), limit was successfully updated.";

        return interaction.reply({ content: message });
    }
});