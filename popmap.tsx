import Two from 'twojs-ts';
import { Noise2D, makeNoise2D } from 'open-simplex-noise';

export class PopMapParams {
    resolution: number = 1;
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

    constructor(width: number, height: number) {
        this.map = makeNoise2D(Date.now());
        this.width = width;
        this.height = height;
    }

    buildMapGroup(two: Two, params: PopMapParams): Two.Group {
        let shapes: Two.Shape[] = [];

        let k = 4;
        let thresh = 0.6;
        let spacing = 4;

        let w = spacing * params.resolution;
        let h = spacing * params.resolution;

        console.log(params);

        for (let x = 0; x < this.width; x += params.resolution) {
            for (let y = 0; y < this.height; y += params.resolution) {
                let nx = x / this.width - 0.5;
                let ny = y / this.height - 0.5;
                let val = params.e1 * (this.map(nx, ny) + 1)
                    + params.e2 * (this.map(2 * nx, 2 * ny) + 1)
                    + params.e3 * (this.map(4 * nx, 4 * ny) + 1)
                    + params.e4 * (this.map(8 * nx, 8 * ny) + 1)
                    + params.e5 * (this.map(16 * nx, 16 * ny) + 1)
                    + params.e6 * (this.map(32 * nx, 32 * ny) + 1);

                val /= 2 * params.esum;
                val = Math.pow(val, params.exp);


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