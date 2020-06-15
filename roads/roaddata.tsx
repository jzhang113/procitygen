import QuadTree from 'quadtree-lib';

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
	 * Line intercept math by Paul Bourke http://paulbourke.net/geometry/pointlineplane/
	 * Determine whether two line segments intersect
	 * @param other the other road to test intersection with
	 * @returns Fraction the intersection occurs on each line segments if they
	 *			intersect or FALSE if they do not intersect
	 */
	intersect(other: RoadData): false | { ua: number, ub: number } {
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

	/**
	 * Collision check for comparing roads in the quadtree
	 * @param r1 first road to compare
	 * @param r2 second road to compare
	 * @returns TRUE if the roads intersect and FALSE otherwise
	 */
	static checkCollision(r1: RoadData, r2: RoadData) {
		let intersection = r1.intersect(r2);
		if (intersection === false) {
			return false;
		}
		else {
			return true;
		}
	}
}