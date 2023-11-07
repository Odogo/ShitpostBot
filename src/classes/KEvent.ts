import { ClientEvents } from "discord.js";
import { KObject } from "./KObject";

export class KEvent<Key extends keyof ClientEvents> extends KObject {
    constructor(public event: Key, public run: (...args: ClientEvents[Key]) => any) {
        super("event_" + event);
    }
}