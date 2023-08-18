import Ammunition from "Data/Weapons/Ammunition";
import Bullet from "./Bullet";
import { BulletInfo } from "Framework/util/gametypes";
import { WeaponEnums } from "Framework/util/enums";

export default class Magazine {
	public Capacity = 30;
	public AmmoType: BulletInfo = Ammunition["5.56x45mm"];
	public Rounds: Bullet[] = [];

	private IgnoreList: Instance[];

	public constructor(Capacity: number, IgnoreList: Instance[]) {
		this.IgnoreList = IgnoreList;

		this.Capacity = Capacity;

		this.Reload();
	}

	public Reload() {
		// Load the magazine to the brim.

		for (let I = math.max(this.Rounds.size(), 0); I < this.Capacity; I++) {
			this.Rounds.push(new Bullet(this.AmmoType, Vector3.zero, Vector3.zero, this.IgnoreList));
		}
	}

	public Chamber() {
		// Find the first round, remove it from the magazine and return it to the caller.

		const Round = this.Rounds[0];

		this.Rounds.remove(0);

		return Round;
	}
}
