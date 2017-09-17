
const increaseMineCount = function (map, i, j) {
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < map.length; y += 1) {
        const row = map[y];
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < row.length; x += 1) {
            row[x].mineCount += 1;
        }
    }
    map[i][j].mineCount -= 1; // restore the value of self
};
exports.increaseMineCount = increaseMineCount;

const decreaseNotOpenCount = function (map, i, j) {
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < map.length; y += 1) {
        const row = map[y];
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < row.length; x += 1) {
            row[x].notOpenCount -= 1;
        }
    }
    map[i][j].notOpenCount += 1; // restore the value of self
};
exports.decreaseNotOpenCount = decreaseNotOpenCount;

const calculate = function (map, width) {
    const height = map.length;
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
                increaseMineCount(map, i, j);
                decreaseNotOpenCount(map, i, j);
            } else if (box.isOpen) {
                decreaseNotOpenCount(map, i, j);
            }
        }
    }
};
exports.calculate = calculate;

const flagBox = function (map, y, x) {
    map[y][x].isFlag = true;
    increaseMineCount(map, y, x);
    decreaseNotOpenCount(map, y, x);
}
exports.flagBox = flagBox;

const afterFlag = function (map, j, i) {
    // console.log('flagging: ');
    // console.log(map[i][j]);
    const height = map.length;
    for (let y = (i <= 0 ? 0 : i - 1); y <= i + 1 && y < height; y += 1) {
        const width = map[y].length;
        for (let x = (j <= 0 ? 0 : j - 1); x <= j + 1 && x < width; x += 1) {
            if (!map[y][x].isOpen) {
                flagBox(map, y, x);
            }
        }
    }
}
exports.afterFlag = afterFlag;

const findFlag = function (map, width) {
    const height = map.length;
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
exports.findFlag = findFlag;

const findOpen = function (map, width) {
    const height = map.length;
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
exports.findOpen = findOpen;

