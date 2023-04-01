import BaseController from "./BaseController";
import { Workspace } from "@rbxts/services";
import Mod from "Framework/mods/Mod";

export default class ViewmodelController extends BaseController {
	public Camera = Workspace.CurrentCamera;
	public Model: Model | undefined;

	public SetIKTarget(Name: string, Attachment: BasePart | Attachment) {
		if (this.Model) {
			for (const IKControl of this.Model.GetDescendants()) {
				if (IKControl.IsA("IKControl") && IKControl.Name === Name) {
					IKControl.Target = Attachment;
				}
			}
		}
	}

	public SetIKCFrame(Name: string, WorldCFrame: CFrame): void {
		const IKPlacements = this.Model?.FindFirstChild("IKPlacements");

		if (IKPlacements) {
			const Placer = IKPlacements.FindFirstChild(Name);

			if (Placer && Placer.IsA("BasePart")) {
				Placer.CFrame = WorldCFrame;
			}
		}
	}

	constructor(Model: Model) {
		super();

		this.Model = Model.Clone();
		this.Model.Parent = this.Camera;

		this.Model.PivotTo(new CFrame());
	}

	public Update(): void {
		this.Model?.PivotTo(this.Camera?.CFrame ?? new CFrame());
	}
}
