const MIDDLE = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];
const LEFT = [
    [-1, 0], [-1, 1],
             [0, 1],
    [1, 0],  [1, 1]
];
const RIGHT = [
    [-1, -1], [-1, 0],
    [0, -1],
    [1, -1], [1, 0]
];
const TOP = [
    [0, -1],         [0, 1],
    [1, -1], [1, 0], [1, 1]
];
const BOTTOM = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1]
];
const TOP_LEFT = [
            [0, 1],
    [1, 0], [1, 1]
];
const TOP_RIGHT = [
    [0, -1],
    [1, -1], [1, 0]
];
const BOTTOM_LEFT = [
    [-1, 0], [-1, 1],
             [0, 1]
];
const BOTTOM_RIGHT = [
    [-1, -1], [-1, 0],
    [0, -1]
];

const Map = function (width, height) {
    if (Math.floor(width) !== width ||
            Math.floor(height) !== height ||
            width < 1 || height < 1) {
        throw new Error('Both the width and the height must be positive integers');
    }

    const map = [];
    for (let i = 0; i < height; i += 1) {
        const row = [];
        for (let j = 0; j < width; j += 1) {
            row.push(new Box(j, i, 0));
        }
        map.push(row);
    }
    this.getMap = function () {
        return map;
    };
    this.getWidth = function () {
        return width;
    };
    this.getHeight = function () {
        return height;
    };

    this.setBox = function (x, y, number, calculate) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
            throw new Error('Invalid coordinate');
        }

        const box = new Box(x, y, number);
        if (calculate) {
            if (box.isMineOrFlag()) {
                this.increaseMineCount(y, x);
                this.decreaseNotOpenCount(y, x);
            } else if (box.isOpen()) {
                this.decreaseNotOpenCount(y, x);
            }
        }
        map[y][x] = box;
    };
    this.getBox = function (x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) {
            throw new Error('Invalid coordinate');
        }

        return map[y][x];
    };

    this.debugMap = function () {
        for (let i = 0; i < height; i += 1) {
            let temp = '';
            for (let j = 0; j < width; j += 1) {
                temp = temp + map[i][j].getDisplay();
            }
            console.log(temp);
        }
    };

    function getNeighbor(i, j) {
        if (i <= 0) {
            if (j <= 0) {
                return TOP_LEFT;
            }
            if (j >= width) {
                return TOP_RIGHT;
            }
            return TOP;
        }
        if (i >= height) {
            if (j <= 0) {
                return BOTTOM_LEFT;
            }
            if (j >= width) {
                return BOTTOM_RIGHT;
            }
            return BOTTOM;
        }
        if (j <= 0) {
            return LEFT;
        }
        if (j >= width) {
            return RIGHT;
        }
        return MIDDLE;
    }

    this.increaseMineCount = function (i, j) {
        for (let coordinate of getNeighbor(i, j)) {
                let y = i + coordinate[0];
                let x = j + coordinate[1];
                map[y][x].increaseMineCount();
            }
        }
    };

    this.decreaseNotOpenCount = function (i, j) {
        for (let coordinate of getNeighbor(i, j)) {
                let y = i + coordinate[0];
                let x = j + coordinate[1];
                map[y][x].increaseOpenCount();
            }
        }
    };

    this.calculate = function () {
        for (let i = 0; i < height; i += 1) {
            for (let j = 0; j < width; j += 1) {
                map[i][j].resetCount();
            }
        }
        for (let i = 0; i < height; i += 1) {
            for (let j = 0; j < width; j += 1) {
                let box = map[i][j];
                if (box.isMineOrFlag()) {
                    this.increaseMineCount(i, j);
                    this.decreaseNotOpenCount(i, j);
                } else if (box.isOpen()) {
                    this.decreaseNotOpenCount(i, j);
                }
            }
        }
    };

}

module.exports = Map;
