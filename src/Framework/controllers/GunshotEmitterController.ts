import BaseController from "./BaseController";

export default class GunshotEmitterController extends BaseController {
	public Queue = new Map<Vector3, Sound>();

	constructor() {
		super();
	}

	public Add(Position: Vector3, Sound: Sound): void {
		this.Queue.set(Position, Sound);
	}

	private PlaySound(Position: Vector3, Sound: Sound): void {
		const P = new Instance("Part");
		P.Anchored = true;
		P.CanCollide = false;
		P.CanQuery = false;
		P.Transparency = 1;
		P.Size = new Vector3(0.1, 0.1, 0.1);
		P.Position = Position;
		P.Parent = game.Workspace;

		const S = Sound.Clone();
		S.Parent = P;
		S.PlayOnRemove = true;

		P.Destroy();
	}

	public update(): void {
		this.Queue.forEach((Sound, Position) => {
			this.PlaySound(Position, Sound);
			this.Queue.delete(Position);
		});
	}
}
