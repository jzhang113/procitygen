import Two from 'twojs-ts';
import { Noise2D, makeNoise2D } from 'open-simplex-noise';

export class PopMap {
    map: Noise2D;
    width: number;
    height: number;

    constructor(width: number, height: number) {
        this.map = makeNoise2D(Date.now());
        this.width = width;
        this.height = height;
    }

    buildMapGroup(two: Two, resolution: number): Two.Group {
        let shapes: Two.Shape[] = [];

        let k = 4;
        let thresh = 0.6;
        let spacing = 4;

        for (let x = 0; x < this.width; x += resolution) {
            for (let y = 0; y < this.height; y += resolution) {
                let nx = x / this.width - 0.5;
                let ny = y / this.height - 0.5;
                let val = (this.map(k * nx, k * ny) + 1) / 2 + (this.map(2 * k * nx, 2 * k * ny) + 1) / 8;

                val = Math.pow(val, 2.6);

                if (val > thresh) {
                    let circ = two.makeRectangle(x * spacing, y * spacing, spacing * resolution, spacing * resolution);

                    circ.fill = `rgb(${(1 - val) * 256}, ${(1 - val) * 256}, ${(1 - val) * 256})`;
                    circ.stroke = `rgb(${(1 - val) * 256}, ${(1 - val) * 256}, ${(1 - val) * 256})`;
                    shapes.push(circ);
                }
                else if (val > thresh - 0.1) {
                    let circ = two.makeRectangle(x * spacing, y * spacing, spacing * resolution, spacing * resolution);

                    circ.fill = 'red';
                    circ.stroke = `red`;
                    shapes.push(circ);
                }
            }
        }

        return two.makeGroup(shapes);
    }
}