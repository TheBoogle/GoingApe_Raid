import { PlayerInventory } from "Framework/util/gametypes";
import { Container, Item } from "./Classes";
import Items, { ItemInfo } from "Data/Items";
import { ItemIds } from "Framework/util/enums";

export default class Inventory {
	public readonly Gear: PlayerInventory = {
		Weapons: {
			Primary: undefined,
			Secondary: undefined,
			Melee: undefined,
		},
		Gear: {
			Pockets: new Item(Items[ItemIds.pockets]),
			Backpack: undefined,
			Armor: undefined,
			Helmet: undefined,
			Armband: undefined,
			Container: undefined,
		},
	};
	public Containers: Container[] = [];

	public EquipGear(Slot: keyof PlayerInventory["Gear"], ItemInfo: ItemInfo) {
		this.Gear.Gear[Slot] = new Item(ItemInfo);
	}
}
