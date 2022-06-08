export class gridUtils {
  static printOperationLog(desc, num) {
    gridScaler.printLog(`The grid ${desc} was set to ${num}.`);
  }

  static printLog(message) {
    console.log(`Grid Scale | ${message}`);
  }

  static async getGridSizeByCount(gridSize) {
    if (!gridSize) {
      return 0;
    }

    const dimensions = canvas.dimensions;
    const gridType = canvas.scene.data.gridType;
    let size = 0;

    switch (gridType) {
      // If this is a square grid, or a hex grid with rows, assume the number is the horizontal cell count.
      case 1:
      case 2:
      case 3:
        size = dimensions.sceneWidth / gridSize;
        break;
      // If this is a hex grid with columns, assume the number is the vertical cell count.
      case 4:
      case 5:
        size = dimensions.sceneHeight / gridSize;
        break;
    }

    return size;
  }

  static findTheBest(p1, p2, p, gridSize) {
    let arry = null;
    const abs1 = p1 - p;
    const abs2 = p2 - p;

    if (Math.abs(abs1) < Math.abs(abs2)) {
      console.log("Grid Scale | Drawing Layer | ^^^^^ ChoseABS1 ^^^^^");
      if (p1 < p) {
        arry = [Math.abs(abs1), -Math.abs(gridSize / 2)]
        return arry;
      }
      else {
        arry = [-Math.abs(abs1), -Math.abs(gridSize / 2)]
        return arry;
      }
    }
    else {
      if (p2 < p) {
        arry = [Math.abs(abs2), Math.abs(gridSize / 2)]
        return arry;
      }
      else {
        arry = [-Math.abs(abs2), Math.abs(gridSize / 2)]
        return arry;
      }
    }
  }

  static findTheBestSide(p1, p2, p3, cP) {
    if (cP < p1 + 5 && cP > p1 - 5) {
      return p1
    }
    else if (cP < p2 + 5 && cP > p2 - 5) {
      return p2
    }
    else {
      return p3
    }
  }
}