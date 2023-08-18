import { Remotes } from "Framework/Network";
import { NetworkingEnums } from "Framework/util/enums";

Remotes.Server.GetNamespace(NetworkingEnums.RemoteNamespaceId.Weapons);

Remotes.Server.GetNamespace(NetworkingEnums.RemoteNamespaceId.World)
	.Get(NetworkingEnums.RemoteId.OpenDoor)
	.Connect((...args) => {
		Remotes.Server.GetNamespace(NetworkingEnums.RemoteNamespaceId.World)
			.Get(NetworkingEnums.RemoteId.OpenDoor)
			.SendToAllPlayers(...args);
	});
