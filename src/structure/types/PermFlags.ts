import { Collection, PermissionsBitField } from "discord.js";

export type PermFlags = Partial<Record<keyof typeof PermissionsBitField.Flags, boolean>>;

export function PermFlag_Default(): PermFlags {
	return Object.keys(PermissionsBitField.Flags).reduce((obj, key) => {
		obj[key as keyof PermFlags] = undefined;
		return obj;
	}, {} as PermFlags);
}

export function flagsFindDifference(flagsA: PermFlags, flagsB: PermFlags): Collection<keyof PermFlags, Array<boolean | undefined>> {
	const difference: Collection<keyof PermFlags, Array<boolean | undefined>> = new Collection();

	for (const [key, valueA] of Object.entries(flagsA)) {
		const valueB = flagsB[key as keyof PermFlags];
		if(valueA !== valueB) {
			difference.set(key as keyof PermFlags, [valueA, valueB]);
		}
	}

	return difference;
}

export function transEmoji(flag: boolean | undefined): string {
	switch(flag) {
		case true: return ":white_check_mark:";
		case false: return ":x:";
		case undefined: return ":record_button:";
	}
}

export function flagsFilter(flags: PermFlags, value: boolean | undefined): PermFlags {
	return Object.fromEntries(
		Object.entries(flags).filter(([key, flagValue]) => flagValue === value)
	) as PermFlags;
}

export function getPermFlags(permBit: PermissionsBitField): PermFlags {
	return Object.fromEntries(
		Object.entries(PermissionsBitField.Flags).map(([perm, value]) => [perm, permBit.has(value)])
	) as PermFlags;
}