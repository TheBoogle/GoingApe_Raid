import { WeaponEnums } from "./enums";
import Magazine from "Framework/WeaponLogic/Magazine";
import Bullet from "Framework/WeaponLogic/Bullet";
import Mod from "Framework/mods/Mod";
import { Item } from "Framework/InventoryLogic/Classes";

export interface WeaponLogicState {
	FireMode: WeaponEnums.FireMode;
	BoltType: WeaponEnums.BoltType;
	TriggerState: WeaponEnums.TriggerState;
	AimState: WeaponEnums.AimState;
	WeaponState: WeaponEnums.WeaponActionState;

	AllowedFireModes: WeaponEnums.FireMode[];

	Magazine: Magazine;
	Chamber: Bullet | undefined;
	Heat: number;

	Mods: Mod[];
	Sounds: { [Name: string]: Sound };
}

export default interface WeaponInfoBase {
	InternalName: string;
	Name: string;
	RPM: number;
	Suppressed?: Boolean;
	Magazine: {
		AmmoType: BulletInfo;
		Capacity: number;
	};
	Recoil: {
		Vertical: number;
		Horizontal: number;
		Multiplier: number;
	};
	Ergonomics: number;
	Animations: { [Index: string]: string };
	Sounds: { [Index: string]: string | string[] };
}

export interface PlayerInventory {
	Weapons: {
		Primary?: WeaponInfoBase;
		Secondary?: WeaponInfoBase;
		Melee?: WeaponInfoBase;
	};
	Gear: {
		Pockets?: Item;
		Backpack?: Item;
		Armor?: Item;
		Helmet?: Item;
		Armband?: Item;
		Container?: Item;
	};
}

export interface TracerInfo {
	Enabled: boolean;
	Color: Color3;
}

export interface BulletInfo {
	Speed: number;
	Damage: number;
	Penetration: number;
	ArmorDamage: number;
	Recoil: number;
	RicochetChance: number;
	Tracer: TracerInfo;
}
