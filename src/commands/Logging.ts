import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ChannelType, ComponentType, StringSelectMenuBuilder } from 'discord.js';
import { KCommand } from "../classes/KCommand";
import { LoggingConfigCategory, isCategoryLogged, setChannelForCategory } from '../modules/Logging';

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
                        description: "Message related events: editing, deleting", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.MessageEvents) !== undefined)
                    },
                    { 
                        label: "Guild Members (all)", value: LoggingConfigCategory.GuildMembersEvents,
                        description: "Joining and Leaving events", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.GuildMembersEvents) !== undefined)
                    },
                    { 
                        label: "Guild", value: LoggingConfigCategory.GuildEvents,
                        description: "Events pretaining to guild updates", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.GuildEvents) !== undefined)
                    },
                    { 
                        label: "Guild Member (single)", value: LoggingConfigCategory.GuildMemberEvents,
                        description: "Events pretaining to updates of a single member", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.GuildMemberEvents) !== undefined)
                    },
                    { 
                        label: "Voice", value: LoggingConfigCategory.VoiceEvents,
                        description: "Joining, Leaving, Moving voice channels events", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.VoiceEvents) !== undefined)
                    },
                    { 
                        label: "Application", value: LoggingConfigCategory.ApplicationEvents,
                        description: "Logging events pretaining to Shitpost's commands", default: (await isCategoryLogged(interaction.guild, LoggingConfigCategory.ApplicationEvents) !== undefined)
                    },
                ]
            });

            let actionRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            const reply = await interaction.reply({ components: [actionRow ]});
            const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 300_000 });

            collector.on('collect', async (collectInteract) => {
                if(collectInteract.guild == null) return;

                for(let i=0; i<collectInteract.values.length; i++) {
                    await setChannelForCategory(collectInteract.guild, collectInteract.values[i] as LoggingConfigCategory, channel);
                }

                await interaction.deleteReply();
                await collectInteract.reply({ content: "Successfully modified the channel for <#" + channel.id + "> to allow" });
            });
        } else if(subCommand === "types") {
            let category = options.getString("category", true) as LoggingConfigCategory;

        }
    }
});