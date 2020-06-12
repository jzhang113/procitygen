import Two from 'twojs-ts';
import { RoadModel, RandomWalkModel, GrowthModel } from './roadmodel';
import { PopMap } from './popmap';

document.addEventListener("keydown", keyHandler, false);

let two = new Two({
    fullscreen: true,
    autostart: true,
}).appendTo(document.body);

let running = false;
let roadgen: RoadModel = new GrowthModel(two);

two.bind(Two.Events.update, function () {
    if (running) {
        running = roadgen.step();
    }
});

let mapgroup: Two.Group;

function keyHandler(event: KeyboardEvent): void {
    console.log(event);

    if (event.key == 'r') {
        two.clear();

        let pm = new PopMap(100, 100);
        mapgroup = pm.buildMapGroup(two, 2);

        roadgen.reset();
        running = true;
    }
    else if (event.key == 'c') {
        mapgroup.opacity = 0;
    }
    else if (event.key == 's') {
        mapgroup.opacity = 1;
    }
    else if (event.key === "Escape") {
        running = false;
    }
}
