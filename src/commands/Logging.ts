import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ComponentType, StringSelectMenuBuilder, StringSelectMenuComponent, StringSelectMenuOptionBuilder } from 'discord.js';
import { KCommand } from "../classes/objects/KCommand";
import { getGuildLoggingTypes, hasCategoryLoggedInChannel, setCategoriesForChannel, setGuildLoggingTypes } from '../modules/Logging';
import { LoggingConfigCategory } from '../enums/logging/LoggingConfigCategory';
import { LoggingConfigType } from '../enums/logging/LoggingConfigType';

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
            const reply = await interaction.reply({ components: [actionRow], ephemeral: true });
            const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000 });

            collector.on('collect', async (collectInteract) => {
                let component = collectInteract.message.components[0].components[0] as StringSelectMenuComponent;
                await interaction.editReply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder(component.data).setDisabled(true))]});

                await setCategoriesForChannel(channel, collectInteract.values as LoggingConfigCategory[]).then(async () => {
                    let stringList = "";
                    (collectInteract.values as LoggingConfigCategory[]).forEach((value) => {
                        stringList += "- " + selectMenu.options.find((v) => v.data.value == value)?.data.label + "\n";
                    })

                    await collectInteract.reply({ content: "Successfully modified the channel for <#" + channel.id + "> to allow types to be logged: \n"
                        + (stringList.length !== 0 ? stringList: "- No categories are active for this channel")});
                }).catch(async (reason) => {
                    await collectInteract.reply({ content: "Failed to update database: " + reason, ephemeral: true });
                });
            });
        } else if(subCommand === "types") {
            let category = options.getString("category", true) as LoggingConfigCategory;

            const select = new StringSelectMenuBuilder({ customId: "logging-types" });

            let types = LoggingConfigCategory.getTypes(category);
            select.setMinValues(0).setMaxValues(types.length);

            let loggingTypes = await getGuildLoggingTypes(interaction.guild, category);

            for(let i = 0; i < types.length; i++) {
                let option = new StringSelectMenuOptionBuilder(LoggingConfigType.getSelectMenuOption(types[i]));
                select.addOptions(option.setDefault(loggingTypes.get(types[i])));
            }

            let actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);
            const reply = await interaction.reply({ components: [actionRow] });
            const collection = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000 });

            collection.on('collect', async (collectInteract) => {
                if(collectInteract.guild === null) return;

                let component = collectInteract.message.components[0].components[0] as StringSelectMenuComponent;
                await interaction.editReply({ components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder(component.data).setDisabled(true))]});

                await setGuildLoggingTypes(collectInteract.guild, category, collectInteract.values as LoggingConfigType[]).then(async () => {
                    let stringList = "";
                    (collectInteract.values as LoggingConfigCategory[]).forEach((value) => {
                        stringList += "- " + select.options.find((v) => v.data.value == value)?.data.label + "\n";
                    });
                    await collectInteract.reply({ content: "Successfully modified the guild's active logging types in category `" + category + "` to: \n"
                        + (stringList.length !== 0 ? stringList : "- No types are logged in this category")});
                }).catch(async (reason) => {
                    await collectInteract.reply({ content: "Failed to update database: " + reason, ephemeral: true });
                });
            });
        }
    }
});