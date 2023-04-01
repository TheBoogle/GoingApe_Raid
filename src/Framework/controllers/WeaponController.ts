import { Players, Workspace } from "@rbxts/services";
import { MoreMath } from "Framework/util/MoreMath";
import BaseController from "./BaseController";
import CameraController from "./CameraController";

export default class WeaponController extends BaseController {
	public Camera = Workspace.CurrentCamera;
	public Model: Model | undefined;
	private NonClonedModel: Model;

	public AnimationController: Animator;
	public CameraController: CameraController;
	public LoadedAnimations: { [Name: string]: AnimationTrack } = {};

	public CameraOffsets: { [Name: string]: CFrame };
	public WeaponAttachments: { [Name: string]: Attachment };

	public AimState = 0;

	public CurrentCameraOffset = new CFrame();
	public RecoilOffset = new CFrame();
	public RecoilOffsetGoal = new CFrame();
	public WalkOffset = new CFrame();
	public WallOffset = new CFrame();
	public CastParams = new RaycastParams();

	public Recoil = {
		Vertical: [2, 5],
		Horizontal: [-3, 3],
		Multiplier: 2,
	};

	public ErgoMultiplier = 1;

	constructor(Model: Model, CameraController: CameraController) {
		super();

		this.NonClonedModel = Model;
		this.Model = Model.Clone();
		this.Model.Parent = this.Camera;

		const AnimationController = new Instance("AnimationController", this.Model);
		this.AnimationController = new Instance("Animator", AnimationController);

		this.CameraController = CameraController;

		this.Model.PivotTo(new CFrame());

		this.CameraOffsets = {};
		this.WeaponAttachments = {};

		this.CastParams.FilterType = Enum.RaycastFilterType.Include;
		this.CastParams.FilterDescendantsInstances = [Workspace.FindFirstChild("TestMap") as Folder];

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

	public ApplyRecoil(Amount: number) {
		this.RecoilOffsetGoal = this.RecoilOffsetGoal.mul(new CFrame(0, 0, math.clamp(Amount, 0, 0)));

		// Calculate a random amount of recoil based off of pre-defined limits.

		const XRot = (math.random(this.Recoil.Vertical[0] * 100, this.Recoil.Vertical[1] * 100) / 100) * Amount;
		const YRot = (math.random(this.Recoil.Horizontal[0] * 100, this.Recoil.Horizontal[1] * 100) / 100) * Amount;

		this.RecoilOffsetGoal = this.RecoilOffsetGoal.mul(CFrame.Angles(math.rad(XRot), math.rad(YRot), 0));
	}

	public Update(DeltaTime: number): void {
		const RootCF = this.Model?.PrimaryPart?.CFrame ?? new CFrame();
		const MuzzleCF = this.GetAttachmentWorldCF("Muzzle") ?? new CFrame();
		const ModelSize = this.NonClonedModel?.GetExtentsSize() ?? new Vector3();

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
			this.AimState === 1 &&
			((MuzzleToWallDist && MuzzleToWallDist.Distance > ModelSize.Z - 0.25) || !MuzzleToWallDist)
		) {
			AimOffset = this.CameraOffsets.Aim;
			NewFOV = 35;
			ScopeTransparency = 1;
		}

		const AimSpeed = DeltaTime * 10 * this.ErgoMultiplier;
		const RecoilSpeed = DeltaTime * 15;

		this.CurrentCameraOffset = this.CurrentCameraOffset.Lerp(AimOffset, AimSpeed);
		this.RecoilOffsetGoal = this.RecoilOffsetGoal.Lerp(new CFrame(), RecoilSpeed);
		this.RecoilOffset = this.RecoilOffset.Lerp(this.RecoilOffsetGoal, RecoilSpeed);

		if (MuzzleToWallDist !== undefined && MuzzleToWallDist.Distance < ModelSize?.Z) {
			this.WallOffset = this.WallOffset.Lerp(
				new CFrame(0, 0, ModelSize.Z - MuzzleToWallDist.Distance),
				AimSpeed * 2,
			);
		} else {
			this.WallOffset = this.WallOffset.Lerp(new CFrame(), AimSpeed);
		}

		const MoveVelocity = math.floor(
			(Players.LocalPlayer.Character?.PrimaryPart?.AssemblyLinearVelocity.Magnitude ?? 0) + 0.5,
		);

		let WalkOffset = new CFrame();

		if (MoveVelocity > 0) {
			WalkOffset = CFrame.Angles(0, 0, math.cos((tick() * MoveVelocity) / 2) / 32);

			WalkOffset = WalkOffset.mul(new CFrame(0, math.sin(tick() * MoveVelocity) / 32, 0));
		}

		this.WalkOffset = this.WalkOffset.Lerp(WalkOffset, AimSpeed);

		this.CameraController.Offset = this.RecoilOffset.Lerp(new CFrame(), 0.1);
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

		const Lens = this.Model?.FindFirstChild("Lens") as BasePart | undefined;

		// if (Lens) {
		// 	Lens.Transparency = MoreMath.Lerp(Lens.Transparency, 1.5 - ScopeTransparency, AimSpeed);
		// }

		if (this.Model && this.Camera) {
			this.Model.PivotTo(
				this.Camera.CFrame.mul(this.CurrentCameraOffset.Inverse())
					.mul(this.RecoilOffset)
					.mul(this.WalkOffset)
					.mul(this.WallOffset),
			);
			this.CameraController.FieldOfView = MoreMath.Lerp(this.Camera.FieldOfView, NewFOV, AimSpeed);
		}
	}
}
