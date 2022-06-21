import {
  gridUtils
} from "./gridUtils.js";

class ScaleGridLayer extends CanvasLayer {
  constructor() {
    super();
    gridUtils.log("Loaded into Drawing Layer");
    this.select = null;
    this.pixiGraphics = null;    //a variable not used
    this.pixiText = null; // used but not finished yet
    this.ogMouseCoords = null;  // original mouse coordinates
    this.cavasGridTempSettings = {};
  };

  // <================== Button Setup ====================>
  setButtons() {
    gridScaler.newButtons = {
      activeTool: "GridScaler",
      name: "grid",
      icon: "fas fa-border-all",
      layer: "grid",
      title: "Grid Controls",
      tools: [
        {
          icon: "fas fa-square",
          name: "DrawGridTool",
          title: "Set grid by drawing either a square or hexagon",
          onClick: gridScaler.setupDrawGrid
        },
        {
          icon: "fas fa-th",
          name: "Draw3x3Tool",
          title: "Set grid by drawing a 3x3 box",
          onClick: gridScaler.setupDraw3X3
        },
        {
          icon: "fas fa-ruler-horizontal",
          name: "AdjustXTool",
          title: "Set the X position of the grid",
          onClick: gridScaler.setupAdjustX
        },
        {
          icon: "fas fa-ruler-vertical",
          name: "AdjustYTool",
          title: "Set the Y position of the grid",
          onClick: gridScaler.setupAdjustY
        },
        {
          icon: "fas fa-object-group",
          name: "MoveGridTool",
          title: "Move and scale the grid",
          onClick: gridScaler.openGridMoveDialog
        },
        {
          icon: 'fas fa-pen-square',
          name: "ManualGridSizeTool",
          title: "Set the grid by number of squares or hexes",
          onClick: gridScaler.openGridSizeDialog
        },
        {
          icon: 'fas fa-border-none',
          name: "ToogleGridTool",
          title: "Toggle the grid display temporarily",
          onClick: gridScaler.toggleGrid
        },
        {
          icon: "fas fa-undo",
          name: "ResetGridTool",
          title: "Reset the grid",
          onClick: e => {
            this.resetDialog(e);
          }
        }
      ]
    }
  }

  // <================== Listeners Section ====================>

  // From foundry.js =  this adds the mousedown/mousemove/mouseup to the canvas calls their corresponding functions.
  addListeners() {
    gridUtils.log("Add listeners");
    canvas.stage.addListener('mousedown', gridScaler.gridOnMouseDown);
  }

  // From foundry.js =  this removes the mousedown/mousemove/mouseup to the canvas and calls their corresponding functions.
  removeListeners() {
    gridUtils.log("Remove listeners");
    canvas.stage.removeListener('mousedown', gridScaler.gridOnMouseDown);
    canvas.stage.removeListener("mousemove", gridScaler.gridOnMouseMove);
    canvas.stage.removeListener("mouseup", gridScaler.gridOnMouseUp);
  }

  // Adds only the mouse move listener used to drawing the square.
  addMoveListener() {
    canvas.stage.addListener("mousemove", gridScaler.gridOnMouseMove);
    canvas.stage.addListener("mouseup", gridScaler.gridOnMouseUp);
  }

  // <================== Start Mouse Actions  ====================>

  gridOnMouseDown(evt) {
    const mousePos = gridUtils.getMousePos(evt);

    switch (gridScaler.currentTool) {     //this switch statement checks the value of the active tool from gridControls then picks the right function on mouse click.
      case "DrawSquareTool":
      case "Draw3x3Tool":
      case "DrawHexTool":
        gridScaler.ogMouseCoords = mousePos;
        gridScaler.addMoveListener();
        break;
      case "AdjustXTool":
        gridScaler.setNewXOffset(mousePos);
        break;
      case "AdjustYTool":
        gridScaler.setNewYOffset(mousePos);
        break;
      case "ResetGridTool":
        break;
      default:
        //If something gets here then one or more listener enabler/disabler didnt work.
        gridScaler.removeListeners();
        gridUtils.log("&&^^NO mouse expression matched^^&&")
    }
  }

