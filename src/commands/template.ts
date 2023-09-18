import { KyCommand } from "../structure/classes/discord/KyCommand";

export default new KyCommand({
    name: "test",
    description: "A testing command!",
    run: async (client, interaction, options) => {
        await interaction.reply("test!");
    }
});