import { CollectionService } from "@rbxts/services";
import { Remotes } from "Framework/Network";
import DoorController from "Framework/controllers/DoorController";
import { NetworkingEnums } from "Framework/util/enums";

const DoorMap = new Map<Model, DoorController>();

for (const DoorModel of CollectionService.GetTagged("Door")) {
	const D = new DoorController(DoorModel as Model);

	DoorMap.set(DoorModel as Model, D);
}

Remotes.Client.GetNamespace(NetworkingEnums.RemoteNamespaceId.World)
	.Get(NetworkingEnums.RemoteId.OpenDoor)
	.Connect((...args) => {
		const DoorModel = args[1] as Model;
		const DoorController = DoorMap.get(DoorModel);

		if (DoorController) {
			DoorController.ToggleState();
		}
	});
