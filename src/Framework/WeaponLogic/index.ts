import { ContextActionService, ReplicatedStorage, RunService, SoundService, Workspace } from "@rbxts/services";
import WeaponInfoBase from "Data/Weapons/WeaponInfoBase";
import CameraController from "Framework/controllers/CameraController";
import ViewmodelController from "Framework/controllers/ViewmodelController";
import WeaponController from "Framework/controllers/WeaponController";
import Mod from "Framework/mods/Mod";
import OpticalScopeMod from "Framework/mods/OpticalScopeMod";
import Bullet from "./Bullet";
import BulletHandler from "./BulletHandler";
import Magazine from "./Magazine";

enum FireMode {
	Single = 0,
	FullAuto = 1,
}

enum BoltType {
	Manual = 0,
	Automatic = 1,
}

enum TriggerState {
	Forward = 0,
	Back = 1,
}

enum AimState {
	Idle = 0,
	Aim = 1,
}

enum WeaponState {
	Idle = 0,
	Firing = 1,
	Reloading = 2,
}

export default class WeaponLogicBase {
	private WeaponInfo: WeaponInfoBase;
	public Magazine: Magazine | undefined;
	public Chamber: Bullet | undefined;
	public WeaponController: WeaponController;
	public ViewmodelController: ViewmodelController;
	private ClientBulletHandler = new BulletHandler();

	public FireMode = FireMode.FullAuto;
	public BoltType = BoltType.Automatic;
	public TriggerState = TriggerState.Forward;
	public AimState = AimState.Idle;
	public WeaponState = WeaponState.Idle;

	public ViewmodelEnabled = true;

	public Mods: Mod[] = [];
	public Sounds: { [Name: string]: Sound } = {};

	public AllowedFireModes: FireMode[] = [FireMode.Single];

	public RPM = 700;

	public constructor(
		WeaponInfo: WeaponInfoBase,
		WeaponModel: Model,
		Viewmodel: Model,
		CameraController: CameraController,
	) {
		this.Magazine = new Magazine();
		this.WeaponController = new WeaponController(WeaponModel, CameraController);
		this.ViewmodelController = new ViewmodelController(Viewmodel);

		this.WeaponInfo = WeaponInfo;

		this.Initialize();
	}

