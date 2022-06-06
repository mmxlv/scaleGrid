class ScaleGridLayer extends CanvasLayer {
  constructor() {
    super();
    console.log("Grid Scale | Drawing Layer | Loaded into Drawing Layer");
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
      icon: "fas fa-wrench",
      layer: "grid",
      title: "Grid Controls",
      tools: [
        {
          icon: "fas fa-edit",
          name: "DrawGridTool",
          title: "Configure the grid by drawing either a square or hexagon",
          onClick: gridScaler.setupDrawGrid
        },
        {
          icon: "fas fa-ruler-horizontal",
          name: "AdjustXTool",
          title: "Adjust the X position of the grid",
          onClick: gridScaler.setupAdjustX
        },
        {
          icon: "fas fa-ruler-vertical",
          name: "AdjustYTool",
          title: "Adjust the Y position of the grid",
          onClick: gridScaler.setupAdjustY
        },
        {
          icon: "fas fa-th",
          name: "Draw3x3Tool",
          title: "Configure grid by drawing a 3x3 box",
          onClick: gridScaler.setup3X3
        },
        {
          icon: 'fas fa-table',
          name: "ManualGridSizeTool",
          title: "Configure the grid with Known X/Y Squares",
          onClick: gridScaler.promptForGridSize
        },
        // Sometimes the map you're using already has a grid printed on it, so you want the Foundry grid
        // to be fully transparent or just really light. In those cases, it's a pain to manually configure 
        // the settings to make it easier to see while you line up the Foundry grid. This lets you toggle 
        // an easy to see grid temporarily to make the job easier.
        {
          icon: 'fas fa-border-none',
          name: "ToogleGridTool",
          title: "Toggle the grid display temporarily",
          onClick: gridScaler.toggleGrid
        },
        {
          icon: "fas fa-undo",
          name: "ResetGridTool",
          title: "Reset Grid",
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
    console.log("Grid Scale | Drawing Layer | **** Running add listeners ****");
    canvas.stage.addListener('mousedown', gridScaler.gridOnMouseDown);
  }

  // From foundry.js =  this removes the mousedown/mousemove/mouseup to the canvas and calls their corresponding functions.
  removeListeners() {
    console.log("Grid Scale | Drawing Layer | **** Running remove listeners ****");
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

  gridOnMouseDown(e) {
    const mousePos = gridScaler.getMousePos(e);

    switch (gridScaler.currentTool) {     //this switch statement checks the value of the active tool from gridControls then picks the right function on mouse click.
      case "ResetGridTool":
        break;
      case "AdjustXTool":
        gridScaler.newsetXOff(mousePos);      //Broke out the xoffset from getPositionData and created a new function which does this.
        break;
      case "AdjustYTool":
        gridScaler.newsetYOff(mousePos);     //Broke out the Yoffset from getPositionData and created a new function which does this.
        break;
      case "DrawSquareTool":
      case "Draw3x3Tool":
      case "DrawHexTool":
      case "aGrid":     //this switch is used to add the mousemove listener for drawing the grid square
        gridScaler.ogMouseCoords = mousePos;
        gridScaler.addMoveListener();
        break;
      default:
        //If something gets here then one or more listener enabler/disabler didnt work.
        gridScaler.removeListeners();
        console.log("Grid Scale | Drawing Layer | &&^^NO mouse expression matched^^&&")
    }
  }

  // Should only be active for drawing the grid square. But in case it is active at some other point
  // there is an if statement that checks for the active tool and whether it needs to be drawn.
  gridOnMouseMove(evt) {
    const ogMousePos = gridScaler.ogMouseCoords;
    const mousePos = gridScaler.getMousePos();

    if (gridScaler.currentTool == "aGrid"
      || gridScaler.currentTool == "DrawHexTool"
      || gridScaler.currentTool == "Draw3x3Tool"
      || gridScaler.currentTool == "DrawSquareTool"
      && gridScaler.needsDrawn == true) {
      if (gridScaler.currentTool == "DrawHexTool") {
        gridScaler.configureHexGrid(ogMousePos, mousePos, evt)
      }
      else {
        gridScaler.configureSquare(ogMousePos, mousePos, evt)
      }
    }
  }

  // Used after finishing drawing the square.
  gridOnMouseUp(_) {
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
        gridScaler.ogMouseCoords = null;
      }
    }
  }

  getMousePos(e) {
    console.log("Grid Scale | Getting mouse position");

    const mouse = canvas.app.renderer.plugins.interaction.mouse.global;
    const t = canvas.stage.worldTransform;

    function calcCoord(axis) {
      return (mouse[axis] - t['t' + axis]) / canvas.stage.scale[axis];
    }

    return {
      x: calcCoord('x'),
      y: calcCoord('y')
    };
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
    gridScaler.callAGrid();
  }

  setupDrawHex() {
    gridScaler.currentTool = "DrawHexTool"
    gridScaler.callAGrid();
  }

  setup3X3() {
    gridScaler.currentTool = "Draw3x3Tool"
    gridScaler.callAGrid();
  }

  callAGrid() {
    gridScaler.needsDrawn = true;
    canvas.stage.addListener('mousedown', gridScaler.gridOnMouseDown);
  }

  // <================== Start Pixi Setup Functions  ====================>

  // Sets up the data for drawing the square when given mouse position. Enforces drawing a square, not a rectange.
  configureSquare(i, e, t) {
    const width = Math.abs(i.x - e.x) * (i.x < e.x ? -1 : 1);
    const height = Math.abs(width) * (i.y < e.y ? -1 : 1);
    const s = [i.x > e.x ? e.x : i.x, i.y > e.y ? e.y : i.y, Math.abs(width), Math.abs(height)];

    gridScaler.drawBox(s);
    gridScaler.dataCoords = s;
  }

  // Draws the box requested using pixi graphics. First it clears the previous square then sets fill color 
  // and line style then draws the new one from the given coords.
  drawBox(t) {
    this.pixiGraphics.clear().beginFill(0x208000, 0.3).lineStyle(1, 0x66ff33, .9, 0).drawRect(...t);
  }

  initializePixi() {
    this.pixiGraphics = canvas.controls.addChild(new PIXI.Graphics());
  }

  // Sets up the data for drawing the hex grid.
  configureHexGrid(ogMousePos, mousePos, evt) {
    const gridType = canvas.scene.data.gridType

    if (gridType > 1 && gridType < 4) {
      const height = Math.abs(ogMousePos.y - mousePos.y) * (ogMousePos.y < mousePos.y ? -1 : 1);
      const width = Math.abs(height) * (ogMousePos.x < mousePos.x ? -1 : 1);
      const s = [ogMousePos.y > mousePos.y ? mousePos.y : ogMousePos.y, ogMousePos.x > mousePos.x ? mousePos.x : ogMousePos.x, Math.abs(height), Math.abs(width)];

      gridScaler.setVerticalHexGrid(s[1], s[0], s[2], s[3])
      evt.data.coords = s, gridScaler.dataCoords = s;
    }
    else {
      const width = Math.abs(ogMousePos.x - mousePos.x) * (ogMousePos.x < mousePos.x ? -1 : 1);
      const height = Math.abs(width) * (ogMousePos.y < mousePos.y ? -1 : 1);
      const s = [ogMousePos.x > mousePos.x ? mousePos.x : ogMousePos.x, ogMousePos.y > mousePos.y ? mousePos.y : ogMousePos.y, Math.abs(width), Math.abs(height)];

      gridScaler.setHorizontalHexGrid(s[0], s[1], s[2], s[3])
      evt.data.coords = s, gridScaler.dataCoords = s;
    }
  }

  //This is the setup for a horizontal (flat) hex grid. Found the equations here (https://rechneronline.de/pi/hexagon.php)
  setHorizontalHexGrid(x, y, w, h) {
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

  // Sets up a vertical (pointy) hex grid.
  setVerticalHexGrid(x, y, w, h) {
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

  // <================== Start Custom Functions  ====================>

  // From foundry.js = Returns the coords of the grid square center that contains the given x/y coords.
  getNearestCenter(x, y) {
    const size = canvas.dimensions.size;
    return gridScaler.getTopLeft(x, y).map(t => t + size / 2)
  }

  // From foundry.js = Returns the top left coords of the grid square that contains the given x/y coords.
  getTopLeft(x, y) {
    const size = canvas.dimensions.size;
    return [x, y].map(c => Math.round(c - (size / 2)));
  }

  /* -------------------------------------------- */

  async setGridByCount(gridCount) {
    const dimensions = canvas.dimensions;
    const gridType = canvas.scene.data.gridType;
    let size = 0;

    switch (gridType) {
      // If this is a square grid, or a hex grid with rows, assume the number is the horizontal cell count.
      case 1:
      case 2:
      case 3:
        size = dimensions.sceneWidth / gridCount;
        break;
      // If this is a hex grid with columns, assume the number is the vertical cell count.
      case 4:
      case 5:
        size = dimensions.sceneHeight / gridCount;
        break;
    }

    if (size !== 0) {
      await gridScaler.setGridSize(size);
    }

    return size;
  }

  findTheBestSide(p1, p2, p3, cP) {
    if (cP < p1 + 5 && cP > p1 - 5) {
      //  console.log("left (top) most point")
      return p1
    }
    else if (cP < p2 + 5 && cP > p2 - 5) {
      //  console.log("Middle (middle) most point")
      return p2
    }
    else {
      //  console.log("right (bottom) most point")
      return p3
    }
  }

  findTheBest(n1, n2, clickN, gS) {
    let arry = null;
    const abs1 = n1 - clickN;
    const abs2 = n2 - clickN;

    if (Math.abs(abs1) < Math.abs(abs2)) {
      console.log("Grid Scale | Drawing Layer | ^^^^^ ChoseABS1 ^^^^^");
      if (n1 < clickN) {
        //console.log("Grid Scale | Drawing Layer | ^^^^^ N1 was LT Click ^^^^^");
        arry = [Math.abs(abs1), -Math.abs(gS / 2)]
        return arry;
      }
      else {
        //console.log("Grid Scale | Drawing Layer | ^^^^^ N1 was GT Click ^^^^^");
        arry = [-Math.abs(abs1), -Math.abs(gS / 2)]
        return arry;
      }
    }
    else {
      //console.log("Grid Scale | Drawing Layer | ^^^^^ ChoseABS2 ^^^^^");
      if (n2 < clickN) {
        //console.log("Grid Scale | Drawing Layer | ^^^^^ N2 was LT Click ^^^^^");
        arry = [Math.abs(abs2), Math.abs(gS / 2)]
        return arry;
      }
      else {
        //console.log("Grid Scale | Drawing Layer | ^^^^^ N2 was GT Click ^^^^^");
        arry = [-Math.abs(abs2), Math.abs(gS / 2)]
        return arry;
      }
    }

  }

  // <================== Start Grid Setting Functions  ====================>

  /**
   * this function takes in a mouse click then calls getTopLeft
   * to find the top left corner of the grid square that the click was in then gets the offset in a positive number.
   */
  async newsetXOff(s) {
    // Added the logic so it wont constantly shift in the positive direction. Instead finds the closest side the clicked point and will move the grid in either + or - to get there.

    const curScene = game.scenes.get(canvas.scene.data._id);      //getting current scenes ID from the canvas
    const curGrid = curScene.data.grid;      //getting current grid size from the canvas
    const curOffset = curScene.data.shiftX;     //getting the current xOffset incase it is not = 0 we need to add out new offset number to it.
    const curGridType = canvas.scene.data.gridType;
    let hexPValues = null;

    switch (curGridType) {  // This switch was added to determine what type of grid is in use and then apply the correct adjustment calculations.
      case 1:
        console.log("Grid Scale | Drawing Layer | Adjust X Square")
        const closeTopL = canvas.grid.getTopLeft(s.x, s.y);     //getting X/Y of grid corner
        const oppX = closeTopL[0] + curGrid;
        const absTopL = Math.abs(closeTopL[0] - s.x);
        const absTopR = Math.abs(oppX - s.x);

        if (absTopL > absTopR) {
          const xOff = curOffset - Math.floor(absTopR);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("X Offset", xOff);
        } else {
          const xOff = curOffset + Math.floor(absTopL);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("X Offset", xOff);
        }
        break;
      case 2:
      case 3:
        console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X")
        hexPValues = gridScaler.getPointyHexPoints(s.x, s.y)

        const absPL = Math.abs(hexPValues[0] - s.x);
        const absPR = Math.abs(hexPValues[2] - s.x);

        if (absPR < absPL) {
          const xOff = curOffset - Math.floor(absPR);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("X Offset", xOff);
        } else {
          const xOff = curOffset + Math.floor(absPL);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("X Offset", xOff);
        }
        break;
      case 4:
      case 5:
        console.log("Grid Scale | Drawing Layer | Flat Hex Adjust X")
        hexPValues = gridScaler.getFlatHexPoints(s.x, s.y)

        const prefSide = gridScaler.findTheBestSide(hexPValues[5], hexPValues[7], hexPValues[9], s.y)

        if (prefSide == hexPValues[5]) {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Top points")
          gridScaler.setDatXOffset(hexPValues[14], hexPValues[10], s)
        }
        else if (prefSide == hexPValues[1]) {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Middle POints")
          gridScaler.setDatXOffset(hexPValues[2], hexPValues[0], s)
        }
        else {
          console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust X | Chose Bottom Points")
          gridScaler.setDatXOffset(hexPValues[16], hexPValues[12], s)
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
  async newsetYOff(s) {
    // Added the logic so it wont constantly shift in the positive direction. Instead finds the closest side the clicked point and will move the grid in either + or - to get it right.

    gridScaler.removeListeners();     //removing listeners to so as to not get any more data and mess up the calculations
    const curScene = game.scenes.get(canvas.scene.data._id);      //getting current scenes ID from the canvas
    const curGrid = curScene.data.grid;      //getting current grid size from the canvas
    const curOffset = curScene.data.shiftY;     //getting the current xOffset incase it is not = 0 we need to add out new offset number to it.
    const curGridType = canvas.scene.data.gridType;

    switch (curGridType) {  // This switch was added to determine what type of grid is in use and then apply the correct adjustment calculations.
      case 1:
        console.log("Grid Scale | Drawing Layer | Square Adjust Y")
        const closeTopL = canvas.grid.getTopLeft(s.x, s.y);     //getting X/Y of grid corner
        const oppY = closeTopL[1] + curGrid;
        const absTop = Math.abs(closeTopL[1] - s.y);
        const absBot = Math.abs(oppY - s.y);

        if (absTop < absBot) {
          const yOff = curOffset + Math.floor(absTop);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("Y Offset", yOff);
        } else {
          const yOff = curOffset - Math.floor(absBot);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("Y Offset", yOff);
        }
        break;
      case 2:
      case 3:
        console.log("Grid Scale | Drawing Layer | Pointy Hex Adjust Y")
        const hexPValues = gridScaler.getPointyHexPoints(s.x, s.y)
        const prefSide = gridScaler.findTheBestSide(hexPValues[0], hexPValues[8], hexPValues[2], s.x)

        if (prefSide == hexPValues[0]) {
          gridScaler.setDatYOffset(hexPValues[15], hexPValues[17], s)
        } else if (prefSide == hexPValues[8]) {
          gridScaler.setDatYOffset(hexPValues[5], hexPValues[7], s)
        } else {
          gridScaler.setDatYOffset(hexPValues[11], hexPValues[13], s)
        }
        break;
      case 4:
      case 5:
        console.log("Grid Scale | Drawing Layer | Flat Hex Adjust Y")
        const hexValues = gridScaler.getFlatHexPoints(s.x, s.y)
        const absT = Math.abs(hexValues[5] - s.y);
        const absB = Math.abs(hexValues[7] - s.y);

        if (absT < absB) {
          const yOff = curOffset + Math.floor(absT);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("Y Offset", yOff);
        } else {
          const yOff = curOffset - Math.floor(absB);     //Maths = Find the bigger of the two xnumbers and subtract the smaller one. round down and then add it to the current scene offset
          await curScene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
          gridScaler.printOperationLog("Y Offset", yOff);
        }
        break;
      case 0:
      default:
        break;
    }
  }

  // Safely set the grid size for the canvas. Foundry expects the size to be an integer and at
  // least 50 pixels. If the value is less that 50, adjust the size of the map to compensate.
  async setGridSize(size) {
    const safeSize = Math.round(size);

    if (size < 50) {
      await gridScaler.adjustMapScale(safeSize);
      // Assume the size is now 50, since that's what the map was adjusted to.
      safeSize = 50;
    }

    const scene = game.scenes.get(canvas.scene.data._id);
    await scene.update({ grid: safeSize });

    gridScaler.printLog(`The grid was set to ${safeSize}.`);
  }

  async adjustMapScale(size) {
    const curScene = game.scenes.get(canvas.scene.data._id);
    const adjustment = 50 / size;
    const heightAdjust = Math.round(canvas.scene.data.height * adjustment)
    const widthAdjust = Math.round(canvas.scene.data.width * adjustment)

    await curScene.update({ grid: 50, width: widthAdjust, height: heightAdjust });
  }

  async setDatYOffset(p1, p2, s) {
    const curScene = game.scenes.get(canvas.scene.data._id);
    const curGrid = canvas.grid.size;
    const curOffset = curScene.data.shiftY;
    const magicNumber = gridScaler.findTheBest(p1, p2, s.y, curGrid);
    const yOff = Math.round(curOffset + magicNumber[0]);

    await curScene.update({ shiftY: yOff });      //this will update the current scene, this time it is the xOffset
    gridScaler.printOperationLog("Y Offset", yOff);
  }

  async setDatXOffset(p1, p2, s) {
    const curScene = game.scenes.get(canvas.scene.data._id);
    const curGrid = canvas.grid.size;
    const curOffset = curScene.data.shiftX;
    const magicNumber = gridScaler.findTheBest(p1, p2, s.x, curGrid);

    // Need to round the number because Foundry doesn't accept non-integers.
    const xOff = Math.round(curOffset + magicNumber[0]);

    await curScene.update({ shiftX: xOff });      //this will update the current scene, this time it is the xOffset
    gridScaler.printOperationLog("X Offset", xOff);
  }

  // Resets the grid to a 100px grid with 0 X/Y Offset, also sets the grid color to pink to make it easier to work with.
  async resetGrid() {
    gridScaler.removeListeners();
    console.log("Grid Scale | Drawing Layer | ^^^^^ Resetting Grid ^^^^^");
    const curScene = game.scenes.get(canvas.scene.data._id);

    await curScene.update({ grid: 100, shiftX: 0, shiftY: 0, gridColor: "#ff09c1", gridAlpha: 1 });
  }

  // Sets the grid square size. Then depending on the selected tool, may adjust the offset in X/Y.
  async setGrid() {
    this.pixiGraphics.clear();

    const adjY1 = canvas.dimensions.height;     //needed for adjustment of x/y later.
    const adjX1 = canvas.dimensions.width;     //needed for adjustment of x/y later.
    gridScaler.preGridScale = [adjX1, adjY1];           //needed for adjustment of x/y later.

    let gridPix = gridScaler.dataCoords[3];      //getting the grid pixel size

    if (gridScaler.currentTool == "Draw3x3Tool") {
      gridPix = gridPix / 3;
    }

    await gridScaler.setGridSize(gridPix);

    gridScaler.removeListeners();
    gridScaler.currentTool = null;
  }

  // Sets the hex size.
  async setHexGrid(_) {
    this.pixiGraphics.clear();

    const adjY1 = canvas.dimensions.height;     //needed for adjustment of x/y later.
    const adjX1 = canvas.dimensions.width;     //needed for adjustment of x/y later.
    gridScaler.preGridScale = [adjX1, adjY1];           //needed for adjustment of x/y later.

    const gridPix = gridScaler.dataCoords[3];      //getting the grid pixel size
    await gridScaler.setGridSize(gridPix);

    gridScaler.removeListeners();
    gridScaler.currentTool = null;
  }

  // <================== Message Functions  ====================>

  printOperationLog(desc, num) {
    gridScaler.printLog(`The grid ${desc} was set to ${num}.`);
  }

  printLog(message) {
    console.log(`Grid Scale | ${message}`);
  }

  // Renders a dialog to confirm the user wants to reset the grid
  resetDialog(event) {
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

  // Renders a dialog that lets the user enter known X/Y values.
  async promptForGridSize() {
    const templatePath = 'modules/scaleGrid/templates/known-xy.html';
    const html = await renderTemplate(templatePath, null);

    new Dialog({
      title: "Set Grid Size ",
      content: html,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: "OK",
          callback: dlg => {
            const form = dlg.find('#grid-scaler-set-grid')[0];
            const x = parseInt(form.querySelector("#x-num").value);
            gridScaler.setGridByCount(x);
          }
        }
      }
    }).render(true);
  }

  // Switch between the current grid settings and the preview grid settings.
  async toggleGrid() {
    const curSceneId = canvas.scene.data._id;

    if (!gridScaler.cavasGridTempSettings[curSceneId]) {
      gridScaler.saveGridSettings(curSceneId);
      await gridScaler.makeGridVisible(curSceneId);
    } else {
      await gridScaler.resetGridSettings(curSceneId);
    }
  }

  // Turn the grid pink and make it fully opaque and visible.
  async makeGridVisible(sceneId) {
    const curScene = game.scenes.get(sceneId);
    canvas.grid.visible = true;

    await curScene.update({
      gridAlpha: 1,
      gridColor: "#ff09c1" // pink
    });
  }

  // Save the color and alpha of the current scene's grid.
  // We'll use this to reset it when the preview is toggled off. 
  saveGridSettings(sceneId) {
    const curScene = game.scenes.get(sceneId);

    gridScaler.cavasGridTempSettings[sceneId] = {
      visible: canvas.grid.visible,
      data: {
        gridAlpha: curScene.data.gridAlpha,
        gridColor: curScene.data.gridColor
      }
    };
  }

  // Set the grid's color and alpha back to their original settings.
  async resetGridSettings(sceneId) {
    const settings = gridScaler.cavasGridTempSettings[sceneId];

    if (settings) {
      const curScene = game.scenes.get(canvas.scene.data._id);

      canvas.grid.visible = settings.visible;
      await curScene.update(settings.data)

      gridScaler.cavasGridTempSettings[sceneId] = null;
    }
  }

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

} // ends extendedCanvas class

// Initialize
const gridScaler = new ScaleGridLayer();
gridScaler.setButtons();
gridScaler.initialize();

// Add a releaseAll function to the GridLayer class so it can pass through the Canvas.tearDown method -- to be fixed in a future Foundry release
GridLayer.prototype.releaseAll = function () { };

console.log("Grid Scale | ** Finished Loading **");