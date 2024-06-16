import provider from "play-dl";
import { MediaQueueItem, QueueItemSong, QueueItemType } from "../database/MediaQueueItem";
import { Guild, User } from "discord.js";
import { sequelInstance } from "../..";

/**
 * This class is the manager for handling connections to the database through {@link MMusicPlayer} and {@link MMusicQueue}
 * @author Kyomi
 */
export class Media {

    /**
     * Fetches all the queue items from the database
     * @returns The queue items from the database
     */
    public static async fetchAllQueueItems(): Promise<MediaQueueItem[]> {
        return MediaQueueItem.findAll();
    }

    public static async fetchGuildQueueItems(guild: Guild): Promise<MediaQueueItem[]> {
        return MediaQueueItem.findAll({ where: { guildId: guild.id } });
    }

    public static async generateQueueSongs(queueItems: MediaQueueItem[]): Promise<QueueItemSong[]> {
        const songs: QueueItemSong[] = [];

        for (const item of queueItems) {
            console.log("attempting item: " + item);

            const itemSongs = await item.getSongs();
            if (itemSongs === QueueItemType.INVALID) continue;
            if (Array.isArray(itemSongs)) {
                songs.push(...itemSongs);
            } else {
                songs.push(itemSongs);
            }
        }
        console.log(songs);

        return songs.sort((a, b) => a.queueIndex - b.queueIndex).sort((a, b) => a.playlistIndex - b.playlistIndex);
    }

    public static async createQueueItem(guild: Guild, requestor: User, mediaUrl: string): Promise<MediaQueueItem> {
        return sequelInstance.transaction(async (transaction) => {
            const maxQueuePosition = await MediaQueueItem.max("queuePosition", {
                where: { guildId: guild.id },
                transaction
            }) as number | null;

            const nextQueuePosition = maxQueuePosition === null ? 0 : maxQueuePosition + 1;
        
            return await MediaQueueItem.create({
                guildId: guild.id,
                requestorId: requestor.id,
                songUrl: mediaUrl,
                queuePosition: nextQueuePosition
            }, { transaction });
        });
    }
}