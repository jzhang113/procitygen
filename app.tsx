import Two from 'two.js';
import { RoadModel } from './roads/roadmodel';
import { GrowthModel } from './roads/growthmodel';
import { PopMap, PopMapParams } from './popmap';
import { Binding } from './binding';

let two = new Two({
    fullscreen: true,
    autostart: true,
}).appendTo(document.getElementById("canvas"));

let running = false;
let roadgen: RoadModel = new GrowthModel(two, 400, 400);

two.bind(Two.Events.update.toString(), function () {
    if (running) {
        running = roadgen.step();
    }
});

let pm = new PopMap(400, 400);
let pmp = new PopMapParams();
let mapgroup: Two.Group = pm.buildMapGroup(two, pmp);

document.addEventListener("keydown", keyHandler, false);

function keyHandler(event: KeyboardEvent): void {
    console.log(event);

    if (event.key == 'r') {
        pm = new PopMap(400, 400);
        makeMap();

        if (roadgen instanceof GrowthModel) {
            (roadgen as GrowthModel).popmap = pm;
        }

        roadgen.reset();
        running = true;
    }
    else if (event.key == 'c') {
        mapgroup.opacity = 0;
    }
    else if (event.key == 's') {
        mapgroup.opacity = 0.2;
    }
    else if (event.key === "Escape") {
        running = false;
    }
}

document.getElementById("stepbut").onclick = () => { roadgen.step(); };

let rangeobj = new Binding(document.getElementById("resrange"), "8", () => makeMap());
let expobj = new Binding(document.getElementById("exp"), "1", () => makeMap());
let e1obj = new Binding(document.getElementById("e1"), "0.5", () => makeMap());
let e2obj = new Binding(document.getElementById("e2"), "0.125", () => makeMap());
let e3obj = new Binding(document.getElementById("e3"), "0", () => makeMap());
let e4obj = new Binding(document.getElementById("e4"), "0", () => makeMap());
let e5obj = new Binding(document.getElementById("e5"), "0", () => makeMap());
let e6obj = new Binding(document.getElementById("e6"), "0", () => makeMap());

function makeMap() {
    pmp.resolution = parseFloat(rangeobj.data);
    pmp.exp = parseFloat(expobj.data);
    pmp.e1 = parseFloat(e1obj.data);
    pmp.e2 = parseFloat(e2obj.data);
    pmp.e3 = parseFloat(e3obj.data);
    pmp.e4 = parseFloat(e4obj.data);
    pmp.e5 = parseFloat(e5obj.data);
    pmp.e6 = parseFloat(e6obj.data);

    two.clear();
    mapgroup = pm.buildMapGroup(two, pmp);
    mapgroup.opacity = 0.2;
}
