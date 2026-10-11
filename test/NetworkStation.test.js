'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    DEVICE_POINTS,
    STATIONS,
    calculateDistance,
    calculateSpeed,
    findBestStation,
    formatResult,
} = require('../NetworkStation');

test('contains all assignment stations and device coordinates', () => {
    assert.equal(STATIONS.length, 5);
    assert.equal(DEVICE_POINTS.length, 6);
});

test('calculates Euclidean distance', () => {
    assert.equal(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('calculates speed inside reach and zero at or outside reach', () => {
    assert.equal(calculateSpeed(2, 5), 9);
    assert.equal(calculateSpeed(5, 5), 0);
    assert.equal(calculateSpeed(6, 5), 0);
});

test('selects the highest-speed station for each supplied assignment point', () => {
    const cases = [
        { point: DEVICE_POINTS[0], station: { x: 0, y: 0 }, speed: 81 },
        { point: DEVICE_POINTS[1], station: null, speed: null },
        { point: DEVICE_POINTS[2], station: { x: 5, y: 5 }, speed: (13 - Math.hypot(10, 5)) ** 2 },
        { point: DEVICE_POINTS[3], station: { x: 20, y: 20 }, speed: (6 - Math.sqrt(8)) ** 2 },
        { point: DEVICE_POINTS[4], station: { x: 5, y: 5 }, speed: (13 - Math.sqrt(128)) ** 2 },
        { point: DEVICE_POINTS[5], station: null, speed: null },
    ];

    for (const { point, station, speed } of cases) {
        const result = findBestStation(point);
        if (station === null) {
            assert.equal(result, null, `point ${point.x},${point.y} should have no station`);
            continue;
        }

        assert.deepEqual({ x: result.station.x, y: result.station.y }, station);
        assert.ok(Math.abs(result.speed - speed) < 1e-10);
    }
});

test('returns no station if all candidates are out of range', () => {
    assert.equal(findBestStation({ x: 100, y: 100 }), null);
});

test('only considers positive speed, including a station exactly at its reach', () => {
    const stations = [{ x: 0, y: 0, reach: 5 }];
    assert.equal(findBestStation({ x: 3, y: 4 }, stations), null);
});

test('uses the first station in a tie', () => {
    const stations = [
        { x: -1, y: 0, reach: 5 },
        { x: 1, y: 0, reach: 5 },
    ];
    assert.equal(findBestStation({ x: 0, y: 0 }, stations).station, stations[0]);
});

test('formats both assignment output cases', () => {
    const point = { x: 100, y: 100 };
    assert.equal(
        formatResult(point, null),
        'No network station within reach for point 100,100',
    );
    assert.equal(
        formatResult({ x: 0, y: 0 }, findBestStation({ x: 0, y: 0 })),
        'Best network station for point 0,0 is 0,0 with speed 81.00',
    );
});

test('rejects malformed points and stations', () => {
    assert.throws(() => calculateDistance({ x: NaN, y: 0 }, { x: 0, y: 0 }), TypeError);
    assert.throws(() => findBestStation({ x: 0, y: 0 }, [{ x: 0, y: 0, reach: -1 }]), TypeError);
    assert.throws(() => findBestStation({ x: 0 }), TypeError);
});
