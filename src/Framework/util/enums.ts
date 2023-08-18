import Ammunition from "Data/Weapons/Ammunition";

/**
 * @uuid
 */
export const enum ItemIds {
	item = "item",
	pockets = "pockets",
}

export namespace GameEnums {
	export enum PlayerMoveState {
		Grounded = 0,
		Moving = 1,
		Falling = 2,
	}

	export enum DoorState {
		Closed = 0,
		Open = 1,
	}

	export enum HandlerState {
		Paused = 0,
		Running = 1,
	}
}

export namespace WeaponEnums {
	export enum FireMode {
		Single = 0,
		FullAuto = 1,
	}

	export enum BoltType {
		Manual = 0,
		Automatic = 1,
	}

	export enum TriggerState {
		Forward = 0,
		Back = 1,
	}

	export enum AimState {
		Idle = 0,
		Aim = 1,
	}

	export enum BulletState {
		Live = 0,
		Dead = 1,
	}

	export enum WeaponActionState {
		Idle = 0,
		Firing = 1,
		Reloading = 2,
	}
}

export namespace NetworkingEnums {
	/**
	 * @uuid
	 */
	export const enum RemoteNamespaceId {
		Weapons = "Weapons",
		World = "World",
	}

	/**
	 * @uuid
	 */
	export const enum RemoteId {
		FireRound = "FireRound",
		OpenDoor = "OpenDoor",
	}
}