  // Should only be active for drawing the grid square. But in case it is active at some other point
  // there is an if statement that checks for the active tool and whether it needs to be drawn.
  gridOnMouseMove(_) {
    if (!gridScaler.needsDrawn) {
      return;
    }

    const ogMousePos = gridScaler.ogMouseCoords;
    const mousePos = gridUtils.getMousePos();

    if (gridScaler.currentTool == "DrawHexTool") {
      gridScaler.configureHexGrid(ogMousePos, mousePos)
    } else if (gridScaler.currentTool == "Draw3x3Tool"
      || gridScaler.currentTool == "DrawSquareTool") {
      gridScaler.configureSquareGrid(ogMousePos, mousePos)
    }
  }

  // Used after finishing drawing the square.
  gridOnMouseUp(evt) {
    gridScaler.removeListeners();

    // Resets some things, clears the square and switch on the game listeners.
    if (gridScaler.needsDrawn == true) {
      if (gridScaler.currentTool == "DrawHexTool") {
        gridScaler.needsDrawn = false;
        gridScaler.setHexGrid();
        gridScaler.ogMouseCoords = null;
      } else {
        gridScaler.needsDrawn = false;
        gridScaler.setGrid();
      }

      // Open the dialog that let's you manually adjust the drig after drawing,
      // since you rarely get it exact and need to do some fine tuning anyway.
      // gridScaler.openGridMoveWindow();
    }
  }

  // <================== Start Setup Functions  ====================>

  setupAdjustX() {
    console.log("Grid Scale | Drawing Layer | Running AdjustX")
    gridScaler.currentTool = "AdjustXTool"
    gridScaler.addListeners();
  }

  setupAdjustY() {
    console.log("Grid Scale | Drawing Layer | Running AdjustY")
    gridScaler.currentTool = "AdjustYTool"
    gridScaler.addListeners();
  }

  setupDrawGrid() {
    const gridType = canvas.scene.data.gridType

    if (gridType === 1) {
      gridScaler.setupDrawSquare();
    } else if (gridType !== 0) {
      gridScaler.setupDrawHex();
    }
  }

  setupDrawSquare() {
    gridScaler.currentTool = "DrawSquareTool"
    gridScaler.initializeDrawGrid();
  }

  setupDrawHex() {
    gridScaler.currentTool = "DrawHexTool"
    gridScaler.initializeDrawGrid();
  }

  setupDraw3X3() {
    gridScaler.currentTool = "Draw3x3Tool"
    gridScaler.initializeDrawGrid();
  }

  initializeDrawGrid() {
    gridScaler.drawCoords = null;
    gridScaler.needsDrawn = true;
    canvas.stage.addListener('mousedown', gridScaler.gridOnMouseDown);
  }

  // <================== Start Pixi Setup Functions  ====================>

  initializePixi() {
    gridScaler.pixiGraphics = canvas.controls.addChild(new PIXI.Graphics());
  }

  // Sets up the data for drawing the square when given mouse position. Enforces drawing a square, not a rectange.
  configureSquareGrid(ogMousePos, mousePos) {
    const size = Math.abs(ogMousePos.x - mousePos.x);
    let x = ogMousePos.x;
    let y = ogMousePos.y;

    // Make sure the square is always anchored around the original mouse click.
    if (mousePos.x < ogMousePos.x) {
      x = ogMousePos.x - size;
    }

    if (mousePos.y < ogMousePos.y) {
      y = ogMousePos.y - size;
    }

    const coords = [x, y, size, size];
    gridScaler.drawCoords = coords;
    gridScaler.drawSquareGrid(coords);
  }

  drawSquareGrid(coords) {
    gridScaler.pixiGraphics
      .clear()
      .beginFill(0x208000, 0.3)
      .lineStyle(1, 0x66ff33, .9, 0)
      .drawRect(...coords);
  }

