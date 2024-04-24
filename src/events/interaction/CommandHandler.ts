import { APIEmbedField, ApplicationCommandAttachmentOption, ApplicationCommandOption, ApplicationCommandOptionBase, ApplicationCommandOptionType, ChatInputCommandInteraction, CommandInteractionOption, CommandInteractionOptionResolver, Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { logInfo, logWarn } from "../../system";
import { Logging } from "../../structure/modules/Logging";
import { MLoggingCategoryKeys, MLoggingTypeKeys } from "../../structure/database/MLogging";
import { ShitLogging } from "../../structure/ShitLogging";

export default new ShitEvent(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

    if(!interaction.guild) {
        return await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    }

    const command = client.commands.get(interaction.commandName);
    if(!command) {
        logWarn("[Command] Command " + interaction.commandName + " does not exist, despite being called?");
        return await interaction.reply({ content: "This command is somehow non-existent.", ephemeral: true });
    }

    await command.run(client, interaction, interaction.options as CommandInteractionOptionResolver)
        .then(async () => {
            logInfo("[Command] Handled command " + interaction.commandName + " from " + interaction.user.username + " in " + interaction.guild?.name);
        }).catch(async (reason) => {
            logWarn("[Command] Failed to handle command " + interaction.commandName + " from " + interaction.user.username + " in " + interaction.guild?.name + ": " + reason);
            logWarn(reason);

            if(!interaction.replied) 
                await interaction.reply({ content: "An error occurred while processing this command.\n" + reason, ephemeral: true });
            else 
                await interaction.followUp({ content: "An error occurred while processing this command.\n" + reason, ephemeral: true });
        });
});

function parseEmbedField(value: CommandInteractionOption | null): APIEmbedField | null {
    if(value == null) return null;
    switch(value.type) {
        case ApplicationCommandOptionType.Subcommand: {
            return {
                name: value.name,
                value: "Subcommand",
                inline: false
            };
        }

        case ApplicationCommandOptionType.SubcommandGroup: {
            return {
                name: value.name,
                value: "Subcommand Group",
                inline: false
            };
        }

        case ApplicationCommandOptionType.String: {
            return {
                name: value.name,
                value: value.value as string,
                inline: false
            };
        }

        case ApplicationCommandOptionType.Integer: {
            return {
                name: value.name,
                value: (value.value as number).toString(),
                inline: false
            };
        }

        case ApplicationCommandOptionType.Boolean: {
            return {
                name: value.name,
                value: (value.value as boolean).toString(),
                inline: false
            };
        }

        case ApplicationCommandOptionType.User: {
            return {
                name: value.name,
                value: "<@" + (value.user?.id) + ">",
                inline: false
            };
        }

        case ApplicationCommandOptionType.Channel: {
            return {
                name: value.name,
                value: "<#" + (value.channel?.id) + ">",
                inline: false
            };
        }

        case ApplicationCommandOptionType.Role: {
            return {
                name: value.name,
                value: "<@&" + (value.role?.id) + ">",
                inline: false
            };
        }

        case ApplicationCommandOptionType.Mentionable: {
            console.log(value);
            return {
                name: value.name,
                value: "Mentionable?",
                inline: false
            };
        }

        case ApplicationCommandOptionType.Number: {
            return {
                name: value.name,
                value: (value.value as number).toString(),
                inline: false
            };
        }

        case ApplicationCommandOptionType.Attachment: {
            return {
                name: value.name,
                value: value.attachment!.url,
                inline: false
            };
        }
    }
}

async function logSuccessfulCommand(interaction: ChatInputCommandInteraction) {
    if(!interaction.guild) return;
    if(!interaction.command) return;
    const { guild, command } = interaction;

    logInfo("[Command] Handled command " + command.name + " from " + interaction.user.username + " in " + guild.name);

    // Log command usage
    let isLogging = await Logging.isGuildLoggingType(guild, MLoggingTypeKeys.CommandExecuted);
    if(!isLogging) return;

    let logChannel = await Logging.collectChannelsToLog(guild, MLoggingCategoryKeys.CommandEvents);
    if(logChannel.length <= 0) return;

    const embed = ShitLogging.fetchBaseEmbed(interaction.user, {
        color: Logging.EmbedColors.add,
        description: "The command `" + command.name + "` was executed successfully."
    });
    
    command.options.map((option) => parseEmbedField(interaction.options.get(option.name, false)));
}