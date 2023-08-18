import { ContextActionService, ReplicatedStorage, RunService, SoundService, Workspace } from "@rbxts/services";

import WeaponInfoBase from "Framework/util/gametypes";
import CameraController from "Framework/controllers/CameraController";
import ViewmodelController from "Framework/controllers/ViewmodelController";
import WeaponController from "Framework/controllers/WeaponController";
import PlayerController from "Framework/controllers/PlayerController";

import Mod from "Framework/mods/Mod";
import OpticalScopeMod from "Framework/mods/OpticalScopeMod";

import Magazine from "./Magazine";
import BulletHandler from "./BulletHandler";
import { WeaponLogicState } from "Framework/util/gametypes";
import { AttachmentInfo, AttachmentType } from "Data/Weapons/Attachments";

import { NetworkingEnums, WeaponEnums } from "Framework/util/enums";
import { Remotes } from "Framework/Network";

function FindFirstChildNotCaseSensitive(Name: string, Parent: Instance): Instance | undefined {
	const Children = Parent.GetChildren();

	for (const Child of Children) {
		if (Child.Name.lower() === Name.lower()) {
			return Child;
		}
	}

	return undefined;
}

export default class WeaponLogicBase {
	public WeaponController: WeaponController;
	public ViewmodelController: ViewmodelController;
	public PlayerController: PlayerController;
	public AttachmentInfo: Map<AttachmentType, AttachmentInfo>;
	private ClientBulletHandler = new BulletHandler();

	public WeaponInfo: WeaponInfoBase;
	public readonly WeaponState: WeaponLogicState;

	public ViewmodelEnabled = true;

	public constructor(
		WeaponInfo: WeaponInfoBase,
		WeaponModel: Model,
		Viewmodel: Model,
		CameraController: CameraController,
		PlayerController: PlayerController,
		AttachmentInfo: Map<AttachmentType, AttachmentInfo>,
		ViewmodelAnimations: string[],
	) {
		this.PlayerController = PlayerController;
		this.AttachmentInfo = AttachmentInfo;
		this.WeaponController = new WeaponController(WeaponModel, CameraController, this.PlayerController);

		this.WeaponState = {
			FireMode: WeaponEnums.FireMode.FullAuto,
			BoltType: WeaponEnums.BoltType.Automatic,
			TriggerState: WeaponEnums.TriggerState.Forward,
			AimState: WeaponEnums.AimState.Idle,
			WeaponState: WeaponEnums.WeaponActionState.Idle,
			AllowedFireModes: [WeaponEnums.FireMode.Single],

			Chamber: undefined,
			Magazine: new Magazine(WeaponInfo.Magazine.Capacity, [this.WeaponController.Model ?? new Instance("Part")]),
			Heat: 0,

			Mods: [],
			Sounds: {},
		};
		this.ViewmodelController = new ViewmodelController(Viewmodel);

		ViewmodelAnimations.forEach((AnimationId) => {
			this.ViewmodelController.PlayAnimation(AnimationId);
		});

		this.WeaponInfo = WeaponInfo;

		this.Initialize();
	}

	public Initialize() {
		this.PullBolt();
		this.CheckOpticalScope();
		this.AddSounds();
		this.LoadAnimations();
		this.SetupWeaponUpdate();
		this.SetupAutomaticFiringHandler();
		this.SetupContextActions();
	}

	private CheckOpticalScope() {
		const OpticScope = this.AttachmentInfo.get(AttachmentType.Optic);

		if (OpticScope) {
			// Find the lens
			const ScopeModel = FindFirstChildNotCaseSensitive(OpticScope.Name, this.WeaponController.Model as Model);

			if (ScopeModel) {
				const Lens = FindFirstChildNotCaseSensitive("Lens", ScopeModel);

				if (Lens && Lens.IsA("BasePart")) {
					this.WeaponState.Mods.push(new OpticalScopeMod(Lens));
				}
			}
		}
	}

	private AddSounds() {
		for (const [Name, ID] of pairs(this.WeaponInfo.Sounds)) {
			if (typeIs(ID, "table")) {
				let I = 1;
				for (const RealID of ID) {
					this.AddSound(`${Name as string}${I}`, RealID);
					I++;
				}
			} else {
				this.AddSound(Name as string, ID);
			}
		}
	}

	private LoadAnimations() {
		for (const [Name, ID] of pairs(this.WeaponInfo.Animations)) {
			this.WeaponController.LoadAnimation(Name as string, ID);
		}

		for (const [AnimationName, AnimationTrack] of pairs(this.WeaponController.LoadedAnimations)) {
			for (const [SoundName, Sound] of pairs(this.WeaponState.Sounds)) {
				AnimationTrack.GetMarkerReachedSignal(SoundName as string).Connect(() => {
					this.PlaySound(SoundName as string, undefined);
				});
			}
		}
	}

