import { ClientEvents } from "discord.js";

export class ShitEvent<EType extends keyof ClientEvents> {

    constructor(
        public readonly event: EType,
        public readonly listener: (...args: ClientEvents[EType]) => Promise<any>
    ) {}

}