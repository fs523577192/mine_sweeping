const WebSocket = require('ws');
const Box = require('./Box');

const userIds = [
    '16d2f550-433c-4a5c-9cf4-577b280cac51',
    '44b3e047-8672-43d0-8dfa-86ead8c9abb1'
];
const cookies = [
    '__cfduid=dc8563b82e0160e517fe84d9047dab39c1498619079;' +
    'connect.sid=s%3ACgYe4E2V7QpQTK3hgs59U8y7We_Tfase.LmzMrjH7F0ULXWD2cz8dfDu7UXWdyzd%2F19Xlmc2dOuw;' +
    '__utmt=1; __utma=45149496.1357259984.1498619082.1504084404.1504141723.30;' +
    '__utmb=45149496.1.10.1504141723; __utmc=45149496;' +
    '__utmz=45149496.1498619082.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none);' +
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
let width = 40, height = 40;
let w0 = 20; // The width of the first area;
let h0 = 20; // The height of the first area;
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
    // w0 = sizes[0][0][0];
    // h0 = sizes[0][0][1];
    // width = w0 + sizes[0][1][0];
    // height = h0 + sizes[1][0][1];
    // console.log('width: ' + width + ', height: ' + height);
    // console.log('w0: ' + w0 + ', h0: ' + h0);
    
    for (let i = 0; i < height; i += 1) {
        const row = [];
        for (let j = 0; j < width; j += 1) {
            row.push(new Box(j, i, 0));
        }
        map.push(row);
    }
    for (let item of sizes[0][0][2]) {
        let x = item[0];
        let y = item[1];
        map[y][x] = new Box(x, y, item[2]);
    }
    for (let item of sizes[0][1][2]) {
        let x = item[0] + w0;
        let y = item[1];
        map[y][x] = new Box(x, y, item[2]);
    }
    for (let item of sizes[1][0][2]) {
        let x = item[0];
        let y = item[1] + h0;
        map[y][x] = new Box(x, y, item[2]);
    }
	for (let item of sizes[1][1][2]) {
        let x = item[0] + w0;
        let y = item[1] + h0;
        map[y][x] = new Box(x, y, item[2]);
    }
}

function increaseMineCount(i, j) {
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < height; y += 1) {
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < width; x += 1) {
            map[y][x].mineCount += 1;
        }
    }
    map[i][j].mineCount -= 1; // restore the value of self
}

function decreaseNotOpenCount(i, j) {
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < height; y += 1) {
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < width; x += 1) {
            map[y][x].notOpenCount -= 1;
        }
    }
    map[i][j].notOpenCount += 1; // restore the value of self
}

function calculate() {
    for (let i = 0; i < height; i += 1) {
        for (let j = 0; j < width; j += 1) {
            let box = map[i][j];
            box.mineCount = 0;
            box.notOpenCount = 8;
        }
    }
    for (let i = 0; i < height; i += 1) {
        for (let j = 0; j < width; j += 1) {
            let box = map[i][j];
            if (box.isMine || box.isFlag) {
                increaseMineCount(i, j, map);
                decreaseNotOpenCount(i, j, map);
            } else if (box.isOpen) {
                decreaseNotOpenCount(i, j, map);
            }
        }
    }
}

function drawMap(data) {
    console.log('tiles received');
    let tiles = data.d.tiles;
    if (!Array.isArray(tiles)) {
        console.log(data.d);
        return;
    }
    let tile = [];
    for (let item of tiles) {
        let x0 = item[0];
        let y0 = item[1];
        let tile = item[2];
        if (!Array.isArray(tile) || !tile.length ||
                x0 - tx >= 4 || y0 - ty >= 3) {
            continue;
        }
        
        let w = tile[0][0] + 1;
        let h = tile[0][1] + 1;
        sizes[y0 - ty][x0 - tx] = [w, h, tile];
    }
    initializeMap();
    calculate();
	console.log(map[7][22]);
}

function findFlag() {
    let result = [];
    let maxCount = 0;
    for (let i = 1; i < height - 1; i += 1) {
        for (let j = 1; j < width - 1; j += 1) {
            let box = map[i][j];
            if (box.isOpen && box.notOpenCount + box.mineCount === box.mines) {
                if (box.notOpenCount > maxCount) {
                    result = [j, i];
                    maxCount = box.notOpenCount;
                }
            }
        }
    }
    return result;
}

function findOpen() {
    let result = [];
    let maxCount = 0;
    for (let i = 1; i < height - 1; i += 1) {
        for (let j = 1; j < width - 1; j += 1) {
            let box = map[i][j];
            if (box.isOpen && !box.isEmpty &&
                    box.mineCount === box.mines &&
                    box.notOpenCount > maxCount) {
                result = [j, i];
                maxCount = box.notOpenCount;
            }
        }
    }
    return result;
}

function boxMessage(temp) {
    const message = messageBase();
    message.d.field_id = 'main';
    message.d.tx = tx;
    message.d.ty = ty;
    message.d.cx = temp[0];
    message.d.cy = temp[1];
    if (temp[0] >= w0) {
        message.d.tx += 1;
        message.d.cx -= w0;
    }
    if (temp[1] >= h0) {
        message.d.ty += 1;
        message.d.cy -= h0;
    }
    return message;
}

function afterFlag(j, i) {
    // console.log('flagging: ');
    // console.log(map[i][j]);
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < height; y += 1) {
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < width; x += 1) {
            if (!map[y][x].isOpen) {
                map[y][x].isFlag = true;
                increaseMineCount(y, x);
                decreaseNotOpenCount(y, x);
            }
        }
    }
}

function flag() {
    const temp = findFlag();
    if (!temp.length) return temp;
    console.log('flag: ' + temp[0] + ', ' + temp[1]);
    
    const message = boxMessage(temp);
    message.e = 'flag';
    console.log(message);
    toDo = function (data) {
        afterFlag(temp[0], temp[1]);
        initToDo(data);
    };
    ws.send(JSON.stringify(message));
    return temp;
}

function open() {
    const temp = findOpen();
    if (!temp.length) return temp;
    console.log('open: ' + temp[0] + ', ' + temp[1]);
    console.log(map[temp[1]][temp[0]]);
    
    const message = boxMessage(temp);
    message.e = 'open';
    console.log(message);
    toDo = initToDo;
    ws.send(JSON.stringify(message));
    return temp;
}

function play() {
    let result = flag();
    if (!result.length) {
        result = open();
        if (!result.length) {
            console.log('end');
			ws.close();
        }
    }
}

function updateBoxes(x0, y0, list) {
    if (!Array.isArray(list) || !list.length) return;
    console.log('updateBoxes: ' + x0 + ', ' + y0);
    for (let item of list) {
        let box = new Box(x0 + item[0], y0 + item[1], item[2]);
        map[box.y][box.x] = box;
    }
    calculate();
}

function updateMap(data) {
    if (!Array.isArray(data.d.tiles) || data.d.error) {
        console.log(data.d);
        return false;
    }
    for (let item of data.d.tiles) {
        if (item[0] === tx && item[1] === ty) {
            updateBoxes(0, 0, item[2]);
        } else if (item[0] === tx + 1 && item[1] === ty) {
            updateBoxes(w0, 0, item[2]);
        } else if (item[0] === tx && item[1] === ty + 1) {
            updateBoxes(0, h0, item[2]);
        } else if (item[0] === tx + 1 && item[1] === ty + 1) {
            updateBoxes(w0, h0, item[2]);
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
