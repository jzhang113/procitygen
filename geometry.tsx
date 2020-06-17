// Half-edge geometry, also known as a DCEL
// See http://www.holmes3d.net/graphics/dcel for a description of this data structure
// Edges represent roads, faces represent blocks

import { RoadData }  from './roads/roaddata';
import { orient2d } from 'robust-predicates';

export class HalfEdge {
	twin: HalfEdge;
	next: HalfEdge;
	dest: Vertex;
	face: Face;	
	data: RoadData;
	
	setTwin(newTwin: HalfEdge): void {
		this.twin = newTwin;
		newTwin.twin = this;
	}
	
	setNext(newNext: HalfEdge): void {
		this.next = newNext;
		newNext.prev = this;
	}
	
	leftof(c: Vertex): boolean {
		let a = this.twin.dest;
		let b = this.dest;
		return orient2d(a.x, a.y, b.x, b.y, c.x, c.y) >= 0;
	}
}

export class Face {
	boundary: HalfEdge;
	data: any;
}

export class Vertex {
	x: number;
	y: number;
	arriving: HalfEdge;
}

export class DCEL {
	edges: HalfEdge[];
	vertices: Vertex[];
	faces: Face[];
	outside: Face;
	
	constructor() {		
		this.outside = new Face();	
		this.reset();
	}
	
	reset() {
		this.edges = [];
		this.vertices = [];
		this.faces = [ this.outside ];
	}

	/**
	 * Add a half edge, when neither vertices exist yet
	 */
	makeHalfEdgeA(x1: number, y1: number, x2: number, y2: number): HalfEdge {
		let v1 = this.makeVertex(x1, y1);
		let v2 = this.makeVertex(x2, y2);
		
		let edge = new HalfEdge();
		let opp = new HalfEdge();
		
		edge.twin = opp;
		edge.next = opp;
		edge.dest = v2;
		edge.face = this.outside;
		v2.arriving = edge;
		
		opp.twin = edge;
		opp.next = edge;
		opp.dest = v1;
		opp.face = edge.face;
		v1.arriving = opp;
		
		this.edges.push(edge);
		this.edges.push(opp);
		
		return edge;
	}
	
	/**
	 * Add a half edge, when only the origin vertex exists
	 */
	makeHalfEdgeB(v1: Vertex, x2: number, y2: number): HalfEdge {
		let v2 = this.makeVertex(x2, y2);		
		let left = this.findLeftEdge(v1, v2);
		
		let edge = new HalfEdge();
		let opp = new HalfEdge();
				
		edge.twin = opp;
		edge.dest = v2;
		opp.twin = edge;
		opp.dest = v1;
		v2.arriving = edge;
		
		opp.next = left.next;
		
		left.next = edge;
		edge.face = left.face;
		opp.face = edge.face;

		edge.next = opp;

		this.edges.push(edge);
		this.edges.push(opp);
		
		return edge;
	}
	
	findLeftEdge(v1: Vertex, v2: Vertex): HalfEdge {
		let left = v1.arriving;
		let right = v1.arriving.next.twin;
		let first = left;
		let iters = 0;
		
		while (!(left.leftof(v2) && !right.leftof(v2))) {
			left = right;
			right = left.next.twin;
			iters++;
			
			if (left === first || iters > 100) {
				if (iters > 1) {
					console.log(`tried ${iters}?`);
				}
				
				break;
			}
		}
		
		return left;
	}

	/**
	 * Add a half edge, when both vertices exist
	 * This also creates a new face
	 */
	makeHalfEdgeC(v1: Vertex, v2: vertex): HalfEdge {		
		let left = this.findLeftEdge(v1, v2);
		let right = this.findLeftEdge(v2, v1);
			
		let edge = new HalfEdge();
		let opp = new HalfEdge();
	
		edge.twin = opp;
		edge.dest = v2;		
		edge.next = right.next;
		right.next = opp;
		v2.arriving = edge;
		
		opp.twin = edge;
		opp.dest = v1;
		opp.next = left.next;
		left.next = edge;
		v1.arriving = opp;
	
		let oldface = left.face;
		let f1 = new Face();
		f1.boundary = edge;
		edge.face = f1;
		let first = edge;
		let trace = first.next;	

		while (trace !== first) {
			trace.face = f1;
			trace = trace.next;
		}
		
		let f2 = new Face();
		f2.boundary = opp;
		opp.face = f2;
		first = opp;
		trace = first.next;	

		while (trace !== first) {
			trace.face = f2;
			trace = trace.next;
		}
		
		let index = this.faces.indexOf(oldface);
		if (index > -1) {
			this.faces.splice(index, 1);
		}			

		this.faces.push(f1);
		this.faces.push(f2);

		
		this.edges.push(edge);
		this.edges.push(opp);
		
		return edge;
	}
	
	makeVertex(x: number, y: number): Vertex {
		let vertex = new Vertex();
		vertex.x = x;
		vertex.y = y;
		
		this.vertices.push(vertex);
		return vertex;
	}
}