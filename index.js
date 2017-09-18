const WebSocket = require('ws');
const Box = require('./Box');
const Play = require('./Play');
const increaseMineCount = Play.increaseMineCount;
const decreaseNotOpenCount = Play.decreaseNotOpenCount;
const calculate = Play.calculate;
const flagBox = Play.flagBox;
const afterFlag = Play.afterFlag;
const findFlag = Play.findFlag;
const findOpen = Play.findOpen;

Array.prototype.isEmpty = function () {
    return this.length <= 0;
};

const userIds = [
    '918fe203-f88d-492d-a6d3-9117754c2c57',
    '44b3e047-8672-43d0-8dfa-86ead8c9abb1'
];
const cookies = [
    '__cfduid=d901a94bc27aef7671f7209460420a3b31505718141;' +
    'connect.sid=d901a94bc27aef7671f7209460420a3b31505718141;' +
    '__utmt=1; __utma=45149496.474683751.1505718145.1505718145.1505718145.1;' +
    '__utmb=45149496.19.9.1505718685055; __utmc=45149496;' +
    '__utmz=45149496.1505718145.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);' +
    'user_id=' + userIds[0],

    '__cfduid=d1a011679a15c5286965b39b60532d8221503326927;' +
    'connect.sid=s%3AWf1Erq1nY8xQJGtgWEoEJYy0LAtkVAic.w3x3prq9f3dm9q6ZzIxzTKaxboP%2FEwt%2ByP79O1YiCvA;' +
    '__utma=45149496.1735893319.1477747195.1503496865.1504341677.4;' +
    '__utmb=45149496.76.9.1504346428885; __utmc=45149496;' +
    '__utmz=45149496.1503326969.2.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);' +
    'user_id=' + userIds[1]
];
let tx = 0, ty = 0, profileNumber = 0;
if (process.argv.length != 5) {
    console.log('Please input the coordinate');
    return;
}
profileNumber = Number(process.argv[2]);
if (0 !== profileNumber && 1 !== profileNumber) {
    console.log('Invalid index of profile');
    return;
}
tx = Number(process.argv[3]);
ty = Number(process.argv[4]);
if (Number.isNaN(tx) || Number.isNaN(ty)) {
    console.log('Invalid coordinate');
    return;
}

const ws = new WebSocket('wss://mienfield.com/io', {
    origin: 'https://mienfield.com',
    headers: {
        cookie: cookies[profileNumber],
    }
});

let c = 0; // message count
const w0 = 20, h0 = 20; // The size of one block;
const width = 80, height = 60; // 4 x 3
const sizes = [[], [], []];
const map = [];
const initToDo = function (data) {
    if (updateMap(data)) {
        play();
    }
}
let toDo = initToDo;

function timestamp() {
    return (new Date()).getTime();
}
function messageBase() {
    c += 1;
    return {
        c,
        d: {
            time: timestamp(),
            user_id: userIds[profileNumber]
        }
    };
}

function debugMap() {
    for (let i = 0; i < 40; i += 1) {
        let temp = '';
        for (let j = 0; j < 40; j += 1) {
            temp = temp + map[i][j].getDisplay();
        }
        console.log(temp);
    }
}

function getTiles() {
    let message = messageBase();
    message.e = 'tiles';
    message.d.field_id = 'main';
    message.d.user_coord_tx = tx;
    message.d.user_coord_ty = ty;
    message.d.tiles = [];
    for (let i = tx; i <= tx + 4; ++i) {
        for (let j = ty; j <= ty + 3; ++j) {
            message.d.tiles.push([i, j]);
        }
    }
    ws.send(JSON.stringify(message));
    console.log('tiles requested');
}

function initializeMap() {
    for (let i = 0; i < height; i += 1) {
        const row = [];
        for (let j = 0; j < width; j += 1) {
            row.push(new Box(j, i, 0));
        }
        map.push(row);
    }
}

