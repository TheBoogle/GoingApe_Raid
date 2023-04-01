export default interface WeaponInfoBase {
	Name: "Weapon";
	RPM: 700;
	Magazine: {
		Capacity: 30;
	};
	Recoil: {
		Vertical: [2, 5];
		Horizontal: [-3, 3];
		Multiplier: 2;
	};
	Ergonomics: 1;
	Animations: { [Index: string]: string };
	Sounds: { [Index: string]: string | string[] };
}
