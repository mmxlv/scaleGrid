export class gridUtils {
  // LOG UTILS
  ////////////////////////////////////////////////////
  static logOperation(desc, num) {
    gridScaler.printLog(`The grid ${desc} was set to ${num}.`);
  }

  static log(message) {
    console.log(`Grid Scale | ${message}`);
  }

  // CANVAS UTILS
  ////////////////////////////////////////////////////
  static getMousePos(evt) {
    let result = null;

    if (evt) {
      result = evt.data.getLocalPosition(canvas.app.stage)
    } else {
      let mouse = canvas.app.renderer.plugins.interaction.mouse;
      result = mouse.getLocalPosition(canvas.app.stage);
    }

    return result;
  }

  // GRID UTILS
  ////////////////////////////////////////////////////
  static async getGridSizeByCount(gridCount) {
    if (!gridCount) {
      return 0;
    }

    const dimensions = canvas.dimensions;
    const gridType = canvas.scene.data.gridType;
    let size = 0;

    switch (gridType) {
      // If this is a square grid, or a hex grid with rows, assume the number is the horizontal cell count.
      case 1:
        size = dimensions.sceneWidth / gridCount;
      case 2:
      case 3:
        // Find the width of the hex by dividing the number of hexes into the width of the scene.
        // The final size is the height of the hex. Get the height by multiplying the width by 1.15471.
        size = dimensions.sceneWidth / gridCount * 1.15471;
        break;
      // If this is a hex grid with columns, assume the number is the vertical cell count.
      case 4:
      case 5:
        // Find the height of the hex by dividing the number of hexes into the height of the scene.
        // The final size is the width of the hex. Get the width by multiplying the height by 1.15471.
        size = dimensions.sceneHeight / gridCount * 1.15471;
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

  // SCENE UTILS
  ////////////////////////////////////////////////////
  static getAdjustedSceneSize(gridSize) {
    const adjustment = 50 / gridSize;
    const newHeight = Math.round(canvas.dimensions.sceneHeight * adjustment)
    const newWidth = Math.round(canvas.dimensions.sceneWidth * adjustment)

    return { grid: 50, width: newWidth, height: newHeight, adjustment: adjustment };
  }
}