  // Sets up the data for drawing the hex grid.
  configureHexGrid(ogMousePos, mousePos) {
    const gridType = canvas.scene.data.gridType

    if (gridType > 1 && gridType < 4) {
      const height = Math.abs(ogMousePos.y - mousePos.y) * (ogMousePos.y < mousePos.y ? -1 : 1);
      const width = Math.abs(height) * (ogMousePos.x < mousePos.x ? -1 : 1);
      const coords = [
        ogMousePos.y > mousePos.y ? mousePos.y : ogMousePos.y,
        ogMousePos.x > mousePos.x ? mousePos.x : ogMousePos.x,
        Math.abs(height), Math.abs(width)];

      gridScaler.drawCoords = coords;
      gridScaler.drawVerticalHexGrid(coords[1], coords[0], coords[2], coords[3])
    }
    else {
      const width = Math.abs(ogMousePos.x - mousePos.x) * (ogMousePos.x < mousePos.x ? -1 : 1);
      const height = Math.abs(width) * (ogMousePos.y < mousePos.y ? -1 : 1);
      const coords = [
        ogMousePos.x > mousePos.x ? mousePos.x : ogMousePos.x,
        ogMousePos.y > mousePos.y ? mousePos.y : ogMousePos.y,
        Math.abs(width), Math.abs(height)];

      gridScaler.drawCoords = coords;
      gridScaler.drawHorizontalHexGrid(coords[0], coords[1], coords[2], coords[3])
    }
  }

  drawHorizontalHexGrid(x, y, w, h) {
    const d = w;
    const a = d / 2;
    const eH = Math.sqrt(3) / 2 * a

    // the following variables setup a flat hex when dragged sideways.
    const pt1 = [x, y]
    const pt2 = [x + (a / 2), y - eH]
    const pt3 = [x + (a / 2) + a, y - eH]
    const pt4 = [x + w, y]
    const pt5 = [x + (a / 2) + a, y + eH]
    const pt6 = [x + (a / 2), y + eH]
    const whattf = [pt1[0], pt1[1], pt2[0], pt2[1], pt3[0], pt3[1], pt4[0], pt4[1], pt5[0], pt5[1], pt6[0], pt6[1], pt1[0], pt1[1]];

    gridScaler.pixiGraphics.clear().beginFill(0x478a94, 0.3).lineStyle(1, 0x7deeff, .9, 0).drawPolygon(whattf);
  }

  drawVerticalHexGrid(x, y, w, h) {
    const d = h;
    const a = d / 2;
    const eH = Math.sqrt(3) / 2 * a
    const pt1 = [x, y]
    const pt2 = [x + eH, y + (a / 2)]
    const pt3 = [x + eH, y + (a / 2) + a]
    const pt4 = [x, y + h]
    const pt5 = [x - eH, y + (a / 2) + a]
    const pt6 = [x - eH, y + (a / 2)]
    const whattf = [pt1[0], pt1[1], pt2[0], pt2[1], pt3[0], pt3[1], pt4[0], pt4[1], pt5[0], pt5[1], pt6[0], pt6[1], pt1[0], pt1[1]];

    gridScaler.pixiGraphics.clear().beginFill(0x478a94, 0.3).lineStyle(1, 0x7deeff, .9, 0).drawPolygon(whattf);
  }

  // Used to get the side points for a hexagon based off the returned center point so that offset can be determined.
  getFlatHexPoints(x, y) {
    const curWidth = canvas.scene.data.grid;
    const d = curWidth;
    const a = d / 2;
    const eH = Math.sqrt(3) / 2 * a
    const centerPoint = canvas.grid.getCenter(x, y)
    const lP = [centerPoint[0] - a, centerPoint[1]];
    const rP = [centerPoint[0] + a, centerPoint[1]];
    const bP = [centerPoint[0], centerPoint[1] + eH];
    const tP = [centerPoint[0], centerPoint[1] - eH];
    const rTP = [centerPoint[0] + (a / 2), centerPoint[1] - eH];
    const rBP = [centerPoint[0] + (a / 2), centerPoint[1] + eH];
    const lTP = [centerPoint[0] - (a / 2), centerPoint[1] - eH];
    const lBP = [centerPoint[0] - (a / 2), centerPoint[1] + eH];

    return [lP[0], lP[1], rP[0], rP[1], tP[0], tP[1], bP[0], bP[1], centerPoint[0], centerPoint[1], rTP[0], rTP[1], rBP[0], rBP[1], lTP[0], lTP[1], lBP[0], lBP[1]];
    /*
      How this determines offsets is to get the center of the clicked in hexagon. Following this it gets the current scenes grid size.
      Since we know the grid size and that a hexagon is a bunch of triangles we can calculate the points we need to determine the edges of the hexagon.
      We determine a left point (lP), right point (rP), top point (tP), and bottom point (bP). Once these points are figured out. When this is called
      the function that called it can see if the click is inside/outside of these points and adjust the grid accordingly.
    */
  }

