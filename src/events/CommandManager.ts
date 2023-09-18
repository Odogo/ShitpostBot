import { CommandInteractionOptionResolver, Events } from "discord.js";
import { KyEvent } from "../structure/classes/discord/KyEvent";
import { error, info, warn } from "../utilities/System";
import { client } from "..";
import { KyInteraction } from "../structure/interfaces/KyInteraction";

export default new KyEvent(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isCommand()) return;

    info("[CommandManager] Incoming command for interaction id: " + interaction.id);
    const findCommand = client.commands.get(interaction.commandName);
    if(!findCommand) {
        warn("[CommandManager] Command " + interaction.commandName + " does not exist, despite being executed?");
        return await interaction.reply("This command is somehow non-existant.");
    }

    info("[CommandManager] Command found for interaction id: " + interaction.id + ", attempting execution!");
    await findCommand.run(client, interaction as KyInteraction, interaction.options as CommandInteractionOptionResolver).then(() => {
        info("[CommandManager] Command successfully executed for interaction id: " + interaction.id);
    }).catch(async (reason) => {
        error("[CommandManager] Command execution failed, with given reason: " + reason);
        error(reason);
        
        await interaction.reply("Failed to execute command: " + reason);
    });
});