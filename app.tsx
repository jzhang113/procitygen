import Two from 'twojs-ts';

document.addEventListener("keydown", keyHandler, false);

let two = new Two({
    fullscreen: true,
    autostart: true
}).appendTo(document.body);

let running = false;
let iter = 0;

two.bind(Two.Events.update, function () {
    if (running) {
        generateStep();
    }
});

function keyHandler(event: KeyboardEvent): void {
    console.log(event);

    if (event.key == 'r') {
        two.clear();
        iter = 0;
        running = true;
    }
}

function generateStep() {
    if (iter > 100) {
        running = false;
        return;
    }

    let currx = two.width / 2;
    let curry = two.height / 2;

    let points = [currx, curry];

    for (let i = 1; i < 10; i++) {
        if (Math.random() > 0.5) {
            currx += 100;
        }
        else {
            curry += 100;
        }

        points.push(currx, curry);
    }

    console.log(points);

    for (let i = 0; i < 10; i++) {
        let road = two.makeLine(points[2 * i], points[2 * i + 1], points[2 * i + 2], points[2 * i + 3]);
    }
}