import { Players, Workspace } from "@rbxts/services";
import { MoreMath } from "Framework/util/MoreMath";
import BaseController from "./BaseController";
import CameraController from "./CameraController";
import PlayerController from "./PlayerController";
import { WeaponEnums } from "Framework/util/enums";

export default class WeaponController extends BaseController {
	public Camera = Workspace.CurrentCamera;
	public Model: Model | undefined;
	private NonClonedModel: Model;

	public AnimationController: Animator;
	public CameraController: CameraController;
	public PlayerController: PlayerController;
	public LoadedAnimations: { [Name: string]: AnimationTrack } = {};

	public CameraOffsets: { [Name: string]: CFrame };
	public WeaponAttachments: { [Name: string]: Attachment };

	public AimState = 0;

	public CurrentCameraOffset = new CFrame();
	public RecoilOffset = new CFrame();
	public RecoilOffsetGoal = new CFrame();
	public WalkOffset = new CFrame();
	public WallOffset = new CFrame();
	public WalkSwayOffset = new CFrame();
	public ViewSwayOffset = new CFrame();
	public ViewSwayGoal = new CFrame();
	public CastParams = new RaycastParams();

	private Highlights: Highlight[];

	public ViewBobDelta = 0;

	public Recoil = {
		Vertical: 5,
		Horizontal: 3,
		Multiplier: 2,
	};
	public RawCameraVRecoil = 5;

	public ErgoMultiplier = 1;

	constructor(Model: Model, CameraController: CameraController, PlayerController: PlayerController) {
		super();

		this.NonClonedModel = Model;
		this.Model = Model.Clone();
		this.Model.Parent = this.Camera;

		const AnimationController = new Instance("AnimationController", this.Model);
		this.AnimationController = new Instance("Animator", AnimationController);

		this.PlayerController = PlayerController;
		this.CameraController = CameraController;

		this.Highlights = this.GetHeatHighlights();

		this.Model.PivotTo(new CFrame());

		this.CameraOffsets = {};
		this.WeaponAttachments = {};

		this.CastParams.FilterType = Enum.RaycastFilterType.Include;
		this.CastParams.FilterDescendantsInstances = [Workspace.FindFirstChild("TestMap") as Folder, Workspace.Terrain];

		for (const Part of this.Model.GetChildren()) {
			if (Part.IsA("BasePart")) {
				for (const Attachment of Part.GetChildren()) {
					if (Attachment.IsA("Attachment")) {
						this.CameraOffsets[Attachment.Name] = Attachment.CFrame;
						this.WeaponAttachments[Attachment.Name] = Attachment;
					}
				}
			}
		}

		this.CurrentCameraOffset = this.CameraOffsets.Idle;
	}

	public GetViewBobDelta(Delta: number) {
		this.ViewBobDelta += Delta;

		return this.ViewBobDelta;
	}

	public LoadAnimation(AnimationName: string, Animation: string) {
		const A = new Instance("Animation");
		A.AnimationId = Animation;

		this.LoadedAnimations[AnimationName] = this.AnimationController.LoadAnimation(A);
	}

	public PlayAnimation(AnimationName: string) {
		this.LoadedAnimations[AnimationName].Play(0, 1);
	}

	public EmitFlash() {
		if (!this.Model) {
			return;
		}

		for (const Instance of this.Model.GetDescendants()) {
			if (Instance.IsA("ParticleEmitter")) {
				// If it is a particle emitter, .Emit() the .Rate
				Instance.Emit(Instance.Rate);
			} else if (Instance.IsA("Light")) {
				// If it is a light, enable it for 25 thousandths of a second
				task.spawn(() => {
					Instance.Enabled = true;
					task.wait(0.025);
					Instance.Enabled = false;
				});
			}
		}
	}

	public GetAttachment(Name: string): Attachment {
		return this.WeaponAttachments[Name];
	}

	public GetAttachmentWorldCF(Name: string): CFrame {
		return this.WeaponAttachments[Name].WorldCFrame;
	}

	public GetHeatHighlights(): Highlight[] {
		const Highlights: Highlight[] = [];

		for (const Instance of this.Model?.GetDescendants() ?? []) {
			if (Instance.IsA("Highlight")) {
				Highlights.push(Instance);
			}
		}

		return Highlights;
	}

	public ApplyRecoil(Amount: number) {
		this.RecoilOffsetGoal = this.RecoilOffsetGoal.mul(new CFrame(0, 0, math.clamp(Amount, 0, 0)));

		// Calculate a random amount of recoil based off of pre-defined limits.

		const XRot = this.Recoil.Vertical * Amount;
		const YRot = math.random(-this.Recoil.Horizontal, this.Recoil.Horizontal) * Amount;

		this.RecoilOffsetGoal = this.RecoilOffsetGoal.mul(CFrame.Angles(math.rad(XRot), math.rad(YRot), 0));
	}

	public ApplyHeatEffect(Heat: number) {
		for (const Highlight of this.Highlights) {
			Highlight.FillTransparency = 1.3 - Heat;
		}
	}

