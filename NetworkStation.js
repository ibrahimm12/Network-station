'use strict';

const STATIONS = Object.freeze([
    Object.freeze({ x: 0, y: 0, reach: 9 }),
    Object.freeze({ x: 20, y: 20, reach: 6 }),
    Object.freeze({ x: 10, y: 0, reach: 12 }),
    Object.freeze({ x: 5, y: 5, reach: 13 }),
    Object.freeze({ x: 99, y: 25, reach: 2 }),
]);

const DEVICE_POINTS = Object.freeze([
    Object.freeze({ x: 0, y: 0 }),
    Object.freeze({ x: 100, y: 100 }),
    Object.freeze({ x: 15, y: 10 }),
    Object.freeze({ x: 18, y: 18 }),
    Object.freeze({ x: 13, y: 13 }),
    Object.freeze({ x: 25, y: 99 }),
]);

function validatePoint(point, label = 'point') {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        throw new TypeError(`${label} must have finite numeric x and y coordinates.`);
    }
}

function validateStation(station) {
    validatePoint(station, 'station');
    if (!Number.isFinite(station.reach) || station.reach < 0) {
        throw new TypeError('station reach must be a finite, non-negative number.');
    }
}

function calculateDistance(point, station) {
    validatePoint(point);
    validatePoint(station, 'station');
    return Math.hypot(point.x - station.x, point.y - station.y);
}

function calculateSpeed(distance, reach) {
    if (!Number.isFinite(distance) || distance < 0) {
        throw new TypeError('distance must be a finite, non-negative number.');
    }
    if (!Number.isFinite(reach) || reach < 0) {
        throw new TypeError('reach must be a finite, non-negative number.');
    }
    if (distance >= reach) return 0;
    return (reach - distance) ** 2;
}

/**
 * Returns the highest positive-speed station, or null when no station serves the point.
 * Ties are resolved in favor of the first station in the supplied list.
 */
function findBestStation(point, stations = STATIONS) {
    validatePoint(point);
    if (!Array.isArray(stations)) {
        throw new TypeError('stations must be an array.');
    }

    let best = null;
    for (const station of stations) {
        validateStation(station);
        const distance = calculateDistance(point, station);
        const speed = calculateSpeed(distance, station.reach);
        if (speed > 0 && (!best || speed > best.speed)) {
            best = { station, distance, speed };
        }
    }
    return best;
}

function formatResult(point, result) {
    validatePoint(point);
    if (!result) {
        return `No network station within reach for point ${point.x},${point.y}`;
    }

    const { station, speed } = result;
    return `Best network station for point ${point.x},${point.y} is ${station.x},${station.y} with speed ${speed.toFixed(2)}`;
}

function main() {
    for (const point of DEVICE_POINTS) {
        console.log(formatResult(point, findBestStation(point)));
    }
}

const networkStation = {
    DEVICE_POINTS,
    STATIONS,
    calculateDistance,
    calculateSpeed,
    findBestStation,
    formatResult,
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = networkStation;
}

if (typeof window !== 'undefined') {
    window.NetworkStation = networkStation;
}

if (typeof require !== 'undefined' && require.main === module) {
    main();
}
