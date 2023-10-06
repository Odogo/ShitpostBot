import { CommandInteractionOptionResolver, Events } from "discord.js";
import { KEvent } from "../../classes/KEvent";
import { logError, logInfo, logWarn } from "../../system";
import { client } from "../..";
import { KInteraction } from "../../interfaces/KInteraction";

export default new KEvent(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

    logInfo("[CommandManager] Incoming command for interaction id: " + interaction.id);
    const findCommand = client.commands.get(interaction.commandName);
    if(!findCommand) {
        logWarn("[CommandManager] Command " + interaction.commandName + " does not exist, despite being executed?");
        return await interaction.reply("This command is somehow non-existant.");
    }

    logInfo("[CommandManager] Command found for interaction id: " + interaction.id + ", attempting execution!");
    await findCommand.run(client, interaction as KInteraction, interaction.options as CommandInteractionOptionResolver).then(() => {
        logInfo("[CommandManager] Command successfully executed for interaction id: " + interaction.id);
    }).catch(async (reason) => {
        logError("[CommandManager] Command execution failed, with given reason: " + reason);
        logError(reason);

        if(!interaction.replied)
            await interaction.reply("Failed to execute command: " + reason);
        else   
            await interaction.followUp("Failed to execute command: " + reason);
    });
});