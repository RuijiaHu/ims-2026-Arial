// Source: https://p5js.org/examples/math-and-physics-soft-body/
// Created by Ira Greenberg. Revised by Darren Kessner. From 2024 onwards, edited and maintained by p5.js Contributors and Processing Foundation. Licensed under CC BY-NC-SA 4.0.


// Declare variables for the physics calculations
// My comments: These are global variables for later usage which could save more tiem to do the calculation and clearify all the relations between the datas. These especially are for physics calculation later in the code.
let centerX = 0.0;
let centerY = 0.0;
let radius = 45;
let rotAngle = -90;
let accelX = 0.0;
let accelY = 0.0;
let deltaX = 0.0;
let deltaY = 0.0;
let springing = 0.0009;
let damping = 0.98;

// Declare variables for specifying vertex locations
// My comments: Same thing, global variables, mosly are arrays that can be used later for vertex locations variations.
let nodes = 5;
let nodeStartX = [];
let nodeStartY = [];
let nodeX = [];
let nodeY = [];
let angle = [];
let frequency = [];

let organicConstant = 1.0;

// freely wandering around
let noiseOffsetX = 0;
// not letting the star going straight line
let noiseOffsetY = 1000;  
let noiseSpeed = 0.004;  
let autoTargetX = 0;
let autoTargetY = 0;

//when mouse is not moving, change it into automatic mode
let useAutoTarget = true; 
let lastMouseX = -1;
let lastMouseY = -1;
let mouseIdleFrames = 0;
let IDLE_THRESHOLD = 180;  // when reaching the target, pause for a bit

let my = {};


function setup() {
  createCanvas(windowWidth, windowHeight);

  centerX = width / 2;
  centerY = height / 2;
  autoTargetX = centerX;
  autoTargetY = centerY;
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = 0;
    nodeStartY[i] = 0;
    nodeX[i] = 0;
    nodeY[i] = 0;
    angle[i] = 0;
    frequency[i] = random(5, 12);
  }

  noStroke();
  angleMode(DEGREES);

  setup_fullScreenButton();
}

function draw() {
  background(0, 50);
  drawShape();
  moveShape();
}


function drawShape() {
  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = centerX + cos(rotAngle) * radius;
    nodeStartY[i] = centerY + sin(rotAngle) * radius;
    rotAngle += 360.0 / nodes;
  }

  curveTightness(organicConstant);
  let shapeColor = lerpColor(color('red'), color('yellow'), organicConstant);
  fill(shapeColor);

  beginShape();
  for (let i = 0; i < nodes; i++) {
    curveVertex(nodeX[i], nodeY[i]);
  }
  endShape(CLOSE);
}

//Auto
function moveShape() {

  //detect if the mouse is moving
  if (abs(mouseX - lastMouseX) > 1.5 || abs(mouseY - lastMouseY) > 1.5) {
    useAutoTarget = false;   //change to actual mouse movement
    mouseIdleFrames = 0;
  } else {
    mouseIdleFrames++;
    if (mouseIdleFrames > IDLE_THRESHOLD) {
      useAutoTarget = true;  //auto
    }
  }
  lastMouseX = mouseX;
  lastMouseY = mouseY;

  //use perlin noise to change moving target
  noiseOffsetX += noiseSpeed;
  noiseOffsetY += noiseSpeed;

  let margin = 80;  //when auto moving, it should not go out of the margin, so here i gave a value to limit it inide the canva
  autoTargetX = map(noise(noiseOffsetX), 0, 1, margin, width  - margin);
  autoTargetY = map(noise(noiseOffsetY), 0, 1, margin, height - margin);

  // which target to choose
  let targetX = useAutoTarget ? autoTargetX : mouseX;
  let targetY = useAutoTarget ? autoTargetY : mouseY;

  deltaX = (targetX - centerX) * springing;
  deltaY = (targetY - centerY) * springing;
  accelX += deltaX;
  accelY += deltaY;

  centerX += accelX;
  centerY += accelY;

  accelX *= damping;
  accelY *= damping;


  organicConstant = 1 - (abs(accelX) + abs(accelY)) * 0.1;

  for (let i = 0; i < nodes; i++) {
    nodeX[i] = nodeStartX[i] + sin(angle[i]) * (accelX * 2);
    nodeY[i] = nodeStartY[i] + sin(angle[i]) * (accelY * 2);
    angle[i] += frequency[i];
  }
}

//full screen button
function setup_fullScreenButton() {
  my.fullScreenButton = createButton("Full Screen");
  my.fullScreenButton.mousePressed(fullScreen_action);
  my.fullScreenButton.style("font-size:42px");
}

function fullScreen_action() {
  my.fullScreenButton.remove();
  fullscreen(1);
  setTimeout(ui_present_window, 3000);
}

function ui_present_window() {
  resizeCanvas(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}