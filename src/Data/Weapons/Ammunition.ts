import { WeaponEnums } from "Framework/util/enums";
import { BulletInfo } from "Framework/util/gametypes";

export const Ammunition = {
	["5.56x45mm"]: {
		Name: "5.56x45mm",
		Speed: 940,
		Damage: 54,
		Penetration: 37,
		ArmorDamage: 52,
		Recoil: 4,
		RicochetChance: 38,
		Tracer: {
			Enabled: true,
			Color: new Color3(0.98, 0.27, 0.27),
		},
	} as BulletInfo,
	["5.56x45mm AP"]: {
		Name: "5.56x45mm AP",
		Speed: 1013,
		Damage: 42,
		Penetration: 53,
		ArmorDamage: 58,
		Recoil: 8,
		RicochetChance: 36,
		Tracer: {
			Enabled: false,
			Color: new Color3(1, 0.5, 0),
		},
	} as BulletInfo,
};

export default Ammunition;
