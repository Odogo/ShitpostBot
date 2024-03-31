/**
 * An internal type to represent the settings of a guild.
 * @author Kyomi
 */
export type InternalSettingsAttribute = Map<MSettingsKeys, MSettingsEntry<MSettingsKeys>>;

/**
 * Keys for settings that can be set for a guild.
 * @author Kyomi
 */
export enum MSettingsKeys {
    showDisabledPerms = "showDisabledPerms",
    punishmentKey = "punishmentKey",
}

/**
 * Categories for each setting key to be placed in.
 * This is used to group settings in the settings command.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsValues} for the values
 * @see {@link MSettingsDescriptions} for the descriptions
 * @see {@link MSettingsDefaultValues} for the default values
 * @author Kyomi
 */
export enum MSettingsCategories {
    Logging = "Logging",
    Punishments = "Punishments",
}

/**
 * Values for each setting key that can be set for a guild.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsDefaultValues} for the default values
 * @see {@link MSettingsDescriptions} for the descriptions
 * @see {@link MSettingsKeyCategory} for the categories
 * @author Kyomi
 */
export interface MSettingsValues {
    [MSettingsKeys.showDisabledPerms]: boolean;
    [MSettingsKeys.punishmentKey]: string | null;
}

/**
 * Default values for each setting key that can be set for a guild.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsValues} for the values
 * @see {@link MSettingsDescriptions} for the descriptions
 * @see {@link MSettingsKeyCategory} for the categories
 * @author Kyomi
 */
export class MSettingsDefaultValues {
    static instance = new MSettingsDefaultValues();

    [MSettingsKeys.showDisabledPerms] = false;
    [MSettingsKeys.punishmentKey] = null;
}

/**
 * Descriptions for each setting key that can be set for a guild.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsValues} for the values
 * @see {@link MSettingsDefaultValues} for the default values
 * @see {@link MSettingsKeyCategory} for the categories
 * @author Kyomi
 */
class MSettingsDescriptions {
    static instance = new MSettingsDescriptions();

    [MSettingsKeys.showDisabledPerms] = "Shows disabled permissions when 'Administrator' gets disabled";
    [MSettingsKeys.punishmentKey] = "Used to link guilds with one another to syncronize punishments data";
}

/**
 * Categories for each setting key to be placed in.
 * This is used to group settings in the settings command.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsValues} for the values
 * @see {@link MSettingsDescriptions} for the descriptions
 * @see {@link MSettingsDefaultValues} for the default values
 * @author Kyomi
 */
class MSettingsKeyCategory {
    static instance = new MSettingsKeyCategory();

    [MSettingsKeys.showDisabledPerms] = MSettingsCategories.Logging;
    [MSettingsKeys.punishmentKey] = MSettingsCategories.Punishments;
}

/**
 * A class to represent a single setting entry for a guild.
 * @see {@link MSettingsKeys} for the keys
 * @see {@link MSettingsValues} for the values
 * @see {@link MSettingsDescriptions} for the descriptions
 * @see {@link MSettingsDefaultValues} for the default values
 * @see {@link MSettingsKeyCategory} for the categories
 * 
 * @param TKey the key of the setting
 * 
 * @example
 * console.log(entry.key); // "showDisabledPerms"
 * console.log(entry.description); // "Shows disabled permissions when 'Administrator' gets disabled"
 * console.log(entry.category); // "Logging"
 * console.log(entry.value); // false
 * console.log(entry.defaultValue); // false
 * 
 * @author Kyomi
 */
export class MSettingsEntry<TKey extends MSettingsKeys> {
    public key: TKey;
    public description: string;
    public category: MSettingsCategories;

    public value: MSettingsValues[TKey];
    public defaultValue: MSettingsValues[TKey];

    constructor(key: TKey) {
        this.key = key;

        this.description = MSettingsDescriptions.instance[key];
        this.category = MSettingsKeyCategory.instance[key];

        this.defaultValue = MSettingsDefaultValues.instance[key];
        this.value = MSettingsDefaultValues.instance[key];
    }
}

/**
 * A function to generate the default settings for a new entry.
 * @returns A map with the default settings.
 */
export function defaultSettings(): InternalSettingsAttribute {
    return new Map<MSettingsKeys, MSettingsEntry<MSettingsKeys>>(Object.keys(MSettingsKeys).map(key => [key as MSettingsKeys, new MSettingsEntry(key as MSettingsKeys)] as [MSettingsKeys, MSettingsEntry<MSettingsKeys>]));
}