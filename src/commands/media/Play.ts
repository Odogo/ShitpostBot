import { ApplicationCommandOptionType } from "discord.js";
import { KyCommand } from "../../structure/classes/discord/KyCommand";
import { SongDetails } from "../../structure/classes/SongDetails";
import { MediaManager } from "../../structure/classes/MediaManager";

export default new KyCommand({
    name: "play",
    description: "Joins your voice channel and gets ready to play music!",
    options: [
        {
            name: "song",
            description: "A query of keywords or a URL to search for the song!",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],

    run: async (client, interaction, options) => {
        await interaction.deferReply();

        let songDatas = new Array<SongDetails>();
        await MediaManager.finalizeURL(options.getString("song")).then((tracks) => {
            let time = Date.now();
            for(let i=0; i<tracks.length; i++) songDatas.push(new SongDetails(tracks[i], interaction.member.id, "" + time));
        }).catch(async (error) => {
            await interaction.followUp({ content: "Could not validate URL, attempting to search via keywords!", ephemeral: true });
        });
    }
});