  // Used to get the side points for a hexagon based off the returned center point so that offset can be determined.
  getPointyHexPoints(x, y) {
    const curWidth = canvas.scene.data.grid;
    const d = curWidth;
    const a = d / 2;
    const eH = Math.sqrt(3) / 2 * a
    const centerPoint = canvas.grid.getCenter(x, y)
    const lP = [centerPoint[0] - eH, centerPoint[1]];
    const rP = [centerPoint[0] + eH, centerPoint[1]];
    const bP = [centerPoint[0], centerPoint[1] + a];
    const tP = [centerPoint[0], centerPoint[1] - a];
    const rTP = [centerPoint[0] + eH, centerPoint[1] - (a / 2)];
    const rBP = [centerPoint[0] + eH, centerPoint[1] + (a / 2)];
    const lTP = [centerPoint[0] + eH, centerPoint[1] - (a / 2)];
    const lBP = [centerPoint[0] + eH, centerPoint[1] + (a / 2)];

    return [lP[0], lP[1], rP[0], rP[1], tP[0], tP[1], bP[0], bP[1], centerPoint[0], centerPoint[1], rTP[0], rTP[1], rBP[0], rBP[1], lTP[0], lTP[1], lBP[0], lBP[1]];
    //tdlr need points to determine shift distance (see above ~731)
  }

  // <================== Start Grid Setting Functions  ====================>

  async setNewXOffset(mousePos) {
    // Added the logic so it wont constantly shift in the positive direction. Instead finds the closest side the clicked point and will move the grid in either + or - to get there.

    const curScene = game.scenes.get(canvas.scene.data._id);      //getting current scenes ID from the canvas
    const curGrid = curScene.data.grid;      //getting current grid size from the canvas
    const curOffset = curScene.data.shiftX;     //getting the current xOffset incase it is not = 0 we need to add out new offset number to it.
    const curGridType = canvas.scene.data.gridType;
    let hexPValues = null;

    switch (curGridType) {
      case 1:
        console.log("Grid Scale | Drawing Layer | Adjust X Square")
        const closeTopL = canvas.grid.getTopLeft(mousePos.x, mousePos.y);     //getting X/Y of grid corner
        const oppX = closeTopL[0] + curGrid;
        const absTopL = Math.abs(closeTopL[0] - mousePos.x);
        const absTopR = Math.abs(oppX - mousePos.x);

        if (absTopL > absTopR) {
          const xOff = curOffset - Math.floor(absTopR);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("X Offset", xOff);
        } else {
          const xOff = curOffset + Math.floor(absTopL);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("X Offset", xOff);
        }
        break;
      case 2:
      case 3:
        console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X")
        hexPValues = gridScaler.getPointyHexPoints(mousePos.x, mousePos.y)

        const absPL = Math.abs(hexPValues[0] - mousePos.x);
        const absPR = Math.abs(hexPValues[2] - mousePos.x);

        if (absPR < absPL) {
          const xOff = curOffset - Math.floor(absPR);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("X Offset", xOff);
        } else {
          const xOff = curOffset + Math.floor(absPL);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("X Offset", xOff);
        }
        break;
      case 4:
      case 5:
        console.log("Grid Scale | Drawing Layer | Flat Hex Adjust X")
        hexPValues = gridScaler.getFlatHexPoints(mousePos.x, mousePos.y)

        const prefSide = gridUtils.findTheBestSide(hexPValues[5], hexPValues[7], hexPValues[9], mousePos.y)

        if (prefSide == hexPValues[5]) {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Top points")
          gridScaler.setDatXOffset(hexPValues[14], hexPValues[10], mousePos)
        }
        else if (prefSide == hexPValues[1]) {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Middle POints")
          gridScaler.setDatXOffset(hexPValues[2], hexPValues[0], mousePos)
        }
        else {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Bottom Points")
          gridScaler.setDatXOffset(hexPValues[16], hexPValues[12], mousePos)
        }
        break;
      case 0:
      default:
        break;
    }
  }

