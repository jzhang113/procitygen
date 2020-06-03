import Two from 'twojs-ts';
import { RoadModel, RandomWalkModel } from './roadmodel';

document.addEventListener("keydown", keyHandler, false);

let two = new Two({
    fullscreen: true,
    autostart: true
}).appendTo(document.body);

let running = false;
let roadgen: RoadModel = new RandomWalkModel(two, 500);

two.bind(Two.Events.update, function () {
    if (running) {
        running = roadgen.step();
    }
});

function keyHandler(event: KeyboardEvent): void {
    console.log(event);

    if (event.key == 'r') {
        two.clear();
        roadgen.reset();
        running = true;
    }
}
