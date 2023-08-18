import Items, { ItemInfo } from "Data/Items";
import { ItemIds } from "Framework/util/enums";

export class Item {
	public Position = new Vector2();
	public Size = new Vector2();
	public ItemId: string;
	public Properties: { [Name: string]: unknown } = {
		MaxUses: 0,
		Uses: 0,
		OriginalOwner: 0,
		CanBeDropped: true,
	};

	constructor(ItemInfo: ItemInfo) {
		this.ItemId = ItemInfo._id;
		this.Size = ItemInfo.properties.Size;
		this.Properties = ItemInfo.properties;
	}
}

export class Container {
	public Items: Item[] = [];
	public Size = new Vector2();

	constructor(Size: Vector2) {
		this.Size = Size;
	}
}