function drawMap(data) {
    console.log('tiles received');
    let tiles = data.d.tiles;
    if (!Array.isArray(tiles)) {
        console.log(data.d);
        return;
    }

    initializeMap();
    for (let item of tiles) {
        let dx = item[0] - tx;
        let dy = item[1] - ty;
        let tile = item[2];
        if (!Array.isArray(tile) || tile.isEmpty() ||
                dx >= 4 || dy >= 3) {
            continue;
        }
        
        dx *= w0;
        dy *= h0;
        for (let item of tile) {
            let x = dx + item[0];
            let y = dy + item[1];
            map[y][x] = new Box(x, y, item[2]);
        }
    }
    calculate(map, width, height);
}

function boxMessage(temp) {
    const message = messageBase();
    message.d.field_id = 'main';
    message.d.tx = tx + Math.floor(temp[0] / w0);
    message.d.ty = ty + Math.floor(temp[1] / h0);
    message.d.cx = temp[0] % w0;
    message.d.cy = temp[1] % h0;
    return message;
}

function flag() {
    const temp = findFlag(map, width);
    if (temp.isEmpty()) return temp;
    console.log('flag: ' + temp[0] + ', ' + temp[1]);
    
    const message = boxMessage(temp);
    message.e = 'flag';
    console.log(message);
    toDo = function (data) {
        afterFlag(map, temp[0], temp[1]);
        initToDo(data);
    };
    ws.send(JSON.stringify(message));
    return temp;
}

function open() {
    const temp = findOpen(map, width);
    if (temp.isEmpty()) return temp;
    console.log('open: ' + temp[0] + ', ' + temp[1]);
    console.log(map[temp[1]][temp[0]]);
    
    const message = boxMessage(temp);
    message.e = 'open';
    console.log(message);
    toDo = initToDo;
    ws.send(JSON.stringify(message));
    return temp;
}

function afterOpen(theMap, y, x, info) {
    for (let i = Math.max(y - 1, 1); i <= Math.min(y + 1, height - 2); i += 1) {
        for (let j = Math.max(x - 1, 1); j <= Math.min(x + 1, width - 2); j += 1) {
            const box = theMap[i][j];
            if (!box.isFlag && !box.isMine && !box.isOpen) {
                info.open['_' + i + '_' + j] = true;
            }
        }
    }
}

function afterTryFlag(theMap, y, x, info) {
    for (let i = Math.max(y - 1, 1); i <= Math.min(y + 1, height - 2); i += 1) {
        for (let j = Math.max(x - 1, 1); j <= Math.min(x + 1, width - 2); j += 1) {
            const box = theMap[i][j];
            if (box.isOpen && !box.isEmpty) {
                if (box.mineCount > box.mines) return null;
                if (box.mineCount === box.mines) {
                    afterOpen(theMap, i, j, info);
                }
            }
        }
    }
    return info;
}

function tryFlag(y, x, r, c) {
    const info = {open: {}, flag: {}};
    let tryMap = JSON.parse(JSON.stringify(map));
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, height - 1); i += 1) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, width - 1); j += 1) {
            const box = tryMap[i][j];
            if (!box.isFlag && !box.isMine && !box.isOpen &&
                    (i != r || j != c)) {
                info.flag['_' + i + '_' + j] = true;
                flagBox(tryMap, i, j);
                const result = afterTryFlag(tryMap, y, x, info);
                if (null === result) return null;
            }
        }
    }
    return info;
}

function getCoordinateFromKey(key) {
    const temp = key.substring(1).split('_');
    return [parseInt(temp[1]), parseInt(temp[0])];
}

function flagInTry(info, listLength) {
    const toFlag = [];
    for (let key in info) {
        if (info[key] >= listLength) {
            const temp = getCoordinateFromKey(key);
            toFlag.push(temp);
            const message = boxMessage(temp);
            message.e = 'flag';
            console.log(message);
            ws.send(JSON.stringify(message));

            toDo = function (data) {
                flagBox(map, temp[1], temp[0]);
                initToDo(data);
            };
            return true;
        }
    }
    /*
    toDo = function (data) {
        for (let item of toFlag) {
            flagBox(map, item[1], item[0]);
        }
        initToDo(data);
    }
    return !toFlag.isEmpty();
    */
    return false;
}

