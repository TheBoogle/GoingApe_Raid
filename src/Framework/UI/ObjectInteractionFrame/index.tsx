import Roact from "@rbxts/roact";

interface ObjectInteractionFrameProps {
	InteractionFrames: string[];
	Index: number;
}

interface ObjectInteractionFrameState {
	InteractionFrames: string[];
	Index: number;
}

export class ObjectInteractionFrame extends Roact.Component<ObjectInteractionFrameProps, ObjectInteractionFrameState> {
	constructor(Props: ObjectInteractionFrameProps) {
		super(Props);

		this.state = {
			InteractionFrames: Props.InteractionFrames,
			Index: Props.Index,
		};
	}

	public didUpdate(prevProps: ObjectInteractionFrameProps) {
		if (prevProps.InteractionFrames !== this.props.InteractionFrames) {
			this.setState({ InteractionFrames: this.props.InteractionFrames });
		}

		if (prevProps.Index !== this.props.Index) {
			this.setState({ Index: this.props.Index });
		}
	}

	public render(): Roact.Element {
		const { InteractionFrames } = this.state;
		const { Index } = this.state;

		return (
			<frame
				AnchorPoint={new Vector2(0.5, 0.5)}
				BackgroundColor3={new Color3(0, 0, 0)}
				BackgroundTransparency={0.5}
				Position={UDim2.fromScale(0.5, 0.5)}
				Size={new UDim2(0, 100, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BorderSizePixel={0}
				Key={"InteractionFrame"}
			>
				<uilistlayout />
				<>
					{InteractionFrames.map((Label, CurrentIndex) => (
						<textlabel
							BackgroundColor3={new Color3(1, 1, 1)}
							BackgroundTransparency={Index === CurrentIndex ? 0 : 1}
							TextColor3={Index === CurrentIndex ? new Color3(0, 0, 0) : new Color3(1, 1, 1)}
							Size={new UDim2(1, 0, 0, 15)}
							Font={Enum.Font.Legacy}
							BorderSizePixel={0}
							Text={Label}
							Key={Label}
						/>
					))}
				</>
			</frame>
		);
	}
}