	public Update(DeltaTime: number): void {
		const RootCF = this.Model?.PrimaryPart?.CFrame ?? new CFrame();
		const MuzzleCF = this.GetAttachmentWorldCF("Muzzle") ?? new CFrame();
		const ModelSize = this.NonClonedModel?.GetExtentsSize() ?? new Vector3();
		const MouseDelta = this.CameraController.GetMouseDelta();

		// Raycast to the nearest wall
		const MuzzleToWallDist = Workspace.Raycast(
			RootCF.Position,
			MuzzleCF.LookVector.Unit.mul(1024),
			this.CastParams,
		);

		let AimOffset = this.CameraOffsets.Idle;

		let NewFOV = 65;
		let ScopeTransparency = 0;

		if (
			this.AimState === WeaponEnums.AimState.Aim &&
			((MuzzleToWallDist && MuzzleToWallDist.Distance > ModelSize.Z - 0.25) || !MuzzleToWallDist)
		) {
			AimOffset = this.CameraOffsets.Aim;
			NewFOV = 50;
			ScopeTransparency = 1;
		}

		if (this.AimState === WeaponEnums.AimState.Aim) {
			this.CameraController.Sensitivity = 0.7;
		} else {
			this.CameraController.Sensitivity = 1;
		}

		const AimSpeed = DeltaTime * 10 * this.ErgoMultiplier;
		const RecoilSpeed = DeltaTime * 15;

		this.CurrentCameraOffset = this.CurrentCameraOffset.Lerp(AimOffset, AimSpeed);
		this.RecoilOffsetGoal = this.RecoilOffsetGoal.Lerp(new CFrame(), RecoilSpeed);
		this.RecoilOffset = this.RecoilOffset.Lerp(this.RecoilOffsetGoal, RecoilSpeed);

		// Wall detect

		if (MuzzleToWallDist !== undefined && MuzzleToWallDist.Distance < ModelSize?.Z) {
			this.WallOffset = this.WallOffset.Lerp(
				new CFrame(0, 0, ModelSize.Z - MuzzleToWallDist.Distance),
				AimSpeed * 2,
			);
		} else {
			this.WallOffset = this.WallOffset.Lerp(new CFrame(), AimSpeed);
		}

		// View bob

		const MoveVelocity = this.PlayerController.Velocity.Magnitude;

		let WalkOffset = new CFrame();
		let WalkSwayOffset = new CFrame();

		const VDelta = this.GetViewBobDelta(DeltaTime * MoveVelocity);

		// Make the walk sway offset rotate on the Y axis depending on the X velocity of the player

		const M = 0.025;

		WalkSwayOffset = CFrame.Angles(0, math.clamp(this.PlayerController.GetNonRelativeWishDir().X, -M, M), 0);

		if (MoveVelocity <= 4) {
			this.ViewBobDelta = 0;
		}

		if (VDelta > 0) {
			WalkOffset = CFrame.Angles(0, 0, math.sin(VDelta / 2) / 32);

			WalkOffset = WalkOffset.mul(new CFrame(0, math.sin(VDelta) / 32, 0));
		}

		this.WalkOffset = this.WalkOffset.Lerp(WalkOffset, AimSpeed);
		this.WalkSwayOffset = this.WalkSwayOffset.Lerp(WalkSwayOffset, AimSpeed);

		this.ViewSwayGoal = CFrame.Angles(MouseDelta.Y, -MouseDelta.X / 3, 0);

		this.ViewSwayOffset = this.ViewSwayOffset.Lerp(this.ViewSwayGoal, AimSpeed);

		// Apply offsets

		const O = this.RecoilOffset.ToOrientation();

		this.CameraController.Offset = this.RecoilOffset.Lerp(new CFrame(), 0.1);
		this.CameraController.AddRotation(new Vector2(0, -O[0] * (DeltaTime * this.RawCameraVRecoil)));

		this.CameraController.Offset = this.CameraController.Offset.mul(this.WalkOffset.Lerp(new CFrame(), 0.5));

		for (const BasePart of this.Model?.GetDescendants() ?? []) {
			if (BasePart.GetAttribute("HideFromScope") !== true || !BasePart.IsA("BasePart")) {
				continue;
			}

			const BP = BasePart as MeshPart;

			BP.Transparency = MoreMath.Lerp(BP.Transparency, ScopeTransparency, AimSpeed);

			if (ScopeTransparency === 0) {
				BP.Transparency = ScopeTransparency;
			}
		}

		if (this.Model && this.Camera) {
			this.Model.PivotTo(
				this.Camera.CFrame.mul(this.CurrentCameraOffset.Inverse())
					.mul(this.RecoilOffset)
					.mul(this.WalkOffset)
					.mul(this.WalkSwayOffset)
					.mul(this.WallOffset)
					.mul(this.ViewSwayOffset),
			);
			this.CameraController.FieldOfView = MoreMath.Lerp(this.Camera.FieldOfView, NewFOV, AimSpeed);
		}
	}
}
