import { RunService, UserInputService, Workspace } from "@rbxts/services";
import BaseController from "./BaseController";

const UserGameSettings = UserSettings().GetService("UserGameSettings");

export default class CameraController extends BaseController {
	public Camera = Workspace.CurrentCamera as Camera;

	public FieldOfView = 65;
	public Sensitivity = 1;
	public MaxYViewAngle = 89.99;

	public Offset = new CFrame();

	public CameraRotation = new Vector2();
	public CameraPosition = new Vector3();
	public CameraCFrame = new CFrame();

	private LastCameraCFrame = new CFrame();

	constructor() {
		super();
	}

	public GetCameraVelocity() {
		const PositionA = this.CameraCFrame.Position;
		const PositionB = this.LastCameraCFrame.Position;

		return PositionA.sub(PositionB).Magnitude;
	}

	public Update(DeltaTime: number): void {
		this.LastCameraCFrame = this.Camera.CFrame;

		this.Camera.CameraType = Enum.CameraType.Scriptable;

		const MouseDelta = UserInputService.GetMouseDelta().mul(math.rad(0.5));

		this.CameraRotation = this.CameraRotation.add(MouseDelta);
		this.CameraRotation = new Vector2(
			this.CameraRotation.X,
			math.clamp(this.CameraRotation.Y, -math.rad(this.MaxYViewAngle), math.rad(this.MaxYViewAngle)),
		);

		const CameraRotationCFrame = CFrame.Angles(0, -this.CameraRotation.X, 0).mul(
			CFrame.Angles(-this.CameraRotation.Y, 0, 0),
		);

		this.Camera.CFrame = CameraRotationCFrame.add(this.CameraPosition).ToWorldSpace(this.Offset);

		this.CameraCFrame = this.Camera.CFrame;

		this.Camera.FieldOfView = this.FieldOfView;
	}
}
