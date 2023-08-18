import { Players, RunService, TeleportService } from "@rbxts/services";

if (!RunService.IsStudio()) {
	game.BindToClose(() => {
		TeleportService.TeleportPartyAsync(game.PlaceId, Players.GetPlayers());
	});
}
