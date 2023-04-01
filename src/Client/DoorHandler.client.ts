import { CollectionService } from "@rbxts/services";
import DoorController from "Framework/controllers/DoorController";

for (const DoorModel of CollectionService.GetTagged("Door")) {
	const D = new DoorController(DoorModel as Model);
}
