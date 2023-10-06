import { ApplicationCommandOptionType, ChannelType, ComponentType, GuildMember, TextBasedChannel, TextChannel } from 'discord.js';
import { KCommand } from "../classes/KCommand";
import { LoggingConfigCategory, LoggingConfigType, getSelectMenuOption, getTypes, isTypeLogged, setChannelForCategory, setStateForType } from '../modules/Logging';
import { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from '@discordjs/builders';
import { logDebug } from '../system';
import { log } from 'console';

export default new KCommand({
    name: "logging",
    description: "The main command for logging",

    options: [
        {
            name: "category",
            description: "Which logging category would you like to modify?",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Messages", value: LoggingConfigCategory.MessageEvents },
                { name: "Guild Members (all)", value: LoggingConfigCategory.GuildMembersEvents },
                { name: "Guild", value: LoggingConfigCategory.GuildEvents },
                { name: "Guild Member (single)", value: LoggingConfigCategory.GuildMemberEvents },
                { name: "Voice", value: LoggingConfigCategory.VoiceEvents },
                { name: "Application", value: LoggingConfigCategory.ApplicationEvents },
            ]
        }, {
            name: "channel",
            description: "Set the logging category's output to this channel",
            type: ApplicationCommandOptionType.Channel,
            required: false,
            channelTypes: [ChannelType.GuildText]
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply({ ephemeral: true });

        let category = options.getString("category") as LoggingConfigCategory;
        let channel = options.getChannel("channel");

        if(!(channel instanceof TextChannel))
            return await interaction.editReply({ content: "The given channel is not a text channel!" });

        await setChannelForCategory(interaction.guild, category, channel);

        const select = new StringSelectMenuBuilder()
            .setCustomId("log-" + category)

        let types = getTypes(category);
        select.setMaxValues(types.length);
        select.setMinValues(0);

        for(let i=0; i<types.length; i++) {
            let option = new StringSelectMenuOptionBuilder(getSelectMenuOption(types[i]));

            await isTypeLogged(interaction.guild, types[i]).then((logged) => {
                logDebug(types[i]);
                logDebug(LoggingConfigType.MessagePurged);
                logDebug(logged);
                select.addOptions(option.setDefault(logged));
            }).catch((reason) => {
                logDebug(reason);
                return;
            })
        }
        
        let actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)
        const reply = await interaction.editReply({ components: [actionRow]});
        const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000});
        
        collector.on('collect', async (collectInteract) => {
            for(let i=0; i<types.length; i++) {
                logDebug(types[i]);
                logDebug(collectInteract.values.includes(types[i]));
                await setStateForType(interaction.guild, types[i], collectInteract.values.includes(types[i]));
            }

            await collectInteract.reply({ content: "Successfully modified logging properties for category `" + category + "`", ephemeral: true });
        });
    }
});