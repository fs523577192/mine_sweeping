const Box = function (x, y, number) {
    this.x = x;
    this.y = y;
    this.mines = (number & 0x1F);
    this.isEmpty = (this.mines === 0);
    this.isMine = (this.mines === 29);
    this.isFlag = (this.mines === 30);
    this.isOpen = !this.isMine && !this.isFlag && (number & 0x20) !== 0;
    this.mineCount = 0;
    this.notOpenCount = 8;
}
Box.prototype.getDisplay = function () {
	if (this.isMine || this.isFlag) {
		return 'X';
	}
	return this.isEmpty ? ' ' : this.mines;
};
module.exports = Box;