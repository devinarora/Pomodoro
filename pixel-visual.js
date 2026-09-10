(function () {
    'use strict';

    var CELL = 10;
    var W = 22;
    var H = 22;
    var WATER_TOP = 13;
    var DECK = 11;
    var PIER_EDGE = 9;

    var COLORS = {
        sky: '#8fb8e0',
        skyLight: '#a8c8e8',
        sun: '#ffcf5c',
        water: '#2b6db0',
        waterLight: '#4d8bc8',
        waterDark: '#1f548c',
        plank: '#b98a5e',
        plankDark: '#9a6f47',
        post: '#6b4f35',
        hat: '#e7c166',
        hatBand: '#c0392b',
        skin: '#f2c49b',
        shirt: '#d94f5c',
        pants: '#3d5a80',
        boot: '#5a4632',
        rod: '#9c6b30',
        line: '#e6ecf2',
        bobber: '#e74c3c',
        bobberTop: '#fbf6e8',
        fish: '#e8833c',
        fishLight: '#f3c97b',
        eye: '#2b2b2b'
    };

    var FISH = ['fFF.', 'FFFF', '.fFF'];

    var canvas = null;
    var ctx = null;
    var rafId = null;
    var phase = 'idle';
    var phaseStart = 0;

    function at(x, y, color) {
        if (x < 0 || y < 0 || x >= W || y >= H) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }

    function drawLine(x0, y0, x1, y1, color) {
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = x0 < x1 ? 1 : -1;
        var sy = y0 < y1 ? 1 : -1;
        var err = dx - dy;
        var x = x0;
        var y = y0;
        while (true) {
            at(x, y, color);
            if (x === x1 && y === y1) break;
            var e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x += sx; }
            if (e2 < dx) { err += dx; y += sy; }
        }
    }

    function drawBackground(t) {
        var x, y;
        for (y = 0; y < WATER_TOP; y++) {
            for (x = 0; x < W; x++) at(x, y, COLORS.sky);
        }
        at(18, 2, COLORS.sun);
        at(19, 1, COLORS.sun);
        at(19, 2, COLORS.sun);
        at(20, 2, COLORS.sun);
        at(19, 3, COLORS.sun);
        at(15, 2, COLORS.skyLight);
        at(16, 2, COLORS.skyLight);
        at(17, 2, COLORS.skyLight);
        at(14, 3, COLORS.skyLight);
        at(15, 3, COLORS.skyLight);
        at(16, 3, COLORS.skyLight);
        at(18, 3, COLORS.skyLight);

        for (y = WATER_TOP; y < H; y++) {
            for (x = 0; x < W; x++) at(x, y, COLORS.water);
        }
        for (x = 0; x < W; x++) {
            at(x, WATER_TOP + 3, COLORS.waterDark);
            at(x, WATER_TOP + 6, COLORS.waterDark);
        }
        var tw = Math.floor(t / 700) % 2;
        if (tw === 0) {
            at(15, 15, COLORS.waterLight);
            at(18, 18, COLORS.waterLight);
        } else {
            at(15, 18, COLORS.waterLight);
            at(19, 15, COLORS.waterLight);
        }

        for (x = 0; x <= PIER_EDGE; x++) {
            at(x, DECK, x % 2 === 0 ? COLORS.plank : COLORS.plankDark);
        }
        var posts = [1, 4, 7, PIER_EDGE];
        for (var i = 0; i < posts.length; i++) {
            for (y = DECK + 1; y <= DECK + 6; y++) at(posts[i], y, COLORS.post);
        }
    }

    function drawFishermanStanding() {
        var x0 = 4;
        var feet = DECK;
        var x, y;
        for (y = feet - 2; y <= feet - 1; y++) {
            at(x0 - 1, y, COLORS.pants);
            at(x0 + 1, y, COLORS.pants);
        }
        at(x0 - 1, feet, COLORS.boot);
        at(x0 + 1, feet, COLORS.boot);
        for (y = feet - 7; y <= feet - 3; y++) {
            for (x = x0 - 2; x <= x0 + 2; x++) at(x, y, COLORS.shirt);
        }
        at(x0 - 1, feet - 9, COLORS.skin);
        at(x0, feet - 9, COLORS.skin);
        at(x0 + 1, feet - 9, COLORS.skin);
        at(x0 - 1, feet - 8, COLORS.skin);
        at(x0, feet - 8, COLORS.skin);
        at(x0 + 1, feet - 8, COLORS.eye);
        for (x = x0 - 2; x <= x0 + 2; x++) {
            at(x, feet - 11, COLORS.hat);
            at(x, feet - 10, COLORS.hat);
        }
        at(x0 - 2, feet - 9, COLORS.hat);
        at(x0 - 1, feet - 10, COLORS.hatBand);
        at(x0, feet - 10, COLORS.hatBand);
        at(x0 + 1, feet - 10, COLORS.hatBand);
        at(x0 + 3, feet - 6, COLORS.skin);
    }

    function drawFishermanSitting() {
        var sx = PIER_EDGE;
        var legX = sx + 1;
        var x, y;
        for (y = DECK + 1; y <= DECK + 4; y++) {
            at(legX, y, COLORS.pants);
            at(legX + 1, y, COLORS.pants);
        }
        at(legX, DECK + 5, COLORS.boot);
        at(legX + 1, DECK + 5, COLORS.boot);
        for (y = 5; y <= DECK; y++) {
            for (x = sx; x <= sx + 2; x++) at(x, y, COLORS.shirt);
        }
        at(sx, 3, COLORS.skin);
        at(sx + 1, 3, COLORS.skin);
        at(sx + 2, 3, COLORS.skin);
        at(sx, 4, COLORS.skin);
        at(sx + 1, 4, COLORS.skin);
        at(sx + 2, 4, COLORS.eye);
        at(sx - 1, 1, COLORS.hat);
        at(sx, 1, COLORS.hat);
        at(sx + 1, 1, COLORS.hat);
        at(sx + 2, 1, COLORS.hat);
        at(sx + 3, 1, COLORS.hat);
        at(sx - 1, 2, COLORS.hat);
        at(sx, 2, COLORS.hat);
        at(sx + 1, 2, COLORS.hat);
        at(sx + 2, 2, COLORS.hat);
        at(sx + 3, 2, COLORS.hat);
        at(sx, 2, COLORS.hatBand);
        at(sx + 1, 2, COLORS.hatBand);
        at(sx + 2, 2, COLORS.hatBand);
    }

    function drawFish(fx, fy) {
        for (var y = 0; y < FISH.length; y++) {
            var row = FISH[y];
            for (var x = 0; x < row.length; x++) {
                var c = row[x];
                if (c !== '.') at(fx + x, fy + y, c === 'f' ? COLORS.fishLight : COLORS.fish);
            }
        }
    }

    function drawGear(t) {
        var handX = 7;
        var handY = 5;
        if (phase === 'fishing') {
            var cast = Math.min(1, (t - phaseStart) / 500);
            var tipX = 11 + Math.round(cast * 2);
            var tipY = 6 - Math.round(cast * 3);
            drawLine(handX, handY, tipX, tipY, COLORS.rod);
            var bobY;
            if (cast < 1) {
                bobY = 6 + Math.round(cast * 7);
            } else {
                bobY = 13 + (Math.floor(t / 1100) % 2);
            }
            drawLine(tipX, tipY, 13, bobY - 1, COLORS.line);
            at(13, bobY, COLORS.bobberTop);
            at(13, bobY + 1, COLORS.bobber);
            at(14, bobY, COLORS.bobber);
            if (cast >= 1 && bobY === 14) {
                at(12, 14, COLORS.waterLight);
                at(13, 14, COLORS.waterLight);
            }
        } else if (phase === 'idle') {
            drawLine(handX, handY, 11, 6, COLORS.rod);
            at(11, 7, COLORS.line);
            at(11, 8, COLORS.line);
        } else if (phase === 'caught') {
            var t0 = t - phaseStart;
            drawLine(handX, handY, 13, 3, COLORS.rod);
            if (t0 < 450 && Math.floor(t0 / 120) % 2 === 0) {
                at(12, 12, COLORS.waterLight);
                at(13, 13, COLORS.waterLight);
                at(14, 14, COLORS.waterLight);
            }
            var prog = Math.min(1, t0 / 900);
            var fx = 12 - Math.round(prog * 3);
            var fy = 12 - Math.round(prog * 4);
            if (t0 >= 900) {
                fy = 8 + (Math.floor(t0 / 300) % 2);
            }
            drawLine(13, 3, fx + 2, fy - 1, COLORS.line);
            drawFish(fx, fy);
        }
    }

    function frame(t) {
        drawBackground(t);
        if (phase === 'relaxing') {
            drawFishermanSitting();
        } else {
            drawFishermanStanding();
        }
        if (phase !== 'relaxing') {
            drawGear(t);
        }
        rafId = requestAnimationFrame(frame);
    }

    function init(canvasEl) {
        canvas = canvasEl;
        ctx = canvas && canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = W * CELL;
        canvas.height = H * CELL;
        phase = 'idle';
        phaseStart = performance.now();
        if (!rafId) rafId = requestAnimationFrame(frame);
    }

    function setPhase(p) {
        phase = p;
        phaseStart = performance.now();
    }

    window.PixelVisual = {
        init: init,
        setPhase: setPhase
    };
})();