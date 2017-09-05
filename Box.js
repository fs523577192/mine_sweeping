const Box = function (x, y, number) {
    if (Math.floor(x) !== x ||
            Math.floor(y) !== y ||
            x < 0 || y < 0) {
        throw new Error('Invalid coordinate in the map');
    }
    const mines = (number & 0x1F);
    const isMine = (mines === 29);
    const isFlag = (mines === 30);
    let mineCount = 0;
    let notOpenCount = 8;

    this.getX = function () {
        return x;
    };
    this.getY = function () {
        return y;
    };
    this.isMine = function () {
        return isMine;
    };
    this.isFlag = function () {
        return isFlag;
    };
    this.isMineOrFlag = function () {
        return isMine || isFlag;
    };
    this.notMineOrFlag = function () {
        return !isMine && !isFlag;
    };

    const isEmpty = this.notMineOrFlag() && (mines === 0);
    const isOpen = this.notMineOrFlag() && (number & 0x20) !== 0;
    this.isEmpty = function () {
        return isEmpty;
    };
    this.isOpen = function () {
        return isOpen;
    };

    this.getDisplay = function () {
        if (this.isMine || this.isFlag) {
            return 'X';
        }
        return this.isEmpty ? ' ' : this.mines;
    };

    this.resetCount = function () {
        mineCount = 0;
        notOpenCount = 8;
    };
    this.increaseMineCount = function () {
        if (mineCount >= 8) {
            throw new Error('The number of mines exceeds 8');
        }
        mineCount += 1;
    };
    this.getMineCount = function () {
        return mineCount;
    };

    this.increaseOpenCount = function () {
        if (notOpenCount <= 0) {
            throw new Error('The number of open neighbors exceeds 8');
        }
        notOpenCount -= 1;
    };
    this.getNotOpenCount = function () {
        return notOpenCount;
    };

    this.hasUnknownNeighbors = function () {
        return notOpenCount > mineCount;
    };
    this.noUnknownMine = function () {
        return mines === mineCount;
    };
}
module.exports = Box;
