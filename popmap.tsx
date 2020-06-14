import Two from 'two.js';
import { Noise2D, makeNoise2D } from 'open-simplex-noise';

export class PopMapParams {
    resolution: number = 8;
    exp: number = 1;
    e1: number = 0.5;
    e2: number = 0;
    e3: number = 0;
    e4: number = 0;
    e5: number = 0;
    e6: number = 0;

    get esum() {
        return this.e1 + this.e2 + this.e3 + this.e4 + this.e5 + this.e6;
    }
}

export class PopMap {
    map: Noise2D;
    width: number;
    height: number;
    params: PopMapParams;

    constructor(width: number, height: number) {
        this.map = makeNoise2D(Date.now());
        this.width = width;
        this.height = height;
    }

    mapValue(x: number, y: number): number {
        let val = this.params.e1 * (this.map(x, y) + 1)
            + this.params.e2 * (this.map(2 * x, 2 * y) + 1)
            + this.params.e3 * (this.map(4 * x, 4 * y) + 1)
            + this.params.e4 * (this.map(8 * x, 8 * y) + 1)
            + this.params.e5 * (this.map(16 * x, 16 * y) + 1)
            + this.params.e6 * (this.map(32 * x, 32 * y) + 1);

        val /= 2 * this.params.esum;
        val = Math.pow(val, this.params.exp);

        return val;
    }

    buildMapGroup(two: Two, params: PopMapParams): Two.Group {
        this.params = params;

        let shapes: Two.Path[] = [];

        let k = 4;
        let thresh = 0.6;
        let spacing = 1;

        let w = spacing * params.resolution;
        let h = spacing * params.resolution;

        for (let x = 0; x < this.width; x += params.resolution) {
            for (let y = 0; y < this.height; y += params.resolution) {
                let nx = x / this.width - 0.5;
                let ny = y / this.height - 0.5;
                let val = this.mapValue(nx, ny);

                if (val > thresh) {
                    let circ = two.makeRectangle(x * spacing, y * spacing, w, h);

                    circ.fill = `rgb(${(1 - val) * 256}, ${(1 - val) * 256}, ${(1 - val) * 256})`;
                    circ.stroke = `rgb(${(1 - val) * 256}, ${(1 - val) * 256}, ${(1 - val) * 256})`;
                    shapes.push(circ);
                }
                else if (val > thresh - 0.1) {
                    let circ = two.makeRectangle(x * spacing, y * spacing, w, h);

                    circ.fill = 'red';
                    circ.stroke = `red`;
                    shapes.push(circ);
                }
            }
        }

        return two.makeGroup(shapes);
    }


}