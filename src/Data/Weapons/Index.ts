import WeaponInfoBase from "Framework/util/gametypes";
import Ammunition from "./Ammunition";
import { WeaponEnums } from "Framework/util/enums";

export namespace Weapons {
	export const m4 = {
		Name: "M4A1",
		RPM: 800,
		Magazine: {
			Capacity: 30,
			AmmoType: Ammunition["5.56x45mm"],
		},
		Recoil: {
			Vertical: 83,
			Horizontal: 170,
			Multiplier: 1,
		},
		Ergonomics: 52,
		Attachments: {
			Optic: ["6x scope", "Holo sight"],
			Grip: ["Vertical grip"],
			Suppressor: ["AR Suppressor", "Universal Suppressor"],
		},
		Animations: {
			Fire: "rbxassetid://12785067959",
			Reload: "rbxassetid://13397919736",
			ReloadBolt: "rbxassetid://13397955772",
		},
		Sounds: {
			Fire: ["rbxassetid://13250518035", "rbxassetid://13250518175", "rbxassetid://13250518281"],
			Suppressed: ["rbxassetid://13335772811", "rbxassetid://13335772730", "rbxassetid://13335772648"],
			MagIn: "rbxassetid://13397935550",
			MagOut: "rbxassetid://13397935487",
			BoltBack: "rbxassetid://12785604815",
			BoltForward: "rbxassetid://12785608534",
		},
	} as unknown as WeaponInfoBase;
}
