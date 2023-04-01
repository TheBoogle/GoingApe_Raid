import { RunService } from "@rbxts/services";
import Bullet, { BulletState } from "./Bullet";

export enum HandlerState {
	Paused = 0,
	Running = 1,
}

export default class BulletHandler {
	public Bullets: Bullet[] = [];
	public State: HandlerState = HandlerState.Running;

	constructor() {
		RunService.Heartbeat.Connect((DeltaTime: number) => {
			this.Update(DeltaTime);
		});
	}

	public AddBullet(Bullet: Bullet) {
		this.Bullets.push(Bullet);
	}

	private Update(DeltaTime: number) {
		let Index = 0;

		for (const Bullet of this.Bullets) {
			if (Bullet.State === BulletState.Dead) {
				this.Bullets.remove(Index);
			}

			Bullet.Update(DeltaTime);

			Index++;
		}
	}
}