  /**
   * this function takes in a mouse click then calls getTopLeft
   * to find the top left corner of the grid square that the click was in then gets the offset in a positive number.
   */
  async setNewYOffset(mousePos) {
    // Added the logic so it wont constantly shift in the positive direction. Instead finds the closest side the clicked point and will move the grid in either + or - to get it right.

    gridScaler.removeListeners();     //removing listeners to so as to not get any more data and mess up the calculations
    const scene = game.scenes.get(canvas.scene.data._id);      //getting current scenes ID from the canvas
    const gridSize = scene.data.grid;      //getting current grid size from the canvas
    const curOffset = scene.data.shiftY;     //getting the current xOffset incase it is not = 0 we need to add out new offset number to it.
    const gridType = canvas.scene.data.gridType;

    switch (gridType) {  // This switch was added to determine what type of grid is in use and then apply the correct adjustment calculations.
      case 1:
        console.log("Grid Scale | Drawing Layer | Square Adjust Y")
        const closeTopL = canvas.grid.getTopLeft(mousePos.x, mousePos.y);     //getting X/Y of grid corner
        const oppY = closeTopL[1] + gridSize;
        const absTop = Math.abs(closeTopL[1] - mousePos.y);
        const absBot = Math.abs(oppY - mousePos.y);

        if (absTop < absBot) {
          const yOff = curOffset + Math.floor(absTop);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await scene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("Y Offset", yOff);
        } else {
          const yOff = curOffset - Math.floor(absBot);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await scene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("Y Offset", yOff);
        }
        break;
      case 2:
      case 3:
        console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust Y")
        const hexPValues = gridScaler.getPointyHexPoints(mousePos.x, mousePos.y)
        const prefSide = gridUtils.findTheBestSide(hexPValues[0], hexPValues[8], hexPValues[2], mousePos.x)

        if (prefSide == hexPValues[0]) {
          gridScaler.setDatYOffset(hexPValues[15], hexPValues[17], mousePos)
        } else if (prefSide == hexPValues[8]) {
          gridScaler.setDatYOffset(hexPValues[5], hexPValues[7], mousePos)
        } else {
          gridScaler.setDatYOffset(hexPValues[11], hexPValues[13], mousePos)
        }
        break;
      case 4:
      case 5:
        console.log("Grid Scale | Drawing Layer | Flat Hex Adjust Y")
        const hexValues = gridScaler.getFlatHexPoints(mousePos.x, mousePos.y)
        const absT = Math.abs(hexValues[5] - mousePos.y);
        const absB = Math.abs(hexValues[7] - mousePos.y);

        if (absT < absB) {
          const yOff = curOffset + Math.floor(absT);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await scene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("Y Offset", yOff);
        } else {
          const yOff = curOffset - Math.floor(absB);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await scene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridUtils.printOperationLog("Y Offset", yOff);
        }
        break;
      case 0:
      default:
        break;
    }
  }

  // Safely set the grid size for the canvas. Foundry expects the size to be an integer and at
  // least 50 pixels. If the value is less that 50, adjust the size of the map to compensate.
  async setGridSize(data) {
    const safeSize = Math.round(data.grid);

    if (safeSize < 50) {
      const adjustedData = gridUtils.getAdjustedSceneSize(safeSize);
      data.grid = adjustedData.grid;
      data.width = adjustedData.width;
      data.height = adjustedData.height;
    } else {
      data.grid = safeSize;
    }

    const scene = game.scenes.get(canvas.scene.data._id);
    await scene.update(data);

    gridUtils.log(`The grid was set to ${data.grid}.`);
  }

