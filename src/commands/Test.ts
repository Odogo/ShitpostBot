import { ShitCommand } from "../structure/ShitCommand";

export default new ShitCommand({
    name: "test",
    description: "A simple test command",

    run: async (client, interaction, options) => {
        await interaction.reply({ content: "Test command!" });
    }
});