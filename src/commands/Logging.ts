import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ComponentType, StringSelectMenuBuilder, StringSelectMenuComponent } from 'discord.js';
import { KCommand } from "../classes/KCommand";
import { LoggingConfigCategory, hasCategoryLoggedInChannel, setCategoriesForChannel } from '../modules/Logging';
import { logDebug } from '../system';

export default new KCommand({
    name: "logging",
    description: "The main command for logging",

    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: "category",
            description: "Select which categories we should start logging into a channel",
        
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: "channel",
                    description: "Which channel are we going to modify?",
                    required: true,
                    channelTypes: [ChannelType.GuildText]
                }
            ]
        }, {
            type: ApplicationCommandOptionType.Subcommand,
            name: "types",
            description: "Select a category to modify the types associated",

            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: "category",
                    description: "Which logging category would you want to modify?",
                    required: true,
                    choices: [
                        { name: "Messages", value: LoggingConfigCategory.MessageEvents },
                        { name: "Guild Members (all)", value: LoggingConfigCategory.GuildMembersEvents },
                        { name: "Guild", value: LoggingConfigCategory.GuildEvents },
                        { name: "Guild Member (single)", value: LoggingConfigCategory.GuildMemberEvents },
                        { name: "Voice", value: LoggingConfigCategory.VoiceEvents },
                        { name: "Application", value: LoggingConfigCategory.ApplicationEvents },
                    ]
                }
            ]
        }
    ],

    run: async (client, interaction, options) => {
        if(interaction.guild === null) {
            return await interaction.reply({ content: "There was no guild associated with this interaction. If you think this is a mistake, try again, or report a bug.", ephemeral: true });
        }

        let selfMember = await interaction.guild.members.fetchMe();
        let subCommand = options.getSubcommand();

        if(subCommand === "category") {
            let channel = options.getChannel("channel", true, [ChannelType.GuildText]);

            if(!channel.permissionsFor(selfMember)) {
                return await interaction.reply({ content: "I do not have permission for this channel.", ephemeral: true });
            }

            const selectMenu = new StringSelectMenuBuilder({
                customId: "logging-category",
                minValues: 0,
                maxValues: 6,
                options: [
                    { 
                        label: "Messages", value: LoggingConfigCategory.MessageEvents,
                        description: "Message related events: editing, deleting", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.MessageEvents)
                    },
                    { 
                        label: "Guild Members (all)", value: LoggingConfigCategory.GuildMembersEvents,
                        description: "Joining and Leaving events", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.GuildMembersEvents)
                    },
                    { 
                        label: "Guild", value: LoggingConfigCategory.GuildEvents,
                        description: "Events pretaining to guild updates", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.GuildEvents)
                    },
                    { 
                        label: "Guild Member (single)", value: LoggingConfigCategory.GuildMemberEvents,
                        description: "Events pretaining to updates of a single member", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.GuildMemberEvents)
                    },
                    { 
                        label: "Voice", value: LoggingConfigCategory.VoiceEvents,
                        description: "Joining, Leaving, Moving voice channels events", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.VoiceEvents)
                    },
                    { 
                        label: "Application", value: LoggingConfigCategory.ApplicationEvents,
                        description: "Logging events pretaining to Shitpost's commands", default: await hasCategoryLoggedInChannel(channel, LoggingConfigCategory.ApplicationEvents)
                    },
                ]
            });

            let actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            const reply = await interaction.reply({ components: [actionRow ]});
            const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000 });

            collector.on('collect', async (collectInteract) => {
                // disable the component

                await setCategoriesForChannel(channel, collectInteract.values as LoggingConfigCategory[]).then(async () => {
                    let stringList = "";
                    (collectInteract.values as LoggingConfigCategory[]).forEach((value) => {
                        stringList += "- " + selectMenu.options.find((v) => v.data.value == value)?.data.label + "\n";
                    })

                    await collectInteract.reply({ content: "Successfully modified the channel for <#" + channel.id + "> to allow types to be logged: \n" + stringList});
                }).catch(async (reason) => {
                    await collectInteract.reply({ content: "Failed to update database: " + reason });
                });
            });
        } else if(subCommand === "types") {
            let category = options.getString("category", true) as LoggingConfigCategory;

        }
    }
});