import ViewmodelController from "Framework/controllers/ViewmodelController";
import { Players, ReplicatedStorage, RunService, StarterGui, UserInputService } from "@rbxts/services";
import WeaponLogicBase from "Framework/WeaponLogic";
import WeaponInfoBase from "Data/Weapons/WeaponInfoBase";
import { Weapons } from "Data/Weapons/Index";

import CameraController from "Framework/controllers/CameraController";

const ModelsFolder = ReplicatedStorage.FindFirstChild("Models") as Folder;
const WeaponModelsFolder = ModelsFolder.FindFirstChild("Weapons") as Folder;
const ViewmodelFolder = ModelsFolder.FindFirstChild("Viewmodels") as Folder;
const DataFolder = ReplicatedStorage.FindFirstChild("Data") as Folder;

const Character = Players.LocalPlayer.CharacterAdded.Wait()[0];

RunService.RenderStepped.Connect(() => {
	UserInputService.MouseIconEnabled = false;
});

StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, false);

const CC = new CameraController();

async function LoadWeapon(Name: keyof typeof Weapons) {
	const WeaponInfo = DataFolder.FindFirstChild("Weapons")?.FindFirstChild(Name) as ModuleScript;
	const WeaponModel = WeaponModelsFolder.FindFirstChild(Name) as Model;
	const Viewmodel = ViewmodelFolder.FindFirstChild("Default") as Model;

	const Data = Weapons[Name];

	return new WeaponLogicBase(Data, WeaponModel, Viewmodel, CC);
}

LoadWeapon("sa_58_big_scope");

const RootPart = Character.WaitForChild("HumanoidRootPart") as Part;
const Head = Character.FindFirstChild("Head") as BasePart;
const HeadOffset = Head.Position.sub(RootPart.Position);

RunService.BindToRenderStep("CameraControllerUpdate", Enum.RenderPriority.Camera.Value, (DT) => {
	UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;

	CC.CameraPosition = RootPart.Position.add(HeadOffset);
	CC.Update(DT);
});
