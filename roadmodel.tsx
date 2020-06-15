import Two from 'two.js';
import QuadTree from 'quadtree-lib';
import PriorityQueue from 'ts-priority-queue';
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

	constructor(t: number, ra: any) {
		this.t = t;
		this.roadData = ra;
	}
}

export enum LocalModification {
	none,
	shorten,
	lengthen
}

export class RoadData implements QuadTree.QuadtreeItem {
	/**
	 * Starting x-coordinate of the road
	 */
	startx: number;
	/**
	 * Startying y-coordinate of the road
	 */
	starty: number;
	/**
	 * Length of the road
	 */
	length: number;
	/**
	 * Angle of the road, in radians
	 */
	angle: number;
	/**
	 * Records the post-processing step that was applied to this road
	 */
	modification: LocalModification = LocalModification.none;
	/**
	 * Visual line corresponding to this road
	 */
	segment: Two.Line;

	get endx() {
		return this.startx + this.length * Math.sin(this.angle);
	}

	get endy() {
		return this.starty + this.length * Math.cos(this.angle);
	}

	/**
	 * Top-left most x-coordinate of the road
	 */
	get x() {
		return Math.min(this.startx, this.endx);
	}

	/**
	 * Top-left most y-coordinate of the road
	 */
	get y() {
		return Math.min(this.starty, this.endy);
	}

	/**
	 * Width of the AABB enclosing the road
	 */
	get width() {
		let x1 = this.startx;
		let x2 = this.endx;
		return Math.max(x1, x2) - Math.min(x1, x2);
	}

	/**
	 * Height of the AABB enclosing the road
	 */
	get height() {
		let y1 = this.starty;
		let y2 = this.endy;
		return Math.max(y1, y2) - Math.min(y1, y2);
	}

	/**
	 * ine intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
	 * Determine whether two line segments intersect
	 * @param other the other road to test intersection with
	 * @returns Fraction the intersection occurs on each line segments if they intersect or FALSE otherwise
	 */
	intersect(other: RoadData): boolean | { ua: number, ub: number } {
		let x1 = this.startx, y1 = this.starty;
		let x2 = this.endx, y2 = this.endy;
		let x3 = other.startx, y3 = other.starty;
		let x4 = other.endx, y4 = other.endy;

		// Check if none of the lines are of length 0
		if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
			return false;
		}

		let denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

		// Lines are parallel
		if (denominator === 0) {
			return false;
		}

		let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
		let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

		// is the intersection along the segments
		if (ua <= 0 || ua > 1 || ub <= 0 || ub > 1) {
			return false;
		}

		// Return a object with the x and y coordinates of the intersection
		// let x = x1 + ua * (x2 - x1)
		// let y = y1 + ua * (y2 - y1)
		return { ua, ub };
	}
}

// algorithm from nothings.org/gamedev/l_systems.html which simplifies the road
// creation algorithm provided by Parish and Muller in the paper Procedural
// Modeling of Cities
export class GrowthModel implements RoadModel {
	two: Two;
	width: number;
	height: number;

	Q: PriorityQueue<RoadQuery>;
	S: RoadData[];
	T: QuadTree<RoadData>;
	popmap: PopMap;

	private prevline: RoadData;

	constructor(two: Two, width: number, height: number) {
		this.two = two;
		this.width = width;
		this.height = height;

		this.Q = new PriorityQueue({ comparator: function (a, b) { return a.t - b.t; } });
		this.T = new QuadTree({ width: width, height: height });
		this.reset();
	}

	reset(): void {
		let firstroad = new RoadData();
		firstroad.startx = Math.random() * 200 + 100;
		firstroad.starty = Math.random() * 200 + 100;
		firstroad.length = Math.random() * 10 + 10;
		firstroad.angle = Math.random() * 2 * Math.PI;

		let opproad = new RoadData();
		opproad.startx = firstroad.startx;
		opproad.starty = firstroad.starty;
		opproad.length = Math.random() * 10 + 10;
		opproad.angle = firstroad.angle + Math.PI;

		this.Q.clear();
		this.Q.queue(new RoadQuery(0, firstroad));
		this.Q.queue(new RoadQuery(1, opproad));
		this.S = [];
		this.T.clear();

		this.prevline = null;
	}

	step(): boolean {
		if (this.Q.length <= 0) {
			console.log('done');
			return false;
		}

		let next = this.Q.dequeue();
		let success = this.localConstraints(next.roadData);

		if (success) {
			let road = next.roadData;
			console.log(next.roadData.modification);

			this.S.push(road);
			this.T.push(road);

			let roadline = this.two.makeLine(road.startx, road.starty, road.endx, road.endy);
			roadline.stroke = 'red';
			next.roadData.segment = roadline;

			if (this.prevline != null) {
				if (this.prevline.modification === LocalModification.shorten) {
					this.prevline.segment.stroke = 'lightgreen';
				}
				else {
					this.prevline.segment.stroke = 'green';
				}

			}
			this.prevline = next.roadData;

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
	private localConstraints(road: RoadData): boolean {
		let collisions = this.T.colliding(road, (r1, r2) => {
			let intersection = r1.intersect(r2);
			if (typeof intersection === "boolean") {
				return false;
			}
			else {
				return true;
			}
		});

		//  If we have collisions with another road, attempt to shorten the road
		if (collisions.length >= 1) {
			let minIntersectFrac = 1;
			let closestRoad;

			// identify the closest road that collides
			collisions.forEach(element => {
				let intersection = road.intersect(element);

				// intersection should not be false here
				if (typeof intersection !== "boolean") {
					if (intersection.ua < minIntersectFrac) {
						minIntersectFrac = intersection.ua;
						closestRoad = element;
					}
				}
			});

			if (minIntersectFrac > 0.5) {
				road.length *= minIntersectFrac;
				road.modification = LocalModification.shorten;
				return true;
			}
			else {
				return false;
			}
		}

		return true;
	}

	// propose up to three new roads (forward, left, and right) to add to the
	// road network, based on the desired road pattern
	private globalConstraints(query: RoadQuery) {
		if (query.t > 10000) {
			// failsafe
			return;
		}

		if (query.roadData.startx < 0 || query.roadData.startx > this.width || query.roadData.starty < 0 || query.roadData.starty > this.height) {
			return;
		}

		let growthchance = this.popmap.mapValue(query.roadData.endx, query.roadData.endy);
		let growthrand = Math.random();

		if (this.S.length < 10 || 8 * growthrand > growthchance) {
			this.sampleRoad(query, query.roadData.angle);
		}

		if (3 * growthrand < growthchance) {
			if (Math.random() < 0.5) {
				// branch left
				this.sampleRoad(query, query.roadData.angle - Math.PI / 2);
			}
			else {
				// branch right
				this.sampleRoad(query, query.roadData.angle + Math.PI / 2);
			}
		}
	}

	private sampleRoad(query: RoadQuery, baseAngle: number) {
		let newroad = new RoadData();
		newroad.startx = query.roadData.endx;
		newroad.starty = query.roadData.endy;
		newroad.length = Math.random() * 10 + 10;
		let anglerange = Math.PI / 8;
		let finalangle = 0;
		let proposals = 8;
		let contribs = 0;

		for (let proposedAngle = baseAngle - anglerange; proposedAngle <= baseAngle + anglerange; proposedAngle += anglerange / proposals) {
			newroad.angle = proposedAngle;
			let weight = this.popmap.mapValue(newroad.endx, newroad.endy);
			finalangle += proposedAngle * weight;
			contribs += weight;
		}

		newroad.angle = finalangle / contribs;
		this.Q.queue(new RoadQuery(query.t + 1, newroad));
	}
}