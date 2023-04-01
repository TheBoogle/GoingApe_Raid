import Bullet from "./Bullet";

export default class Magazine {
	public Capacity = 1000;
	public Rounds: Bullet[] = [];

	public constructor() {
		this.Reload();
	}

	public Reload() {
		// Load the magazine to the brim.

		for (let I = math.max(this.Rounds.size(), 0); I < this.Capacity; I++) {
			this.Rounds.push(new Bullet(Vector3.zero, Vector3.zero));
		}
	}

	public Chamber() {
		// Find the first round, remove it from the magazine and return it to the caller.

		const Round = this.Rounds[0];

		this.Rounds.remove(0);

		return Round;
	}
}