  async setDatYOffset(p1, p2, mousePos) {
    const scene = game.scenes.get(canvas.scene.data._id);
    const gridSize = canvas.grid.size;
    const yOffset = scene.data.shiftY;
    const magicNumber = gridUtils.findTheBest(p1, p2, mousePos.y, gridSize);
    const finalOffset = Math.round(yOffset + magicNumber[0]);

    await scene.update({ shiftY: finalOffset });
    gridUtils.logOperation("Y Offset", finalOffset);
  }

  async setDatXOffset(p1, p2, mousePos) {
    const scene = game.scenes.get(canvas.scene.data._id);
    const gridSize = canvas.grid.size;
    const xOffset = scene.data.shiftX;
    const magicNumber = gridUtils.findTheBest(p1, p2, mousePos.x, gridSize);

    // Need to round the number because Foundry doesn't accept non-integers.
    const finalOffset = Math.round(xOffset + magicNumber[0]);

    await scene.update({ shiftX: finalOffset });
    gridUtils.logOperation("X Offset", finalOffset);
  }

  // Resets the grid to a 100px grid with 0 X/Y Offset.
  async resetGrid() {
    gridScaler.removeListeners();
    gridUtils.log("Resetting Grid");
    const scene = game.scenes.get(canvas.scene.data._id);
    await scene.update({ grid: 100, shiftX: 0, shiftY: 0 });
  }

  async setGrid() {
    gridScaler.removeListeners();
    gridScaler.pixiGraphics.clear();

    if (gridScaler.drawCoords) {
      let gridSize = gridScaler.drawCoords[3];
      let sceneWidth = canvas.dimensions.sceneWidth;
      let sceneHeight = canvas.dimensions.sceneHeight;
      let adjustmentRatio = 1;

      if (gridScaler.currentTool == "Draw3x3Tool") {
        gridSize /= 3;
      }

      // If the grid size ends up being less than 50 we need to make it 50 and adjust 
      // the scene (map) size to compensate. Foundry doesn't accept grid sizes less than 50.
      if (gridSize < 50) {
        const adjustedData = gridUtils.getAdjustedSceneSize(gridSize);
        adjustmentRatio = adjustedData.adjustment;
        gridSize = adjustedData.grid;
        sceneWidth = adjustedData.width;
        sceneHeight = adjustedData.height;
      }

      // Need to take into account the current shift and padding values, along with the 
      // adjustment ratio from above if needed, when setting the starting location
      let gridX = (gridScaler.drawCoords[0] + canvas.dimensions.shiftX - canvas.dimensions.paddingX) * adjustmentRatio;
      let gridY = (gridScaler.drawCoords[1] + canvas.dimensions.shiftY - canvas.dimensions.paddingY) * adjustmentRatio;

      // Go left and up from the top left of the box until we pass the left/top side 
      // of the scene. That'll be the amount we need to shift the grid by.
      while (gridX > 0) {
        gridX -= gridSize;
      }

      while (gridY > 0) {
        gridY -= gridSize;
      }

      let shiftX = gridX;
      let shiftY = gridY;

      // We know the shift values are negative at this point, but check to see if 
      // it makes sense to switch to a smaller positive offset instead.
      if (gridSize - Math.abs(gridX) < Math.abs(gridX)) {
        shiftX = gridSize + gridX;
      }

      if (gridSize - Math.abs(gridY) < Math.abs(gridY)) {
        shiftY = gridSize + gridY;
      }

      // Update the scene with the new data.
      const gridData = {
        grid: Math.round(gridSize),
        shiftX: Math.round(shiftX),
        shiftY: Math.round(shiftY),
        width: Math.round(sceneWidth),
        height: Math.round(sceneHeight)
      }

      const scene = game.scenes.get(canvas.scene.data._id);
      await scene.update(gridData);
    }

    gridScaler.currentTool = null;
  }