	private SetupWeaponUpdate() {
		this.WeaponController.ErgoMultiplier = this.WeaponInfo.Ergonomics / 100;
		this.WeaponController.Recoil = this.WeaponInfo.Recoil;

		RunService.BindToRenderStep("WeaponUpdate", Enum.RenderPriority.Camera.Value + 1, (DeltaTime) => {
			this.WeaponController.AimState = this.WeaponState.AimState;

			this.WeaponController.Update(DeltaTime);

			if (this.WeaponState.TriggerState === WeaponEnums.TriggerState.Forward) {
				this.WeaponState.Heat -= DeltaTime / 10;
			}

			this.WeaponState.Heat = math.clamp(this.WeaponState.Heat, 0, 1);

			this.WeaponController.ApplyHeatEffect(this.WeaponState.Heat);

			if (this.ViewmodelEnabled) {
				this.ViewmodelController.Update();

				this.ViewmodelController.SetIKTarget("LeftArm", this.WeaponController.GetAttachment("LeftHand"));
				this.ViewmodelController.SetIKTarget("RightArm", this.WeaponController.GetAttachment("RightHand"));
			}

			for (const Mod of this.WeaponState.Mods) {
				Mod.Update();
			}
		});
	}

	private async SetupAutomaticFiringHandler() {
		const FireDelay = 60 / this.WeaponInfo.RPM;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (this.WeaponState.TriggerState === WeaponEnums.TriggerState.Back) {
				if (this.WeaponState.WeaponState !== WeaponEnums.WeaponActionState.Idle) {
					task.wait();
					continue;
				}

				this.WeaponState.WeaponState = WeaponEnums.WeaponActionState.Firing;

				let LastShot = os.clock() - FireDelay;

				const FireConnection = RunService.Heartbeat.Connect(() => {
					if (this.WeaponState.TriggerState !== WeaponEnums.TriggerState.Back) {
						FireConnection.Disconnect();
						return;
					}

					const CurrentTime = os.clock();
					const TimeSinceLastShot = CurrentTime - LastShot;
					const Shots = math.floor(TimeSinceLastShot / FireDelay);

					if (TimeSinceLastShot >= FireDelay) {
						// Shoot multiple rounds per frame to insure we keep up with the firerate regardless of our FPS

						for (let CurrentShot = 1; CurrentShot <= Shots; CurrentShot++) {
							const P = this.Fire();

							P.then((ShotARound) => {
								if (ShotARound) {
									if (this.WeaponInfo.Suppressed === true) {
										this.PlaySound("Suppressed", [0.97, 1.03]);
									} else {
										this.PlaySound("Fire", [0.97, 1.03]);
									}
								}
							});
						}

						LastShot += Shots * FireDelay;
					}
				});

				while (FireConnection.Connected) {
					task.wait();
				}

				this.WeaponState.WeaponState = WeaponEnums.WeaponActionState.Idle;
			}

			task.wait();
		}
	}

	private SetupContextActions() {
		ContextActionService.BindAction(
			"Fire",
			(ActionName: string, State: Enum.UserInputState) => {
				switch (State) {
					case Enum.UserInputState.Begin:
						this.WeaponState.TriggerState = WeaponEnums.TriggerState.Back;
						break;
					case Enum.UserInputState.End:
						this.WeaponState.TriggerState = WeaponEnums.TriggerState.Forward;
						break;
				}
			},
			false,
			Enum.UserInputType.MouseButton1,
		);

		ContextActionService.BindAction(
			"AdjustAimState",
			(ActionName: string, State: Enum.UserInputState) => {
				switch (State) {
					case Enum.UserInputState.Begin:
						this.WeaponState.AimState = WeaponEnums.AimState.Aim;
						this.PlayerController.CurrentWalkSpeed = this.PlayerController.AimSpeed;
						break;
					case Enum.UserInputState.End:
						this.WeaponState.AimState = WeaponEnums.AimState.Idle;
						this.PlayerController.CurrentWalkSpeed = this.PlayerController.WalkSpeed;
						break;
				}
			},
			false,
			Enum.UserInputType.MouseButton2,
		);

		ContextActionService.BindAction(
			"ReloadMag",
			(ActionName: string, State: Enum.UserInputState) => {
				if (State !== Enum.UserInputState.Begin) {
					return;
				}

				if (this.WeaponState.WeaponState !== WeaponEnums.WeaponActionState.Idle) {
					return;
				}

				if (this.WeaponState.Magazine?.Rounds.size() === this.WeaponState.Magazine?.Capacity) {
					return;
				}

				this.WeaponState.WeaponState = WeaponEnums.WeaponActionState.Reloading;

				let ReloadAnim = "Reload";
				let KeyframeFinished = "MagIn";

				if (!this.WeaponState.Chamber) {
					ReloadAnim = "ReloadBolt";
					KeyframeFinished = "BoltForward";
				}

				const Connection = this.WeaponController.LoadedAnimations[ReloadAnim].GetMarkerReachedSignal(
					KeyframeFinished,
				).Connect(() => {
					this.WeaponState.WeaponState = WeaponEnums.WeaponActionState.Idle;
					this.Reload();
					Connection.Disconnect();
				});

				this.WeaponController.PlayAnimation(ReloadAnim);
			},
			false,
			Enum.KeyCode.R,
		);
	}

	// Sounds

	public PlaySound(SoundName: string, PitchVariation: [number, number] | undefined) {
		let Sound = this.WeaponState.Sounds[SoundName];

		if (!Sound) {
			const PossibleSounds = [];
			for (const [PossibleSoundName, PossibleSound] of pairs(this.WeaponState.Sounds)) {
				if (
					string.find(PossibleSoundName as string, SoundName)[0] !== undefined &&
					PossibleSound !== undefined
				) {
					PossibleSounds.push(PossibleSound);
				}
			}

			Sound = PossibleSounds[math.random(0, PossibleSounds.size() - 1)];
		}

		if (!Sound) {
			warn(Sound);
			warn("Failure");
			return;
		}

		Sound = Sound.Clone();

		if (PitchVariation) {
			const Pitch = new Instance("PitchShiftSoundEffect");
			Pitch.Parent = Sound;
			Pitch.Octave = math.random(PitchVariation[0] * 100, PitchVariation[1] * 100) / 100;
			Pitch.Enabled = true;
		}

		Sound.Volume = 1;
		Sound.Parent = SoundService;
		Sound.PlayOnRemove = true;
		Sound.Destroy();
	}

	public AddSound(SoundName: string, Sound: Sound | string) {
		let S = Sound;

		if (typeOf(Sound) === "string") {
			S = new Instance("Sound");
			S.SoundId = Sound as string;
			S.Name = SoundName;
		}

		this.WeaponState.Sounds[SoundName] = S as Sound;
	}

	// Weapon Logic

	public Reload() {
		// warn("Starting reload.");

		this.WeaponState.Magazine?.Reload();

		if (!this.WeaponState.Chamber) {
			this.ChamberRound();
		}

		// warn("Finished reload.");
		// warn(this.Magazine?.Rounds.size());
	}

	public ChamberRound() {
		if (this.WeaponState.Chamber) {
			// Already a round in the chamber

			this.WeaponState.Chamber = undefined;
		}

		const Round = this.WeaponState.Magazine?.Chamber();

		if (Round) {
			// Magazine is not empty

			// warn("Round chambered.");

			this.WeaponState.Chamber = Round;
		}
	}

	public PullBolt() {
		// warn("Pulling bolt.");

		this.ChamberRound();
	}

	public async Fire(): Promise<boolean> {
		const RoundToFire = this.WeaponState.Chamber;

		// If the chamber is empty, don't fire.

		if (!RoundToFire) {
			// warn("Weapon cannot fire because there is no round in the chamber.");

			this.WeaponState.TriggerState = WeaponEnums.TriggerState.Forward;

			return false;
		}

		if (this.WeaponState.WeaponState === WeaponEnums.WeaponActionState.Reloading) {
			// warn("Weapon cannot fire because the weapon is reloading.");

			return false;
		}

		const MuzzleCF = this.WeaponController.GetAttachmentWorldCF("Muzzle");

		RoundToFire.Position = MuzzleCF.Position;
		RoundToFire.LastPosition = RoundToFire.Position;
		RoundToFire.SetDirection(MuzzleCF.LookVector);

		this.ClientBulletHandler.AddBullet(RoundToFire);

		this.WeaponState.Heat += 0.007;

		this.WeaponController.PlayAnimation("Fire");
		this.WeaponController.ApplyRecoil(this.WeaponController.Recoil.Multiplier);
		this.WeaponController.EmitFlash();

		this.WeaponState.Chamber = undefined;

		if (this.WeaponState.BoltType === WeaponEnums.BoltType.Automatic) {
			this.PullBolt();
		}

		// Remotes.Client.GetNamespace(NetworkingEnums.RemoteNamespaceId.Weapons)
		// 	.Get(NetworkingEnums.RemoteId.FireRound)
		// 	.SendToServer();

		return true;
	}
}
