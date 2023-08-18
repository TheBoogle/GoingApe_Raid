import { ItemIds } from "Framework/util/enums";

export interface GridInfo {
	Name: string;
	CellSize: Vector2;
}

export interface ItemInfo {
	_id: string;
	name: string;
	properties: {
		Name: string;
		ShortName: string;
		Description: string;
		Weight: number;
		BackgroundColor: string;
		Size: Vector2;
		MaxStackSize: number;
		Grid?: GridInfo[];
	};
}

const Items: { [Name: string]: ItemInfo } = {
	[ItemIds.item]: {
		_id: ItemIds.item,
		name: "Item",
		properties: {
			Name: "Item",
			ShortName: "Item",
			Description: "An item.",
			Weight: 0,
			BackgroundColor: "blue",
			Size: new Vector2(1, 1),
			MaxStackSize: 1,
		},
	},
	[ItemIds.pockets]: {
		_id: ItemIds.pockets,
		name: "Pockets",
		properties: {
			Name: "Pockets",
			ShortName: "Pockets",
			Description: "Pockets",
			Weight: 0,
			BackgroundColor: "blue",
			Size: new Vector2(1, 1),
			MaxStackSize: 1,
			Grid: [
				{
					Name: "1",
					CellSize: new Vector2(1, 1),
				},
				{
					Name: "2",
					CellSize: new Vector2(1, 1),
				},
				{
					Name: "3",
					CellSize: new Vector2(1, 1),
				},
				{
					Name: "4",
					CellSize: new Vector2(1, 1),
				},
			],
		},
	},
};

export default Items;
