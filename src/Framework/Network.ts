import Net, { Definitions } from "@rbxts/net";
import { NetworkingEnums } from "./util/enums";

export const Remotes = Net.CreateDefinitions({
	[NetworkingEnums.RemoteNamespaceId.Weapons]: Definitions.Namespace({
		[NetworkingEnums.RemoteId.FireRound]: Definitions.ClientToServerEvent(),
	}),
	[NetworkingEnums.RemoteNamespaceId.World]: Definitions.Namespace({
		[NetworkingEnums.RemoteId.OpenDoor]: Definitions.BidirectionalEvent(),
	}),
});