function openInTry(info, listLength) {
    let result = false;
    for (let key in info) {
        if (info[key] >= listLength) {
            const message = boxMessage(getCoordinateFromKey(key));
            message.e = 'open';
            console.log(message);
            ws.send(JSON.stringify(message));
            return result = true;
        }
    }
    return result;
}

function tryOpen(y, x) {
    console.log('tryOpen: ' + y + ', ' + x);
    const toOpen = [];
    for (let i = Math.max(y - 1, 0); i <= Math.min(y + 1, height - 1); i += 1) {
        for (let j = Math.max(x - 1, 0); j <= Math.min(x + 1, width - 1); j += 1) {
            const box = map[i][j];
            if (!box.isFlag && !box.isMine && !box.isOpen) {
                toOpen.push([i, j]);
            }
        }
    }
    if (toOpen.isEmpty()) return false;
    console.log('toOpen: ');
    console.log(toOpen);

    const list = [];
    for (let item of toOpen) {
        const result = tryFlag(y, x, item[0], item[1]);
        if (result) {
            list.push(result);
        }
    }
    const info = {open: {}, flag: {}};
    for (let item of list) {
        for (let key in item.open) {
            if (typeof(info.open[key]) !== 'number') {
                info.open[key] = 1;
            } else {
                info.open[key] += 1;
            }
        }
        for (let key in item.flag) {
            if (typeof(info.flag[key]) !== 'number') {
                info.flag[key] = 1;
            } else {
                info.flag[key] += 1;
            }
        }
    }
    const result = flagInTry(info.flag, list.length);
    return result || openInTry(info.open, list.length);
    //return openInTry(info.open, list.length) || result;
}

function play() {
    let result = flag(map);
    if (result.isEmpty()) {
        result = open(map);
        if (result.isEmpty()) {
            let changed = false;
            for (let i = 1; i < height - 1; i += 1) {
                for (let j = 1; j < width - 1; j += 1) {
                    const box = map[i][j];
                    if (box.isOpen &&
                            box.notOpenCount - box.mineCount == 1) {
                        changed = changed || tryOpen(i, j);
                        //changed = tryOpen(i, j) || changed;
                    }
                }
            }
            if (!changed) {
                console.log('end');
                ws.close();
            }
        }
    }
}

function updateBoxes(x0, y0, list) {
    if (!Array.isArray(list) || list.isEmpty()) return;
    console.log('updateBoxes: ' + x0 + ', ' + y0);
    for (let item of list) {
        let box = new Box(x0 + item[0], y0 + item[1], item[2]);
        map[box.y][box.x] = box;
    }
    calculate(map, width, height);
}

function updateMap(data) {
    if (!Array.isArray(data.d.tiles) || data.d.error) {
        console.log(data.d);
        return false;
    }
    for (let item of data.d.tiles) {
        let dx = item[0] - tx;
        let dy = item[1] - ty;
        if (dx >= 0 && dx < 4 && dy >= 0 && dy < 3) {
            updateBoxes(dx * w0, dy * h0, item[2]);
        }
    }
    return true;
}

ws.on('open', function open() {
    console.log('connected');
    let message = messageBase();
    message.e = 'connect';
    ws.send(JSON.stringify(message));
});

ws.on('close', function close() {
    console.log('disconnected');
});

ws.on('message', function incoming(data) {
    if (1 === c) {
        getTiles();
    } else if (2 === c) {
        drawMap(JSON.parse(data));
        play();
    } else {
        data = JSON.parse(data);
        if ('tiles' === data.e) {
            updateMap({
                d: {
                    tiles: data.d
                }
            });
        } else if ('cursor' !== data.e) {
            toDo(data);
        }
    }
});

ws.on('error', function () {
    console.log('Fail to connect to the server');
});
