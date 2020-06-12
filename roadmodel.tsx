import Two from 'twojs-ts';
import PriorityQueue from 'ts-priority-queue';
import { makeNoise2D, Noise2D } from 'open-simplex-noise';
import { PopMap } from './popmap';

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
		this.maxIters = maxIters;
		this.reset();
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

export class RoadQuery {
	t: number;
	roadData: RoadData;
	queryAttr: any;

	constructor(t: number, ra: any, qa: any) {
		this.t = t;
		this.roadData = ra;
		this.queryAttr = qa;
	}
}

export class RoadData {
	startx: number;
	starty: number;
	length: number;
	angle: number;

	get endx() {
		return this.startx + this.length * Math.sin(this.angle);
	}

	get endy() {
		return this.starty + this.length * Math.cos(this.angle);
	}
}

// algorithm from nothings.org/gamedev/l_systems.html which simplifies the road​
// creation algorithm provided by Parish and Muller in the paper Procedural​
// Modeling of Cities​
export class GrowthModel implements RoadModel {
	two: Two;
	Q: PriorityQueue<RoadQuery>;
	S: RoadData[];
	popmap: PopMap;

	constructor(two: Two) {
		this.two = two;
		this.Q = new PriorityQueue({ comparator: function (a, b) { return a.t - b.t; } });
		this.reset();
	}

	reset(): void {
		this.Q.clear();
		this.Q.queue(new RoadQuery(0, null, null));
		this.S = [];
		this.popmap = new PopMap(100, 100);
	}

	step(): boolean {
		if (this.Q.length <= 0) {
			return false;
		}

		let next = this.Q.dequeue();
		let success = this.localConstraints(next.roadData);

		if (success) {
			this.S.push(next.roadData);
			this.two.makeLine(next.roadData.startx, next.roadData.starty, next.roadData.endx, next.roadData.endy);

			this.globalConstraints(next);
		}

		return true;
	}

	// adjust roads based on local conditions
	// this handles two situations:  when a road is too long or is too short
	// if a road is too long and extends into an illegal area, it may be shortened
	// or rotated, up to a maximal amount
	// if a road is too short and ends close to another road, it is extended so
	// it meets up with the other road
	private localConstraints(road: RoadData): RoadData {
		// TODO
		return road;
	}

	// propose up to three new roads (forward, left, and right) to add to the
	// road network, based on the desired road pattern
	private globalConstraints(query: RoadQuery) {

	}
}