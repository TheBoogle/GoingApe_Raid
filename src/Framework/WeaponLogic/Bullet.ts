import { Debris, ReplicatedStorage, Workspace } from "@rbxts/services";
import BulletVisualization from "./DebugBulletVisualization";
import { BulletInfo } from "Framework/util/gametypes";
import Ammunition from "Data/Weapons/Ammunition";
import { WeaponEnums } from "Framework/util/enums";

const MuzzleVelocity = 2000;
const MaxDistance = 10240;
const BulletGravity = new Vector3(0, -100, 0);

function CreateEvent() {
	const Event = new Instance("BindableEvent");

	return Event;
}

export default class Bullet {
	public Velocity = Vector3.zero;
	public LastPosition = Vector3.zero;
	public Position = Vector3.zero;
	public DoPhysics = true;
	public CastParams = new RaycastParams();
	public State = WeaponEnums.BulletState.Live;
	public DistanceTraveled = 0;
	public PenetrationPower = 1;
	public Wireframe: WireframeHandleAdornment | undefined;
	public AmmoType: BulletInfo = Ammunition["5.56x45mm"];

	private Debug = false;

	constructor(AmmoType: BulletInfo, InitialPosition: Vector3, InitialDirection: Vector3, IgnoreList: Instance[]) {
		this.AmmoType = AmmoType;
		this.Position = InitialPosition;
		this.Velocity = InitialDirection.mul(MuzzleVelocity);

		this.CastParams.FilterType = Enum.RaycastFilterType.Exclude;
		this.CastParams.FilterDescendantsInstances = IgnoreList;
	}

	public SetDirection(Direction: Vector3) {
		this.Velocity = Direction.mul(MuzzleVelocity);
	}

	private Cast(DeltaTime: number) {
		return Workspace.Raycast(this.Position, this.Velocity.mul(DeltaTime), this.CastParams);
	}

	public Kill() {
		this.State = WeaponEnums.BulletState.Dead;

		this.Wireframe?.Destroy();
		this.Wireframe = undefined;
	}

	private FindObjectExitPoint(
		OriginalPoint: Vector3,
		OriginalNormal: Vector3,
		OriginalDirection: Vector3,
		Object: BasePart,
	) {
		const PartSize = Object.Size;

		const NewDirection = OriginalDirection.Unit.mul(PartSize.Magnitude);

		const Origin = OriginalPoint.add(NewDirection);

		const TempParams = new RaycastParams();
		TempParams.FilterType = Enum.RaycastFilterType.Include;
		TempParams.FilterDescendantsInstances = [Object];

		const ExitPoint = Workspace.Raycast(Origin, NewDirection.mul(-1), TempParams);

		return ExitPoint;
	}

	private CreateBulletVisualization(CFrame: CFrame, Color: Color3) {
		if (!this.Debug) {
			return;
		}

		new BulletVisualization(CFrame, Color);
	}

	private ReflectVelocity(Normal: Vector3) {
		const Direction = this.Velocity;

		this.Velocity = Direction.sub(Normal.mul(Direction.Dot(Normal) * 2));
	}

	public Update(DeltaTime: number): void {
		if (this.State === WeaponEnums.BulletState.Dead) {
			return;
		}

		if (this.Debug) {
			if (!this.Wireframe) {
				this.Wireframe = new Instance("WireframeHandleAdornment");
			}
			this.Wireframe.Adornee = Workspace;
			this.Wireframe.Parent = Workspace;
		}

		// Check if we hit a bitch

		const Result = this.Cast(DeltaTime);

		if (Result) {
			// Hit a bitch

			// Determine what the heck we just hit

			const ObjectModelAncestor = Result.Instance.FindFirstAncestorOfClass("Model");

			this.CreateBulletVisualization(
				new CFrame(Result.Position, Result.Position.add(Result.Normal)),
				new Color3(1, 0, 0),
			);

			this.Position = Result.Position;

			if (ObjectModelAncestor && ObjectModelAncestor.FindFirstChildOfClass("Humanoid")) {
				this.Kill();

				this.CreateBulletVisualization(
					new CFrame(Result.Position, Result.Position.add(this.Velocity.Unit)),
					new Color3(1, 0.77, 0),
				);
			} else {
				const Material = Result.Instance.Material;
				const PhysicalProperties = Result.Instance.CurrentPhysicalProperties;

				const { Density, Friction, Elasticity, FrictionWeight, ElasticityWeight } = PhysicalProperties;

				const Mass = Result.Instance.GetMass();

				const ExitPoint = this.FindObjectExitPoint(
					Result.Position,
					Result.Normal,
					this.Velocity,
					Result.Instance,
				);

				if (ExitPoint) {
					// Check if the bullets pentration power is great enough to penetrate the walls density & mass.
					if (this.PenetrationPower >= Density + Mass / 100) {
						this.Position = ExitPoint.Position;

						this.PenetrationPower -= (Density + Mass / 10) / 10 + math.random() / 10;

						this.CreateBulletVisualization(
							new CFrame(ExitPoint.Position, ExitPoint.Position.add(ExitPoint.Normal)),
							new Color3(0, 0, 1),
						);
					} else {
						const DotProduct = this.Velocity.Dot(Result.Normal);
						const MagnitudeA = this.Velocity.Magnitude;
						const MagnitudeB = Result.Normal.Magnitude;

						const AngleDeg = math.acos(DotProduct / (MagnitudeA * MagnitudeB)) * (180 / math.pi);
						const AngleRad = math.rad(AngleDeg);

						const massPerUnitArea = Density; // Modify the mass per unit area to be proportional to density
						const surfaceRoughness = Friction;
						const energyAbsorbed = 1 - Elasticity * ElasticityWeight;
						const weightedRoughness = surfaceRoughness * FrictionWeight;
						const RicochetChance = AngleRad * weightedRoughness * energyAbsorbed;

						const AngledScaled = math.sin(AngleRad);

						const ScaledRicochetChance = AngledScaled * RicochetChance * 0.1;

						// if (ScaledRicochetChance < 0.1) {
						// 	ScaledRicochetChance = 0;
						// }

						if (math.random() < ScaledRicochetChance) {
							// Ricochet

							this.ReflectVelocity(Result.Normal);

							this.CreateBulletVisualization(
								new CFrame(Result.Position, Result.Position.add(this.Velocity.Unit)),
								new Color3(0, 1, 0),
							);
						} else {
							// death

							this.Kill();

							this.CreateBulletVisualization(
								new CFrame(Result.Position, Result.Position.add(this.Velocity.Unit)),
								new Color3(1, 0.77, 0),
							);
						}
					}
				}
			}
		} else {
			const V = this.Velocity.mul(DeltaTime);

			this.Position = this.Position.add(V);
			this.DistanceTraveled += this.Position.sub(this.LastPosition).Magnitude;

			if (this.DistanceTraveled >= MaxDistance || this.Position.Y < Workspace.FallenPartsDestroyHeight) {
				this.Kill();
			}

			this.Velocity = this.Velocity.add(BulletGravity.mul(DeltaTime));
		}

		if (this.Debug === true && this.Wireframe) {
			this.Wireframe.Color3 = new Color3(0.85, 0.4, 0.09);
			this.Wireframe.AddLine(this.LastPosition, this.Position);
		}

		this.LastPosition = this.Position;
	}
}
