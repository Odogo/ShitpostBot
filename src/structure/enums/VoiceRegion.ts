export enum VoiceRegion {
    Automatic = "automatic",
    Brazil = "brazil",
    HongKong = "hongkong",
    India = "india",
    Japan = "japan",
    Rotterdam = "rotterdam",
    Russia = "russia",
    Singapore = "singapore",
    SouthKorea = "south-korea",
    SouthAfrica = "southafrica",
    Sydney = "sydney",
    USCentral = "us-central",
    USEast = "us-east",
    USSouth = "us-south",
    USWest = "us-west"
}

/**
 * Parses a voice region from a string.
 * If the given string is null, returns the {@link VoiceRegion.Automatic} region.
 * @param query The string to parse.
 * @returns The parsed voice region or {@link VoiceRegion.Automatic} if the string is null or invalid.
 */
export function parseVoiceRegion(query: string | null): VoiceRegion {
    if (!query) return VoiceRegion.Automatic;
    switch (query.toLowerCase()) {
        case "automatic":
            return VoiceRegion.Automatic;
        case "brazil":
            return VoiceRegion.Brazil;
        case "hongkong":
            return VoiceRegion.HongKong;
        case "india":
            return VoiceRegion.India;
        case "japan":
            return VoiceRegion.Japan;
        case "rotterdam":
            return VoiceRegion.Rotterdam;
        case "russia":
            return VoiceRegion.Russia;
        case "singapore":
            return VoiceRegion.Singapore;
        case "south-korea":
            return VoiceRegion.SouthKorea;
        case "southafrica":
            return VoiceRegion.SouthAfrica;
        case "sydney":
            return VoiceRegion.Sydney;
        case "us-central":
            return VoiceRegion.USCentral;
        case "us-east":
            return VoiceRegion.USEast;
        case "us-south":
            return VoiceRegion.USSouth;
        case "us-west":
            return VoiceRegion.USWest;
        default:
            return VoiceRegion.Automatic;
    }
}