  // Sets the grid, with appropriate offset.
  // Usual hex information for coming up with hex part ratios: https://hexagoncalculator.apphb.com/
  //  --  Edge length: 0.5
  // /  \
  // \  / Diameter (point to point): 1
  //  --  Top to bottom length: 0.866
  async setHexGrid(_) {
    gridScaler.removeListeners();
    gridScaler.pixiGraphics.clear();

    if (gridScaler.drawCoords) {
      const gridType = canvas.scene.data.gridType
      let gridSize = gridScaler.drawCoords[3];
      let sceneWidth = canvas.dimensions.sceneWidth;
      let sceneHeight = canvas.dimensions.sceneHeight;
      let adjustmentRatio = 1;

      // If the grid size ends up being less than 50 we need to make it 50 and adjust 
      // the scene (map) size to compensate. Foundry doesn't accept grid sizes less than 50.
      if (gridSize < 50) {
        const adjustedData = gridUtils.getAdjustedSceneSize(gridSize);
        adjustmentRatio = adjustedData.adjustment;
        gridSize = adjustedData.grid;
        sceneWidth = adjustedData.width;
        sceneHeight = adjustedData.height;
      }

      // Need to take into account the current shift and padding values, along with the 
      // adjustment ratio from above if needed, when setting the starting location
      let gridX = (gridScaler.drawCoords[0] + canvas.dimensions.shiftX - canvas.dimensions.paddingX) * adjustmentRatio;
      let gridY = (gridScaler.drawCoords[1] + canvas.dimensions.shiftY - canvas.dimensions.paddingY) * adjustmentRatio;

      let tempGridSize = gridSize * 0.8660258075690656;

      // Go left and up from the top left of the box until we pass the left/top side 
      // of the scene. That'll be the amount we need to shift the grid by.
      let moveCount = 0;

      while (gridX > 0) {
        if (gridType == 2 || gridType == 3) {
          gridX -= tempGridSize;
        } else {
          // let shouldHalf = moveCount % 2 == 0;
          // gridX -= shouldHalf ? gridSize / 2 : gridSize;
          moveCount++;
          gridX -= gridSize / 4
        }
      }

      while (gridY > 0) {
        if (gridType == 2 || gridType == 3) {
          gridY -= gridSize;
        } else {
          gridY -= tempGridSize;
        }
      }

      let shiftX = gridX;
      let shiftY = gridY;

      // We know the shift values are negative at this point, but check to see if 
      // it makes sense to switch to a smaller positive offset instead.
      if (gridSize - Math.abs(gridX) < Math.abs(gridX)) {
        shiftX = gridSize + gridX;
      }

      if (gridSize - Math.abs(gridY) < Math.abs(gridY)) {
        shiftY = gridSize + gridY;
      }

      shiftX = gridX - ((gridSize / 4) * (moveCount % 4));

      console.log(`size: ${gridSize}`);
      console.log(`shift X:${shiftX} Y:${shiftY}`);
      console.log(`modulo: ${moveCount % 4}`);

      // Update the scene with the new data.
      const gridData = {
        grid: Math.round(gridSize),
        shiftX: Math.round(shiftX),
        shiftY: Math.round(shiftY),
        width: Math.round(sceneWidth),
        height: Math.round(sceneHeight)
      }

      const scene = game.scenes.get(canvas.scene.data._id);
      await scene.update(gridData);
    }

    gridScaler.currentTool = null;
  }

  // <================== Dialogs  ====================>

