import { RunService, StarterGui } from "@rbxts/services";
import GameController from "Framework/controllers/GameController";
import { AttachmentInfo, AttachmentType, Attachments } from "Data/Weapons/Attachments";

const GoingApe = new GameController();

const M4Attachments = new Map<AttachmentType, AttachmentInfo>();

function GetAttachment(AttachmentType: AttachmentType, Name: string) {
	return Attachments.get(AttachmentType)?.find((Attachment) => Attachment.Name === Name) as AttachmentInfo;
}

M4Attachments.set(AttachmentType.Optic, GetAttachment(AttachmentType.Optic, "holo"));

M4Attachments.set(AttachmentType.Muzzle, GetAttachment(AttachmentType.Muzzle, "ar_suppressor"));

M4Attachments.set(AttachmentType.Handguard, GetAttachment(AttachmentType.Handguard, "kac"));

M4Attachments.set(AttachmentType.Grip, GetAttachment(AttachmentType.Grip, "v_grip"));

StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.All, false);

GoingApe.EquipWeapon("m4", M4Attachments);
