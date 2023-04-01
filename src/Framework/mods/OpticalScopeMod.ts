import { Workspace } from "@rbxts/services";
import OpticalScope from "../vfx/OpticalScope";
import Mod from "./Mod";

export default class OpticalScopeMod extends Mod {
	public VFX: OpticalScope | undefined;

	constructor(Object: BasePart) {
		super();

		this.VFX = new OpticalScope(Workspace.CurrentCamera as Camera, Object);
	}

	public Update(): void {
		this.VFX?.Update();
	}
}
