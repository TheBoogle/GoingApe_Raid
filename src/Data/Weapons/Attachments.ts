export interface AttachmentInfo {
	Name: string;
	RecoilAdjustment: {
		Multiplier: number;
	};
	ErgonomicsAdjustment: number;
	OpticSettings?: {
		ADSFOV: number;
		Zoom: [number, number];
	};
	SuppressesSound?: boolean;
	ViewmodelAnimation?: string;
}

export enum AttachmentType {
	Optic = "Optic",
	Muzzle = "Muzzle",
	Grip = "Grip",
	Handguard = "Handguard",
}

export const Attachments = new Map<AttachmentType, AttachmentInfo[]>();

Attachments.set(AttachmentType.Optic, [
	{
		Name: "1-6x Scope",
		RecoilAdjustment: {
			Multiplier: 0,
		},
		ErgonomicsAdjustment: 0,
		OpticSettings: {
			ADSFOV: 40,
			Zoom: [1, 6],
		},
	},
	{
		Name: "holo",
		RecoilAdjustment: {
			Multiplier: 0,
		},
		ErgonomicsAdjustment: 0,
		OpticSettings: {
			ADSFOV: 50,
			Zoom: [1, 1],
		},
	},
]);

Attachments.set(AttachmentType.Muzzle, [
	{
		Name: "ar_suppressor",
		RecoilAdjustment: {
			Multiplier: -0.23,
		},
		ErgonomicsAdjustment: 0,
		SuppressesSound: true,
	},
]);

Attachments.set(AttachmentType.Grip, [
	{
		Name: "v_grip",
		RecoilAdjustment: {
			Multiplier: -0.1,
		},
		ErgonomicsAdjustment: 10,
		ViewmodelAnimation: "rbxassetid://13513785210",
	},
]);

Attachments.set(AttachmentType.Handguard, [
	{
		Name: "kac",
		RecoilAdjustment: {
			Multiplier: 0,
		},
		ErgonomicsAdjustment: 0,
	},
]);