	public Initialize() {
		this.PullBolt();

		this.AddMod(new OpticalScopeMod(this.WeaponController.Model?.FindFirstChild("Lens") as BasePart));

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

		for (const [Name, ID] of pairs(this.WeaponInfo.Animations)) {
			this.WeaponController.LoadAnimation(Name as string, ID);
		}

		for (const [AnimationName, AnimationTrack] of pairs(this.WeaponController.LoadedAnimations)) {
			for (const [SoundName, Sound] of pairs(this.Sounds)) {
				AnimationTrack.GetMarkerReachedSignal(SoundName as string).Connect(() => {
					this.PlaySound(SoundName as string, undefined);
				});
			}
		}

		this.WeaponController.ErgoMultiplier = this.WeaponInfo.Ergonomics;
		this.WeaponController.Recoil = this.WeaponInfo.Recoil;
		this.RPM = this.WeaponInfo.RPM;

		RunService.BindToRenderStep("WeaponUpdate", Enum.RenderPriority.Camera.Value + 1, (DeltaTime) => {
			this.WeaponController.AimState = this.AimState;

			this.WeaponController.Update(DeltaTime);

			if (this.ViewmodelEnabled) {
				this.ViewmodelController.Update();

				this.ViewmodelController.SetIKTarget("LeftArm", this.WeaponController.GetAttachment("LeftHand"));
				this.ViewmodelController.SetIKTarget("RightArm", this.WeaponController.GetAttachment("RightHand"));
			}

			for (const Mod of this.Mods) {
				Mod.Update();
			}
		});

		// Automatic firing handler
		coroutine.wrap(() => {
			const FireDelay = 60 / this.RPM;

			// eslint-disable-next-line no-constant-condition
			while (true) {
				if (this.TriggerState === TriggerState.Back) {
					if (this.WeaponState !== WeaponState.Idle) {
						task.wait();
						continue;
					}

					this.WeaponState = WeaponState.Firing;

					let LastShot = os.clock() - FireDelay;

					const FireConnection = RunService.Heartbeat.Connect(() => {
						if (this.TriggerState !== TriggerState.Back) {
							FireConnection.Disconnect();
							return;
						}

						const CurrentTime = os.clock();
						const TimeSinceLastShot = CurrentTime - LastShot;
						const Shots = math.floor(TimeSinceLastShot / FireDelay);

						if (TimeSinceLastShot >= FireDelay) {
							// Shoot multiple rounds per frame to insure we keep up with the firerate regardless of our FPS

							let ShotARound = false;

							for (let CurrentShot = 1; CurrentShot <= Shots; CurrentShot++) {
								if (this.Fire()) {
									ShotARound = true;
								}
							}

							if (ShotARound) {
								this.PlaySound("Fire", [0.95, 1.05]);
							}

							LastShot += Shots * FireDelay;
						}
					});

					while (FireConnection.Connected) {
						task.wait();
					}

					this.WeaponState = WeaponState.Idle;
				}

				task.wait();
			}
		})();

		ContextActionService.BindAction(
			"Fire",
			(ActionName: string, State: Enum.UserInputState) => {
				switch (State) {
					case Enum.UserInputState.Begin:
						this.TriggerState = TriggerState.Back;
						break;
					case Enum.UserInputState.End:
						this.TriggerState = TriggerState.Forward;
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
						this.AimState = AimState.Aim;
						break;
					case Enum.UserInputState.End:
						this.AimState = AimState.Idle;
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

				if (this.WeaponState !== WeaponState.Idle) {
					return;
				}

				if (this.Magazine?.Rounds.size() === this.Magazine?.Capacity) {
					return;
				}

				this.WeaponState = WeaponState.Reloading;

				let ReloadAnim = "Reload";
				let KeyframeFinished = "MagIn";

				if (!this.Chamber) {
					ReloadAnim = "ReloadBolt";
					KeyframeFinished = "BoltForward";
				}

				const Connection = this.WeaponController.LoadedAnimations[ReloadAnim].GetMarkerReachedSignal(
					KeyframeFinished,
				).Connect(() => {
					this.WeaponState = WeaponState.Idle;
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
		let Sound = this.Sounds[SoundName];

		if (!Sound) {
			const PossibleSounds = [];
			for (const [PossibleSoundName, PossibleSound] of pairs(this.Sounds)) {
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
			Sound.PlaybackSpeed = math.random(PitchVariation[0] * 100, PitchVariation[1] * 100) / 100;
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

		this.Sounds[SoundName] = S as Sound;
	}

	// Mods

	public AddMod(ModToAdd: Mod) {
		this.Mods.push(ModToAdd);
	}

	// Weapon Logic

	public Reload() {
		// warn("Starting reload.");

		this.Magazine?.Reload();

		if (!this.Chamber) {
			this.ChamberRound();
		}

		// warn("Finished reload.");
		// warn(this.Magazine?.Rounds.size());
	}

	public ChamberRound() {
		if (this.Chamber) {
			// Already a round in the chamber

			this.Chamber = undefined;
		}

		const Round = this.Magazine?.Chamber();

		if (Round) {
			// Magazine is not empty

			// warn("Round chambered.");

			this.Chamber = Round;
		}
	}

	public PullBolt() {
		// warn("Pulling bolt.");

		this.ChamberRound();
	}

	public Fire(): boolean {
		const RoundToFire = this.Chamber;

		// If the chamber is empty, don't fire.

		if (!RoundToFire) {
			// warn("Weapon cannot fire because there is no round in the chamber.");

			this.TriggerState = TriggerState.Forward;

			return false;
		}

		if (this.WeaponState === WeaponState.Reloading) {
			// warn("Weapon cannot fire because the weapon is reloading.");

			return false;
		}

		const MuzzleCF = this.WeaponController.GetAttachmentWorldCF("Muzzle");

		RoundToFire.Position = MuzzleCF.Position;
		RoundToFire.SetDirection(MuzzleCF.LookVector);
		RoundToFire.Render = true;

		this.ClientBulletHandler.AddBullet(RoundToFire);

		this.WeaponController.PlayAnimation("Fire");
		this.WeaponController.ApplyRecoil(this.WeaponController.Recoil.Multiplier);
		this.WeaponController.EmitFlash();

		this.Chamber = undefined;

		if (this.BoltType === BoltType.Automatic) {
			this.PullBolt();
		}

		return true;
	}
}
