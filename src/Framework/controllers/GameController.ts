import {
	ContextActionService,
	Players,
	ReplicatedStorage,
	RunService,
	UserInputService,
	Workspace,
} from "@rbxts/services";
import WeaponLogicBase from "Framework/WeaponLogic";
import BaseController from "./BaseController";
import WeaponController from "./WeaponController";
import { Weapons } from "Data/Weapons/Index";
import CameraController from "./CameraController";
import Roact from "@rbxts/roact";
import PlayerController from "./PlayerController";
import WeaponModelBuilder from "Framework/WeaponLogic/ModelBuilder";
import { AttachmentInfo, AttachmentType, Attachments } from "Data/Weapons/Attachments";

const ModelsFolder = ReplicatedStorage.FindFirstChild("Models") as Folder;
const WeaponModelsFolder = ModelsFolder.FindFirstChild("Weapons") as Folder;
const ViewmodelFolder = ModelsFolder.FindFirstChild("Viewmodels") as Folder;
const DataFolder = ReplicatedStorage.FindFirstChild("Data") as Folder;

export default class GameController extends BaseController {
	public EquippedWeaponLogic: WeaponLogicBase | undefined;

	public CameraController = new CameraController();
	public PlayerController = new PlayerController();

	public CurrentWeapon: WeaponLogicBase | undefined;

	public LocalPlayer = Players.LocalPlayer;

	public MouseLocked = true;
	public PlayerHeight = 3;

	constructor() {
		super();

		this.init();
	}

	public init() {
		ContextActionService.BindAction(
			"MouseToggle",
			(ActionName, State, InputObject) => {
				if (State === Enum.UserInputState.Begin) {
					this.MouseLocked = !this.MouseLocked;
				}
			},
			false,
			Enum.KeyCode.LeftAlt,
		);

		RunService.BindToRenderStep("GameController_Update", Enum.RenderPriority.Camera.Value, (DeltaTime) => {
			this.Update(DeltaTime);
		});
	}

	public Update(DeltaTime: number): void {
		const MouseLocked = this.MouseLocked;

		UserInputService.MouseBehavior = MouseLocked ? Enum.MouseBehavior.LockCenter : Enum.MouseBehavior.Default;
		UserInputService.MouseIconEnabled = !MouseLocked;

		this.CameraController.CameraPosition = (this.PlayerController.GetPlayerCFrame().Position ?? new Vector3()).add(
			new Vector3(0, this.PlayerHeight, 0),
		);

		this.PlayerController.Update(DeltaTime);
		this.CameraController.Update(DeltaTime);
	}

	/**
	 * EquipWeapon
	 */
	public EquipWeapon(
		WeaponName: keyof typeof Weapons,
		AttachmentInfo: Map<AttachmentType, AttachmentInfo>,
	): WeaponLogicBase {
		const WeaponModel = WeaponModelsFolder.FindFirstChild(WeaponName) as Model;
		const Viewmodel = ViewmodelFolder.FindFirstChild("RealHands") as Model;

		const ConstructedModel = WeaponModelBuilder(WeaponModel, AttachmentInfo);

		const Data = Weapons[WeaponName];

		let RecoilMultiplier = 1;

		const ViewmodelAnimations: string[] = [];

		AttachmentInfo.forEach((Attachment) => {
			RecoilMultiplier += Attachment.RecoilAdjustment.Multiplier;

			if (Attachment.ViewmodelAnimation !== undefined) {
				print(`Viewmodel Animation: ${Attachment.ViewmodelAnimation}`);
				ViewmodelAnimations.push(Attachment.ViewmodelAnimation);
			}
		});

		RecoilMultiplier = math.max(RecoilMultiplier, 0);

		Data.Recoil.Multiplier *= RecoilMultiplier;

		Data.Recoil.Vertical /= 10;
		Data.Recoil.Horizontal /= 30;
		Data.Recoil.Horizontal *= 0.5;

		print(`Vertical Recoil: ${Data.Recoil.Vertical * RecoilMultiplier * 10}`);
		print(`Horizontal Recoil: ${Data.Recoil.Horizontal * RecoilMultiplier * 20}`);

		this.CurrentWeapon = new WeaponLogicBase(
			Data,
			ConstructedModel ?? WeaponModel,
			Viewmodel,
			this.CameraController,
			this.PlayerController,
			AttachmentInfo,
			ViewmodelAnimations,
		);

		this.CurrentWeapon.WeaponInfo.Suppressed = AttachmentInfo.get(AttachmentType.Muzzle)?.SuppressesSound ?? false;

		return this.CurrentWeapon;
	}
}
