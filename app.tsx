import Two from 'twojs-ts';

let two = new Two({
    fullscreen: true,
    autostart: true
}).appendTo(document.body);

let rect = two.makeRectangle(two.width / 2, two.height / 2, 50, 50);
two.bind(Two.Events.update, function () {
    rect.rotation += 0.01;
});
