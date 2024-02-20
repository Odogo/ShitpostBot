import { CommandInteractionOptionResolver, Events } from "discord.js";
import { ShitEvent } from "../../structure/ShitEvent";
import { client } from "../..";
import { logInfo, logWarn } from "../../system";

export default new ShitEvent(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

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
            
            if(!interaction.replied) return await interaction.reply({ content: "An error occurred while processing this command.\n" + reason, ephemeral: true });
            else return await interaction.followUp({ content: "An error occurred while processing this command.\n" + reason, ephemeral: true });
        });
});