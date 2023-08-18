import { UserInputService } from "@rbxts/services";

export default class _UserInputHandler {
	private CurrentInputs = new Map<Enum.KeyCode, boolean>();

	constructor() {
		UserInputService.InputBegan.Connect((Input: InputObject, GameProcessed: boolean) => {
			if (Input.UserInputType !== Enum.UserInputType.Keyboard) {
				return;
			}

			if (GameProcessed) {
				return;
			}

			this.CurrentInputs.set(Input.KeyCode, true);
		});

		UserInputService.InputEnded.Connect((Input: InputObject, GameProcessed: boolean) => {
			if (Input.UserInputType !== Enum.UserInputType.Keyboard) {
				return;
			}

			if (GameProcessed) {
				return;
			}

			this.CurrentInputs.set(Input.KeyCode, false);
		});
	}

	/**
	 * IsKeyDown
	 */
	public IsKeyDown(Key: Enum.KeyCode): boolean {
		return this.CurrentInputs.get(Key) ?? false;
	}
}
