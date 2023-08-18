import { ReplicatedStorage } from "@rbxts/services";
import { AttachmentInfo, AttachmentType, Attachments } from "Data/Weapons/Attachments";

const ModelsFolder = ReplicatedStorage.FindFirstChild("Models");
const AttachmentsFolder = ModelsFolder?.FindFirstChild("Attachments");

function WeldTwoPartsWithPoints(PartA: BasePart, PartB: BasePart, AttachmentA: Attachment, AttachmentB: Attachment) {
	const Weld = new Instance("Weld", PartA);

	Weld.Part0 = PartA;
	Weld.Part1 = PartB;
	Weld.C0 = AttachmentA.CFrame;
	Weld.C1 = AttachmentB.CFrame;
	Weld.Parent = PartA;

	Weld.Name = `${PartA.Name}>${PartB.Name}Weld`;

	return Weld;
}

function FindFirstChildNotCaseSensitive(Name: string, Parent: Instance): Instance | undefined {
	const Children = Parent.GetChildren();

	for (const Child of Children) {
		if (Child.Name.lower() === Name.lower()) {
			return Child;
		}
	}

	return undefined;
}

export default function WeaponModelBuilder(WeaponModel: Model, AttachmentInfo: Map<AttachmentType, AttachmentInfo>) {
	if (!AttachmentsFolder) {
		return;
	}
	const ClonedModel = WeaponModel.Clone();

	if (ClonedModel.FindFirstChildOfClass("AnimationController")) {
		ClonedModel.FindFirstChildOfClass("AnimationController")?.Destroy();
	}

	const AttachmentPoints: Map<string, Attachment> = new Map();

	for (const Attachment of ClonedModel.GetDescendants()) {
		if (Attachment.IsA("Attachment") && Attachment.Name.lower().find("attach_")[0]) {
			AttachmentPoints.set(Attachment.Name.lower().sub(8, Attachment.Name.size()), Attachment);
		}
	}

	function ApplyAttachment(Type: AttachmentType, Info: AttachmentInfo) {
		const AType = (Type as string).lower();
		const AttachmentPoint = AttachmentPoints.get(AType);
		const WeaponAttachment = FindFirstChildNotCaseSensitive(Info.Name, AttachmentsFolder as Instance);

		if (WeaponAttachment) {
			for (const Attachment of WeaponAttachment.GetDescendants()) {
				if (Attachment.IsA("Attachment") && Attachment.Name.lower().find("attach_")[0]) {
					// If there are more attachments points inside the attachment, add them to the map
					AttachmentPoints.set(Attachment.Name.lower().sub(8, Attachment.Name.size()), Attachment);
				}
			}
		}

		if (AttachmentPoint && WeaponAttachment) {
			const AttachmentA = AttachmentPoint;
			const AttachmentB = WeaponAttachment.FindFirstChild(`attach_${AType}`) as Attachment | undefined;

			if (AttachmentB) {
				WeldTwoPartsWithPoints(
					AttachmentA.Parent as BasePart,
					AttachmentB.Parent as BasePart,
					AttachmentA,
					AttachmentB,
				);

				for (const Child of ClonedModel.GetDescendants()) {
					if (!Child.IsA("Attachment")) {
						continue;
					}
					// eslint-disable-next-line roblox-ts/lua-truthiness
					if (WeaponAttachment.FindFirstChild(Child.Name) && !Child.Name.find("attach_")[0]) {
						Child.WorldCFrame = (WeaponAttachment.FindFirstChild(Child.Name) as Attachment).WorldCFrame;

						Child.ClearAllChildren();

						// Move children from the attachment to the weapon model

						for (const OtherChild of WeaponAttachment.GetChildren()) {
							if (OtherChild.IsA("ParticleEmitter") || OtherChild.IsA("Light")) {
								OtherChild.Parent = Child;
							}
						}
					}
				}

				WeaponAttachment.Parent = ClonedModel;
			}
		}
	}

	for (const [Type, Info] of pairs(AttachmentInfo)) {
		if (Info) {
			ApplyAttachment(Type, Info);
		}
	}

	return ClonedModel;
}
