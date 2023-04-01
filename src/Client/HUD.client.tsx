import Roact from "@rbxts/roact";
import { Players, CollectionService, Workspace, RunService } from "@rbxts/services";
import { ObjectInteractionFrame } from "Framework/UI/ObjectInteractionFrame";

const PlayerGui = Players.LocalPlayer.FindFirstChildOfClass("PlayerGui");

const CastParams = new RaycastParams();
CastParams.FilterType = Enum.RaycastFilterType.Include;
CastParams.FilterDescendantsInstances = CollectionService.GetTagged("Door");

const Camera = Workspace.CurrentCamera as Camera;

class HUD extends Roact.Component {
	public state = {
		CurrentDoor: false,
	};

	public CheckForDoor() {
		const Origin = Camera.CFrame.Position;
		const Direction = Camera.CFrame.LookVector.Unit;

		const Result = Workspace.Raycast(Origin, Direction.mul(10), CastParams);

		if (Result) {
			this.setState({ CurrentDoor: Result.Instance.FindFirstAncestorOfClass("Model") });
		} else {
			this.setState({ CurrentDoor: false });
		}
	}

	public constructor(props: {}) {
		super(props);

		RunService.BindToRenderStep("HUD_DoorCheck", Enum.RenderPriority.Camera.Value, () => {
			this.CheckForDoor();
		});
	}

	public render(): Roact.Element {
		const frames = this.state.CurrentDoor ? ["Open"] : [];

		return (
			<screengui ResetOnSpawn={false}>
				<ObjectInteractionFrame InteractionFrames={frames} Index={0} />
			</screengui>
		);
	}
}

const Handler = Roact.mount(<HUD />, PlayerGui, "UI");
