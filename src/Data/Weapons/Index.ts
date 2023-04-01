import WeaponInfoBase from "./WeaponInfoBase";

export namespace Weapons {
	export const ppsh = {
		Name: "PPSh-41",
		RPM: 1000,
		Magazine: {
			Capacity: 71,
		},
		Recoil: {
			Vertical: [1, 2],
			Horizontal: [-2, 2],
			Multiplier: 2,
		},
		Ergonomics: 1,
		Animations: {
			Fire: "rbxassetid://12785067959",
			Reload: "rbxassetid://12789069742",
			ReloadBolt: "rbxassetid://12789151798",
		},
		Sounds: {
			Fire: "rbxassetid://5233073916",
			MagIn: "rbxassetid://12789097020",
			MagOut: "rbxassetid://12789096884",
			BoltBack: "rbxassetid://12789183999",
			BoltForward: "rbxassetid://12789184061",
		},
	} as unknown as WeaponInfoBase;

	export const sa_58 = {
		Name: "SA-58",
		RPM: 700,
		Magazine: {
			Capacity: 30,
		},
		Recoil: {
			Vertical: [3, 4],
			Horizontal: [-1, 1],
			Multiplier: 2,
		},
		Ergonomics: 0.7,
		Animations: {
			Fire: "rbxassetid://12785067959",
			Reload: "rbxassetid://12785278133",
			ReloadBolt: "rbxassetid://12785594043",
		},
		Sounds: {
			Fire: ["rbxassetid://12784439301", "rbxassetid://12785324983", "rbxassetid://12785325065"],
			MagIn: "rbxassetid://12785215558",
			MagOut: "rbxassetid://12785217159",
			BoltBack: "rbxassetid://12785604815",
			BoltForward: "rbxassetid://12785608534",
		},
	} as unknown as WeaponInfoBase;

	export const sa_58_big_scope = sa_58;
	export const m4 = {
		Name: "M4A1",
		RPM: 800,
		Magazine: {
			Capacity: 30,
		},
		Recoil: {
			Vertical: [2, 3],
			Horizontal: [-1, 1],
			Multiplier: 2,
		},
		Ergonomics: 0.9,
		Animations: {
			Fire: "rbxassetid://12785067959",
			Reload: "rbxassetid://12785278133",
			ReloadBolt: "rbxassetid://12785594043",
		},
		Sounds: {
			Fire: "rbxassetid://12795702035",
			MagIn: "rbxassetid://12785215558",
			MagOut: "rbxassetid://12785217159",
			BoltBack: "rbxassetid://12785604815",
			BoltForward: "rbxassetid://12785608534",
		},
	} as unknown as WeaponInfoBase;
}
