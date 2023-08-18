import BaseController from "Framework/controllers/BaseController";
import { GameEnums } from "Framework/util/enums";

export default class DoorController extends BaseController {
	public DoorState = GameEnums.DoorState.Closed;
	public Locked = false;
	public KeyId = undefined;
	public OpenSpeed = 1;

	private Model: Model;
	private LoadedAnimations: { [Name: string]: AnimationTrack } = {};
	private Sounds: { [Name: string]: Sound } = {};

	constructor(Model: Model) {
		super();

		this.Model = Model;

		const AnimationsFolder = Model.FindFirstChild("Animations") as Folder;
		const SoundsFolder = Model.FindFirstChild("Sounds") as Folder;
		const AnimationController =
			Model.FindFirstChildOfClass("AnimationController")?.FindFirstChildOfClass("Animator");

		const UnloadedAnimations = AnimationsFolder?.GetChildren() as Animation[];
		const Sounds = SoundsFolder.GetChildren() as Sound[];

		if (!AnimationsFolder) {
			return;
		}

		for (const UnloadedAnimation of UnloadedAnimations) {
			const LoadedAnimation = AnimationController?.LoadAnimation(UnloadedAnimation) as AnimationTrack;

			LoadedAnimation.Looped = true;
			this.LoadedAnimations[UnloadedAnimation?.Name] = LoadedAnimation;
		}

		for (const Sound of Sounds) {
			this.Sounds[Sound.Name] = Sound;
		}
	}

	/**
	 * Toggles the current state of the door
	 */
	public ToggleState() {
		if (this.DoorState === GameEnums.DoorState.Closed) {
			this.DoorState = GameEnums.DoorState.Open;
		} else {
			this.DoorState = GameEnums.DoorState.Closed;
		}

		this.RestartAnimation();
	}

	public RestartAnimation() {
		for (const [AnimationName, AnimationTrack] of pairs(this.LoadedAnimations)) {
			AnimationTrack.Stop(this.OpenSpeed);
		}

		if (this.DoorState === GameEnums.DoorState.Closed) {
			this.LoadedAnimations["Close"].Play(this.OpenSpeed);

			task.delay(1, () => {
				this.Sounds["Close"].Play();
			});
		} else {
			this.LoadedAnimations["Open"].Play(this.OpenSpeed);
			this.Sounds["Open"].Play();
		}
	}
}
