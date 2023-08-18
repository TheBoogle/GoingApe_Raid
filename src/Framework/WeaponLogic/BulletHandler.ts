import { RunService, Workspace } from "@rbxts/services";
import Bullet from "./Bullet";
import { GameEnums, WeaponEnums } from "Framework/util/enums";

export default class BulletHandler {
	public Bullets: Bullet[] = [];
	public Stat = GameEnums.HandlerState.Running;

	constructor() {
		RunService.Stepped.Connect((_, DeltaTime: number) => {
			this.Update(DeltaTime);
		});
	}

	public AddBullet(Bullet: Bullet) {
		this.Bullets.push(Bullet);
	}

	private Update(DeltaTime: number) {
		this.Bullets.forEach((Bullet) => {
			if (Bullet.State === WeaponEnums.BulletState.Dead) {
				// Remove the bullet from the array
				this.Bullets.remove(this.Bullets.indexOf(Bullet));
				return;
			}
			Bullet.Update(DeltaTime);
		});
	}
}
