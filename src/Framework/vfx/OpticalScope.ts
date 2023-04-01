import { Players } from "@rbxts/services";
import { MoreMath } from "Framework/util/MoreMath";

export default class OpticalScope {
	public Object: BasePart;
	public Camera: Camera;
	public GUI: SurfaceGui | undefined;

	private ScopeShadowOffset = 8.25;
	private TextureResolution = new Vector2(1024, 1024);
	private StudToPixel = 600;
	private ReticleScaleOffset = 0;

	constructor(Camera: Camera, Object: BasePart) {
		this.Camera = Camera;
		this.Object = Object;

		if (!this.Object) {
			return;
		}

		this.GUI = (Object.FindFirstChildOfClass("SurfaceGui") as SurfaceGui) ?? new Instance("SurfaceGui");
		this.GUI.Face = Enum.NormalId.Right;
		this.GUI.PixelsPerStud = 1024;
		this.GUI.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud;
		this.GUI.Brightness = math.max(this.GUI.Brightness, 1);
		this.GUI.LightInfluence = 0;
		this.GUI.Parent = Players.LocalPlayer.FindFirstChild("PlayerGui");
		this.GUI.Adornee = Object;
		this.GUI.Name = "OpticalScopeVFX";

		if (this.GUI.GetChildren().size() === 0) {
			const ImageLabel = new Instance("ImageLabel");
			ImageLabel.Size = new UDim2(1, 0, 1, 0);
			ImageLabel.Parent = this.GUI;
			ImageLabel.Name = "Reticle";
			ImageLabel.Image = "rbxassetid://12779371340";
			ImageLabel.BackgroundTransparency = 1;
			ImageLabel.ScaleType = Enum.ScaleType.Fit;
			ImageLabel.ImageColor3 = new Color3(1, 0, 0);
			ImageLabel.ImageTransparency = 0.6;
			ImageLabel.SetAttribute("PPSMultiplier", 1);
			ImageLabel.SetAttribute("SizeMultiplier", 0.8);
		}
	}

	public Update() {
		if (!this.GUI) {
			return;
		}

		const CameraCF = this.Camera.CFrame;
		const ScopeCF = this.Object.CFrame;
		let ScopeSize = this.Object.Size.X;
		const FixedSize = this.Object.GetAttribute("FixedSize") as number | undefined;

		if (FixedSize !== undefined) {
			ScopeSize = FixedSize;
		}

		const FOVMult = MoreMath.Map(math.min(this.Camera.FieldOfView, 70), 1, 70, 1, 0);

		const ScopeViewEndCF = ScopeCF.mul(new CFrame(-ScopeSize / 2, 0, 0));
		const ScopeFarEndCF = ScopeCF.mul(new CFrame(ScopeSize / 2, 0, 0));

		const ViewToCam = CameraCF.ToObjectSpace(ScopeViewEndCF);

		const FarEndToCam = CameraCF.ToObjectSpace(ScopeFarEndCF);

		const DistFromClipPlane = ViewToCam.Z;
		const DistFromFarEnd = FarEndToCam.Z;

		const XOffset_Cam = (FarEndToCam.X / FarEndToCam.Z) * DistFromClipPlane;
		const YOffset_Cam = (FarEndToCam.Y / FarEndToCam.Z) * DistFromClipPlane;

		const XOffset = XOffset_Cam - ViewToCam.X;
		const YOffset = YOffset_Cam - ViewToCam.Y;

		const OffsetCFrame = CFrame.lookAt(
			ScopeViewEndCF.Position,
			ScopeViewEndCF.Position.add(ScopeViewEndCF.RightVector),
		).mul(new CFrame(new Vector3(XOffset, YOffset, 0)));

		const OffsetCFrameLocalized = ScopeViewEndCF.ToObjectSpace(OffsetCFrame);

		const GUIChildren = this.GUI.GetChildren() as [ImageLabel];

		for (const ImageLabel of GUIChildren) {
			if (!ImageLabel.IsA("ImageLabel")) {
				continue;
			}

			let RectSize = new Vector2();
			let RectOffset = new Vector2();

			RectSize = this.TextureResolution.mul(0.5);
			RectSize = RectSize.div((ImageLabel.GetAttribute("SizeMultiplier") as number) ?? 1);

			let PPS = this.GUI.PixelsPerStud;

			PPS *= (ImageLabel.GetAttribute("PPSMultiplier") as number) ?? 1;

			RectOffset = this.TextureResolution.sub(RectSize)
				.div(2)
				.add(new Vector2(-OffsetCFrameLocalized.Z * (PPS * 2), OffsetCFrameLocalized.Y * (PPS * 2)));

			ImageLabel.ImageRectSize = RectSize;
			ImageLabel.ImageRectOffset = RectOffset;
		}
	}
}
