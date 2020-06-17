// Half-edge geometry, also known as a DCEL
// See http://www.holmes3d.net/graphics/dcel for a description of this data structure
// Edges represent roads, faces represent blocks

import { RoadData } from './roads/roaddata';
import { orient2d } from 'robust-predicates';

export class HalfEdge {
    twin: HalfEdge;
    next: HalfEdge;
    dest: Vertex;
    face: Face;
    data: RoadData;

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
        this.faces = [this.outside];
    }

    /**
     * Add a new half edge not attached to any existing vertices
     */
    addNewEdge(x1: number, y1: number, x2: number, y2: number): HalfEdge {
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
        opp.face = this.outside;
        v1.arriving = opp;

        this.edges.push(edge);
        this.edges.push(opp);

        return edge;
    }

    /**
     * Add a new half edge between an existing vertex and a new vertex
     */
    addVertex(v1: Vertex, x2: number, y2: number): HalfEdge {
        let v2 = this.makeVertex(x2, y2);
        let leftedge = this.findSegmentLeft(v1, v2);

        return this.addEdgeRight(leftedge, v2);
    }

    /**
     * Add a new half edge to the right of a given half edge h
     */
    addEdgeRight(h: HalfEdge, v: Vertex): HalfEdge {
        let edge = new HalfEdge();
        let opp = new HalfEdge();

        v.arriving = edge;

        edge.twin = opp;
        edge.dest = v;
        edge.face = h.face;

        opp.twin = edge;
        opp.dest = h.dest;
        opp.face = edge.face;

        edge.next = opp;
        opp.next = h.next;
        h.next = edge;

        this.edges.push(edge);
        this.edges.push(opp);

        return edge;
    }

    /**
     * Add a new half edge between two existing vertices, creating a new face
     */
    splitFace(v1: Vertex, v2: Vertex): HalfEdge {
        let left = this.findSegmentLeft(v1, v2);
        let right = this.findSegmentLeft(v2, v1);

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

    // we need to find the two half edges that v2 lies between
    // this occurs when v2 is left of both edges
    findSegmentLeft(v1: Vertex, v2: Vertex): HalfEdge {
        let firstedge = v1.arriving;
        let leftedge = v1.arriving;
        let rightedge = leftedge.next;

        while (!(leftedge.leftof(v2) && rightedge.leftof(v2))) {
            // v2 is not between the edges, so we move to the next arriving half edge to v1
            leftedge = rightedge.twin;
            rightedge = leftedge.next;

            if (leftedge == firstedge) {
                console.error(`could not place new edge to ${v2.x} ${v2.y}`);
                break;
            }
        }

        return leftedge;
    }

    makeVertex(x: number, y: number): Vertex {
        let vertex = new Vertex();
        vertex.x = x;
        vertex.y = y;

        this.vertices.push(vertex);
        return vertex;
    }
}