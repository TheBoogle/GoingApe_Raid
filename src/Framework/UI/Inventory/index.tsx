import Roact from "@rbxts/roact";

interface InventoryProps {}
interface InventoryState {
	Open: boolean;
}

export class Inventory extends Roact.Component<InventoryProps, InventoryState> {
	constructor(Props: InventoryProps) {
		super(Props);

		this.setState({
			Open: false,
		});
	}

	public render(): Roact.Element | undefined {
		return (
			<frame
				BackgroundColor3={new Color3(0, 0, 0)}
				Visible={this.state.Open}
				Size={new UDim2(1, 0, 1, 0)}
			></frame>
		);
	}
}