  async openGridMoveDialog() {
    const templatePath = 'modules/scaleGrid/templates/gridMove.html';
    const html = await renderTemplate(templatePath, null);
    let shiftX = canvas.dimensions.shiftX;
    let shiftY = canvas.dimensions.shiftY;
    let size = canvas.dimensions.size;

    gridScaler.toggleGrid();

    new Dialog({
      title: "Move and Scale Grid ",
      content: html,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Save Changes",
          callback: async _ => {
            const scene = game.scenes.get(canvas.scene.data._id);
            await scene.update({
              shiftX: shiftX,
              shiftY: shiftY,
              grid: size
            });
          }
        },
        reset: {
          icon: '<i class="fas fa-sync"></i>',
          label: "Discard Changes",
          callback: async _ => {
            if (canvas.ready) await canvas.draw();
          }
        }
      },
      default: "save",
      render: html => {
        html.find("#move-right").click(() => {
          shiftX += 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
        html.find("#move-left").click(() => {
          shiftX -= 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
        html.find("#move-up").click(() => {
          shiftY -= 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
        html.find("#move-down").click(() => {
          shiftY += 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
        html.find("#expand-grid").click(() => {
          size += 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
        html.find("#contract-grid").click(() => {
          size -= 1;
          gridUtils.refreshGrid({ background: true, shiftX: shiftX, shiftY: shiftY, size: size })
        });
      },
      close: () => {
        gridScaler.toggleGrid();
        ui.notifications.info("dialog closed");
      }
    }).render(true);
  }

  // Renders a dialog that lets the user enter known X/Y values.
  async openGridSizeDialog() {
    const templatePath = 'modules/scaleGrid/templates/known-xy.html';
    const html = await renderTemplate(templatePath, null);

    new Dialog({
      title: "Set Grid Size ",
      content: html,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: "OK",
          callback: async html => {
            const form = html.find('#grid-scaler-set-grid')[0];
            const gridCount = parseFloat(form.querySelector("#grid-count").value);
            const gridSize = await gridUtils.getGridSizeByCount(gridCount);

            if (gridSize > 0) {
              await gridScaler.setGridSize({ grid: gridSize });
            }
          }
        }
      }
    }).render(true);
  }

  resetDialog(_) {
    const confirmDialog = new Dialog({
      height: 800,
      width: 800,
      title: "Reset grid?",
      content: "<p>Reset grid to defaults?</p>",
      buttons: {
        yes: {
          icon: `<i class="fas fa-check"></i>`,
          label: "Reset",
          callback: () => {
            gridScaler.resetGrid();
          }
        },
        no: {
          icon: `<i class="fas fa-times"></i>`,
          label: "Cancel"
        }
      },
      default: "no"
    });

    confirmDialog.render(true);
  }

  // <================== Toggle Grid  ====================>

  // Sometimes the map you're using already has a grid printed on it, so you want the Foundry grid
  // to be fully transparent or just really light. In those cases, it's a pain to manually configure 
  // the settings to make it easier to see while you line up the Foundry grid. This lets you toggle 
  // an easy to see grid temporarily to make the job easier.
  toggleGrid() {
    const curSceneId = canvas.scene.data._id;

    if (!gridScaler.cavasGridTempSettings[curSceneId]) {
      gridScaler.saveGridSettings(curSceneId);
      gridScaler.makeGridVisible();
    } else {
      gridScaler.resetGridSettings(curSceneId);
    }
  }

  // Turn the grid red and make it fully opaque and visible.
  makeGridVisible() {
    canvas.grid.visible = true;

    gridUtils.refreshGrid({
      grid: true,
      gridAlpha: 1,
      gridColor: "#FF0000"
    });
  }

  // Save the color and alpha of the current scene's grid.
  // We'll use this to reset it when the preview is toggled off. 
  saveGridSettings(sceneId) {
    const curScene = game.scenes.get(sceneId);

    gridScaler.cavasGridTempSettings[sceneId] = {
      visible: canvas.grid.visible,
      gridAlpha: curScene.data.gridAlpha,
      gridColor: curScene.data.gridColor
    };
  }

  // Set the grid's color and alpha back to their original settings.
  resetGridSettings(sceneId) {
    const settings = gridScaler.cavasGridTempSettings[sceneId];

    if (settings) {
      canvas.grid.visible = settings.visible;

      gridUtils.refreshGrid({
        grid: true,
        gridAlpha: settings.gridAlpha,
        gridColor: settings.gridColor
      });

      gridScaler.cavasGridTempSettings[sceneId] = null;
    }
  }

  // <================== Initialize  ====================>

  // Initialize the ScaleGridLayer. Attach the button to the controls, draw the square, and the draw text.
  initialize() {
    Hooks.on('getSceneControlButtons', controls => {
      if (game.user.data.role == 4) {
        controls.push(gridScaler.newButtons);
      }
    });

    // only draw objects when canvas is ready
    Hooks.on('canvasReady', _ => {
      gridScaler.initializePixi();
    });
  }

}

const gridScaler = new ScaleGridLayer();
gridScaler.setButtons();
gridScaler.initialize();

// Add a releaseAll function to the GridLayer class so it can pass through the Canvas.tearDown method -- to be fixed in a future Foundry release
GridLayer.prototype.releaseAll = function () { };

gridUtils.log("** Finished Loading **");