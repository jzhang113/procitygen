// Half-edge geometry, also known as a DCEL
// See http://www.holmes3d.net/graphics/dcel for a description of this data structure
// Edges represent roads, faces represent blocks

import { RoadData }  from './roads/roaddata'

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
		this.faces = [];
	}
	
	makeHalfEdgeA(x1: number, y1: number, x2: number, y2: number): HalfEdge {
		let v1 = new Vertex();
		v1.x = x1;
		v1.y = y1;
		let v2 = new Vertex();
		v2.x = x2;
		v2.y = y2;
		
		let edge = new HalfEdge();
		let opp = new HalfEdge();
		
		edge.twin = opp;
		edge.dest = v2;
		edge.face = this.outside;
		v2.arriving = edge;
		
		opp.twin = edge;
		opp.dest = v1;
		opp.face = edge.face;
		v1.arriving = opp;
		
		this.vertices.push(v1);
		this.vertices.push(v2);
		this.edges.push(edge);
		this.edges.push(opp);
		
		return edge;
	}
	
	makeHalfEdgeB(v1: Vertex, x2: number, y2: number): HalfEdge {
		let v2 = new Vertex();
		v2.x = x2;
		v2.y = y2;
		
		let edge = new HalfEdge();
		let opp = new HalfEdge();
		
		edge.twin = opp;
		edge.dest = v2;
		edge.face = v1.arriving.face;		

		let oldnext = v1.arriving.next;
		v1.arriving.next = edge;
		v2.arriving = edge;
		
		opp.twin = edge;
		opp.dest = v1;
		opp.face = edge.face;
		opp.next = v1.arriving.twin;
		v1.arriving = opp;
		
		this.vertices.push(v2);
		this.edges.push(edge);
		this.edges.push(opp);
		
		return edge;
	}
		
	makeHalfEdgeC(v1: Vertex, v2: vertex): HalfEdge {
		let newface = new Face();
		let edge = new HalfEdge();
		let opp = new HalfEdge();
	
		edge.twin = opp;
		edge.dest = v2;		
		edge.face = v1.arriving.face;
		edge.next = v2.arriving.next;
		v2.arriving.next = opp;
		v2.arriving = edge;
		
		opp.twin = edge;
		opp.dest = v1;
		opp.next = v1.arriving.twin;
		opp.face = newface;
		newface.boundary = opp;
		v1.arriving = opp;
	
		this.edges.push(edge);
		this.edges.push(opp);
		this.faces.push(newface);
		
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