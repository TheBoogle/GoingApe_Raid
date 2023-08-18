import { ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import BaseController from "./BaseController";
import UserInputHandler from "Framework/util/UserInput";
import _UserInputHandler from "Framework/util/UserInput";
import { GameEnums } from "Framework/util/enums";

const ModelsFolder = ReplicatedStorage.FindFirstChild("Models") as Folder;
const TechnicalFolder = ModelsFolder.FindFirstChild("Technical") as Folder;

export default class PlayerController extends BaseController {
	public CharacterModel: Model = TechnicalFolder.FindFirstChild("Player")?.Clone() as Model;

	public MoveState = GameEnums.PlayerMoveState.Grounded;
	public Velocity = new Vector3(0, 0, 0);
	public InputHandler = new _UserInputHandler();

	public Camera = Workspace.CurrentCamera as Camera;

	public WalkSpeed = 16;
	public AimSpeed = 12;
	public CurrentWalkSpeed = 16;
	public Friction = 8;
	public Acceleration = 12;
	public PlayerRadius = 1;

	public KeyBinds = new Map<Enum.KeyCode, Enum.NormalId>();
	public LastWishDir = new Vector3(0, 0, 0);

	private BodyVelocity: BodyVelocity;
	private CastParams = new RaycastParams();

	constructor() {
		super();

		this.CharacterModel.Parent = Workspace;

		this.BodyVelocity = this.CharacterModel.PrimaryPart?.FindFirstChildOfClass("BodyVelocity") as BodyVelocity;

		this.KeyBinds.set(Enum.KeyCode.W, Enum.NormalId.Front);
		this.KeyBinds.set(Enum.KeyCode.S, Enum.NormalId.Back);
		this.KeyBinds.set(Enum.KeyCode.A, Enum.NormalId.Left);
		this.KeyBinds.set(Enum.KeyCode.D, Enum.NormalId.Right);

		this.CastParams.FilterType = Enum.RaycastFilterType.Include;
		this.CastParams.FilterDescendantsInstances = [Workspace.FindFirstChild("TestMap") as Folder, Workspace.Terrain];
	}

	public IsGrounded(): boolean {
		const Humanoid = this.CharacterModel.FindFirstChildOfClass("Humanoid") as Humanoid;

		if (Humanoid.FloorMaterial !== Enum.Material.Air) {
			return true;
		}

		return false;
	}

	public GetPlayerCFrame(): CFrame {
		return this.CharacterModel.GetPivot();
	}

	public GetNonRelativeWishDir(): Vector3 {
		let wishDir = new Vector3();

		this.KeyBinds.forEach((normalId: Enum.NormalId, key) => {
			if (this.InputHandler.IsKeyDown(key)) {
				const N = Vector3.FromNormalId(normalId);

				wishDir = wishDir.add(N);
			}
		});

		return wishDir;
	}

	public GetRelativeWishDir(): Vector3 {
		const wishDir = this.GetNonRelativeWishDir();

		const originalCF = this.Camera.CFrame;

		let cameraOrientation = originalCF.ToWorldSpace(new CFrame(0, 0, -1));

		const rawOrientation = cameraOrientation.ToOrientation();

		cameraOrientation = CFrame.Angles(0, rawOrientation[1], rawOrientation[2]);

		let transformedWishDir = cameraOrientation.VectorToWorldSpace(wishDir);
		if (transformedWishDir.Magnitude > 0) {
			transformedWishDir = transformedWishDir.Unit;
		}

		return transformedWishDir.mul(new Vector3(1, 0, 1));
	}

	public Update(DeltaTime: number): void {
		const isGrounded = this.IsGrounded();

		const WishDir = this.GetRelativeWishDir();

		const WishDirDifference = WishDir.sub(this.LastWishDir).Magnitude;

		if (this.IsGrounded() && WishDir.Magnitude > 0 && WishDirDifference < 1) {
			this.MoveState = GameEnums.PlayerMoveState.Moving;
			this.Velocity = this.Velocity.Lerp(WishDir.mul(this.CurrentWalkSpeed), this.Acceleration * DeltaTime);
		} else if (this.IsGrounded()) {
			this.MoveState = GameEnums.PlayerMoveState.Grounded;
			this.Velocity = this.Velocity.Lerp(new Vector3(0, 0, 0), this.Friction * DeltaTime);
		} else {
			this.MoveState = GameEnums.PlayerMoveState.Falling;
		}

		this.LastWishDir = WishDir;
		this.BodyVelocity.Velocity = this.Velocity;
	}
}
