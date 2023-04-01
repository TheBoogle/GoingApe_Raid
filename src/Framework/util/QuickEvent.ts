export default class QuickEvent {
	public Event: RBXScriptSignal;

	private BindableEvent: BindableEvent;

	constructor() {
		this.BindableEvent = new Instance("BindableEvent");
		this.Event = this.BindableEvent.Event;
	}

	public Fire<T>(...args: T[]): void {
		this.BindableEvent.Fire(args);
	}
}
