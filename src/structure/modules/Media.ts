import provider from "play-dl";
import { MediaQueueItem, QueueItemSong, QueueItemType } from "../database/MediaQueueItem";
import { Guild } from "discord.js";

/**
 * This class is the manager for handling connections to the database through {@link MMusicPlayer} and {@link MMusicQueue}
 * @author Kyomi
 */
export class Media {

    /**
     * Fetches all queue items from the database.
     * @returns A promise that resolves with an array of {@link MediaQueueItem}
     */
    public static async fetchAllQueueItems(): Promise<Array<MediaQueueItem>> { return MediaQueueItem.findAll(); }

    /**
     * Fetches all queue items from the database for a specific guild.
     * @param guild The guild to fetch queue items for
     * @returns A promise that resolves with an array of {@link MediaQueueItem}
     */
    public static async fetchQueueItems(guild: Guild): Promise<Array<MediaQueueItem>> {
        return MediaQueueItem.findAll({ where: { guildId: guild.id } });
    }

    /**
     * Fetches all songs from all queue items for a specific guild.
     * @param guild The guild to fetch queue items for
     * @returns A promise that resolves with an array of {@link QueueItemSong}
     */
    public static async fetchQueueItemSongs(guild: Guild): Promise<QueueItemSong[]> {
        // Fetch all queue items for the guild, then fetch all songs from each item
        // Then flatten the array and filter out invalid songs (if any)
        return Promise.all
            (
                (
                    await this.fetchQueueItems(guild)
                ).map(
                    item => item.getSongs()
                )
        ).then(
            arrays => arrays.flat().filter(
                song => song !== QueueItemType.INVALID
            )
        );
    }
    
}