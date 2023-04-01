import { Debris, Workspace } from "@rbxts/services";

export default class BulletVisualization {
	constructor(CFrame: CFrame, Color: Color3) {
		const P = new Instance("Part");

		P.Size = new Vector3(0.001, 0.001, 0.001);
		P.Transparency = 1;
		P.CanCollide = false;
		P.CanTouch = false;
		P.CanQuery = false;

		P.CFrame = CFrame;
		P.Anchored = true;
		P.Name = "BULLETVISUALIZATION";

		const Cone = new Instance("ConeHandleAdornment");
		Cone.Parent = P;
		Cone.Adornee = P;
		Cone.AlwaysOnTop = true;
		Cone.ZIndex = 1;
		Cone.Height = 0.35;
		Cone.Radius = 0.1;
		Cone.Color3 = Color;

		P.Parent = Workspace;

		Debris.AddItem(P, 5);
	}
}
