import Two from 'twojs-ts';

export interface RoadModel {
	two: Two;
	reset(): void;
	step(): boolean;
}

export class RandomWalkModel implements RoadModel {
	two: Two;
	iter: number;
	maxIters: number;
	currx: number;
	curry: number;

	constructor(two: Two, maxIters: number) {
		this.two = two;
		this.iter = 0;
		this.maxIters = maxIters;
		this.currx = two.width / 2;
		this.curry = two.height / 2;
	}

	reset(): void {
		this.iter = 0;
		this.currx = this.two.width / 2;
		this.curry = this.two.height / 2;
	}

	step(): boolean {
		if (this.iter++ > this.maxIters) {
			return false;
		}

		let prevx = this.currx;
		let prevy = this.curry;

		let choice = Math.random();
		if (choice > 0.75) {
			this.currx += 10;
		}
		else if (choice > 0.5) {
			this.curry += 10;
		}
		else if (choice > 0.25) {
			this.currx -= 10;
		}
		else {
			this.curry -= 10;
		}

		let road = this.two.makeLine(prevx, prevy, this.currx, this.curry);
		return true;
	}
}