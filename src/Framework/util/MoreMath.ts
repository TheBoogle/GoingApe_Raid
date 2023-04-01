export namespace MoreMath {
	export function Map(X: number, InMin: number, InMax: number, OutMin: number, OutMax: number) {
		return OutMin + ((X - InMin) * (OutMax - OutMin)) / (InMax - InMin);
	}
	export function Lerp(X: number, NewX: number, Alpha: number) {
		return X + (NewX - X) * Alpha;
	}
}
