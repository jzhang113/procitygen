import Two from 'two.js';
import QuadTree from 'quadtree-lib';
import PriorityQueue from 'ts-priority-queue';
import { PopMap } from '../popmap';
import { RoadModel } from './roadmodel';
import { RoadData, LocalModification } from './roaddata';
import { DCEL, HalfEdge } from '../geometry';

export class RoadQuery {
	t: number;
	roadData: RoadData;
	prevData: HalfEdge;

	constructor(t: number, ra: RoadData, prev: HalfEdge) {
		this.t = t;
		this.roadData = ra;
		this.prevData = prev;
	}
}

// algorithm from nothings.org/gamedev/l_systems.html which simplifies the road
// creation algorithm provided by Parish and Muller in the paper Procedural
// Modeling of Cities
export class GrowthModel implements RoadModel {
	two: Two;
	model: DCEL;

	width: number;
	height: number;

	Q: PriorityQueue<RoadQuery>;
	S: RoadData[];
	T: QuadTree<RoadData>;
	popmap: PopMap;

	private prevline: RoadData;

	constructor(two: Two, width: number, height: number) {
		this.two = two;
		this.model = new DCEL();

		this.width = width;
		this.height = height;

		this.Q = new PriorityQueue({ comparator: function (a, b) { return a.t - b.t; } });
		this.T = new QuadTree({ width: width, height: height });
		this.reset();
	}

	reset(): void {
		this.model.reset();

		let firstroad = new RoadData();
		firstroad.startx = Math.random() * 200 + 100;
		firstroad.starty = Math.random() * 200 + 100;
		firstroad.length = Math.random() * 10 + 10;
		firstroad.angle = Math.random() * 2 * Math.PI;
		firstroad.edge = this.model.addNewEdge(firstroad.startx, firstroad.starty, firstroad.endx, firstroad.endy);

		let opproad = new RoadData();
		opproad.startx = firstroad.startx;
		opproad.starty = firstroad.starty;
		opproad.length = Math.random() * 10 + 10;
		opproad.angle = firstroad.angle + Math.PI;
		opproad.edge = this.model.addVertex(firstroad.edge.twin.dest, opproad.endx, opproad.endy);

		this.Q.clear();
		this.Q.queue(new RoadQuery(0, firstroad, null));
		this.Q.queue(new RoadQuery(1, opproad, null));
		this.S = [];
		this.T.clear();

		this.prevline = null;
	}

	step(): boolean {
		if (this.Q.length <= 0) {
			console.log('done');
			console.log(this.model);
			return false;
		}

		let next = this.Q.dequeue();
		let success = this.localConstraints(next.roadData);

		if (success) {
			let road = next.roadData;
			// console.log(next.roadData.modification);

			this.S.push(road);
			this.T.push(road);

			let roadline = this.two.makeLine(road.startx, road.starty, road.endx, road.endy);

			if (next.prevData != null) {
				let prevVertex = next.prevData.dest;
				let halfedge;

				if (road.modification === LocalModification.none) {
					halfedge = this.model.addVertex(prevVertex, road.endx, road.endy);
				}
				else {
					halfedge = this.model.splitFace(prevVertex, road.edge.dest);
				}

				road.edge = halfedge;
			}

			roadline.stroke = 'red';
			next.roadData.segment = roadline;

			if (this.prevline != null) {
				if (this.prevline.modification === LocalModification.shorten) {
					this.prevline.segment.stroke = 'lightgreen';
				}
				else if (this.prevline.modification == LocalModification.lengthen) {
					this.prevline.segment.stroke = 'darkgray';
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
		let collisions = this.T.colliding(road, RoadData.checkCollision);

		//  If we have collisions with another road, attempt to shorten the road
		if (collisions.length >= 1) {
			let [intersectFrac, closest] = this.findClosestIntersect(collisions, road);
			if (intersectFrac > 0.5) {
				road.length *= intersectFrac;
				road.modification = LocalModification.shorten;
				road.edge = closest.edge;
				return true;
			}
			else {
				return false;
			}
		}

		// Check ahead to see if we can meet up with another road
		// We do this by inserting a phantom element into the quadtree and checking
		// if any roads intersect with this new element
		// TODO: check for an intersection in a cone
		let phantom = new RoadData();
		phantom.startx = road.endx;
		phantom.starty = road.endy;
		phantom.angle = road.angle;
		phantom.length = road.length * 0.5;

		let roadsAhead = this.T.colliding(phantom, RoadData.checkCollision);
		if (roadsAhead.length >= 1) {
			let [intersectFrac, closest] = this.findClosestIntersect(roadsAhead, phantom);
			road.length *= (1 + intersectFrac * 0.5);
			road.modification = LocalModification.lengthen;
			road.edge = closest.edge;
			return true;
		}

		return true;
	}

	private findClosestIntersect(collisions: RoadData[], road: RoadData) {
		let minIntersectFrac = 1;
		let closestRoad;
		// identify the closest road that collides
		collisions.forEach(element => {
			let intersection = road.intersect(element);
			// intersection should not be false here
			if (intersection !== false) {
				if (intersection.ua < minIntersectFrac) {
					minIntersectFrac = intersection.ua;
					closestRoad = element;
				}
			}
		});

		return [minIntersectFrac, closestRoad];
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

		// intersections (roads that have been modified to meet another road) don't branch
		if (query.roadData.modification === LocalModification.none && 3 * growthrand < growthchance) {
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
		this.Q.queue(new RoadQuery(query.t + 1, newroad, query.roadData.edge));
	}
}