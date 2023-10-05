import { ApplicationCommandOptionType } from "discord.js";
import { KCommand } from "../classes/KCommand";

export default new KCommand({
    name: "logging",
    description: "The main command for logging",

    options: [
        {
            name: "",
            description: "",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: []
        }
    ],

    run: async (client, interaction, options) => {

    }
});