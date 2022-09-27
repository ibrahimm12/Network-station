
var p = [
    [0, 0],
    [100, 100],
    [15, 10],
    [18, 18]
];




function findS(x) {
    var stations = [
        {xy: [0, 0], reach: 10, pwr: 0},
        {xy: [20, 20], reach: 5, pwr: 0},
        {xy: [10, 0], reach: 12, pwr: 0}
    ];

    var bestStation = stations.map(function (network) {
        network.pwr = getpwr(
            getDistance(x, network.xy),
            network.reach
        );
        return network;
    }).filter(function (network) {
        return network.pwr > 0;
    }).sort(function (stationA, stationB) {
        return stationA.pwr > stationB.pwr;
    }).pop();

    return {
        x: x,
        network: bestStation
    };
}




function getpwr(distance, reach) {
    return (distance > reach)
        ? 0
        : Math.pow((reach - distance), 2);
}

function getDistance(x1, y1) {
    return Math.sqrt(
        Math.pow(Math.abs(x1[0] - y1[0]), 2)
        + Math.pow(Math.abs(x1[1] - y1[1]), 2)
    );
}

p.map(findS).map(function (value) {
    if (!value.network) {
        console.log("x [", value.x[0], ',', value.x[1], "]: Not reachable")
    } else {
        console.log(
            "x [", value.x[0], ',', value.x[1], "]: Best station  [",
            value.network.xy[0], ',', value.network.xy[1], "] pwr: ", value.network.pwr.toFixed(2)
        );
    }
});