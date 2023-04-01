import { Debris, ReplicatedStorage, Workspace } from "@rbxts/services";
import BulletVisualization from "./DebugBulletVisualization";

const MuzzleVelocity = 20;
const MaxDistance = 2048;
const BulletGravity = new Vector3(0, -9.6, 0);

export enum BulletState {
	Live = 0,
	Dead = 1,
}

function CreateEvent() {
	const Event = new Instance("BindableEvent");

	return Event;
}

export default class Bullet {
	public Velocity = Vector3.zero;
	public Position = Vector3.zero;
	public DoPhysics = true;
	public Render = false;
	public CastParams = new RaycastParams();
	public State = BulletState.Live;
	public DistanceTraveled = 0;
	public PenetrationPower = 1;

	private Debug = true;

	public OnHit: RBXScriptSignal;
	public PenetratedObject: RBXScriptSignal;
	private OnHitEvent: BindableEvent;
	private PenetratedObjectEvent: BindableEvent;

	constructor(InitialPosition: Vector3, InitialDirection: Vector3) {
		this.Position = InitialPosition;
		this.Velocity = InitialDirection.mul(MuzzleVelocity);

		this.OnHitEvent = CreateEvent();
		this.OnHit = this.OnHitEvent.Event;

		this.PenetratedObjectEvent = CreateEvent();
		this.PenetratedObject = this.PenetratedObjectEvent.Event;
	}

	public SetDirection(Direction: Vector3) {
		this.Velocity = Direction.mul(MuzzleVelocity);
	}

	private Cast() {
		return Workspace.Raycast(this.Position, this.Velocity, this.CastParams);
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
		if (this.State === BulletState.Dead) {
			return;
		}

		// Check if we hit a bitch

		const Direction = this.Velocity;
		const Result = this.Cast();

		if (Result) {
			// Hit a bitch

			// Determine what the heck we just hit

			const ObjectModelAncestor = Result.Instance.FindFirstAncestorOfClass("Model");

			this.CreateBulletVisualization(
				new CFrame(Result.Position, Result.Position.add(Result.Normal)),
				new Color3(1, 0, 0),
			);

			if (ObjectModelAncestor && ObjectModelAncestor.FindFirstChildOfClass("Humanoid")) {
				this.State = BulletState.Dead;

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

						let ScaledRicochetChance = AngledScaled * RicochetChance * 0.25;

						if (ScaledRicochetChance < 0.1) {
							ScaledRicochetChance = 0;
						}

						if (math.random() < ScaledRicochetChance) {
							print("fart");
							// Ricochet

							this.ReflectVelocity(Result.Normal);

							this.CreateBulletVisualization(
								new CFrame(Result.Position, Result.Position.add(this.Velocity.Unit)),
								new Color3(0, 1, 0),
							);
						} else {
							// death

							this.State = BulletState.Dead;

							this.CreateBulletVisualization(
								new CFrame(Result.Position, Result.Position.add(this.Velocity.Unit)),
								new Color3(1, 0.77, 0),
							);
						}
					}
				}
			}
		} else {
			this.Position = this.Position.add(this.Velocity);
			this.DistanceTraveled += this.Velocity.Magnitude;

			if (this.DistanceTraveled >= MaxDistance) {
				this.State = BulletState.Dead;
				this.Render = false;
				this.OnHitEvent.Destroy();
				this.PenetratedObjectEvent.Destroy();
			}

			this.Velocity = this.Velocity.add(BulletGravity.div(100));
		}
	}
}
