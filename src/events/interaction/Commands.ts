import { CommandInteractionOptionResolver, Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { Client } from "../..";
import { logError, logInfo, logWarn } from "../../system";

export default new ShitEvent(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = Client.commands.get(interaction.commandName);
    if (!command) {
        logWarn("[Commander] Command " + interaction.commandName + " does not exist, despite being called?");
        return await interaction.reply("This command, somehow, does not exist. Please try again.");
    }

    const options = interaction.options as CommandInteractionOptionResolver;
    await command.run(Client, interaction, options)
        .then(() => {
            logInfo("[Commander] Command " + interaction.commandName + " (with " + translateOptions(options) + ") executed successfully for " + interaction.user.username + " (" + interaction.user.id + ")");
        }).catch(async (error) => {
            logError("[Commander] Command " + interaction.commandName + " failed for " + interaction.user.username + " (" + interaction.user.id + "): " + error);
            logError(error);

            if (!interaction.replied || !interaction.deferred)
                return interaction.reply({ content: "An error occurred while executing this command. " + error, ephemeral: true });
            else 
                return interaction.followUp({ content: "An error occurred while executing this command." + error, ephemeral: true });
        });
});

interface StringedOptions {
    [key: string]: string | number | boolean | undefined;
}

function translateOptions(options: CommandInteractionOptionResolver) {
    let stringedOptions: StringedOptions = {};
    options.data.forEach((option) => {
        stringedOptions[option.name] = option.value;
    });

    if(Object.keys(stringedOptions).length === 0) return "no options";
    return "options: " + JSON.stringify(stringedOptions);
}