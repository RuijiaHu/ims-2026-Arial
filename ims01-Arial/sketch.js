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
// My question: Why is springing set to such a small value (0.0009)? What happens if you make it larger?
// I tried to make the number bigger, and it turned out to be very exaggerated.
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

// Declare the variable for the curve tightness
let organicConstant = 1.0;

function setup() {
  createCanvas(710, 400);

  // Start in the center of the canvas
  // My comments: The star is going to start from the center of the canvas.
  centerX = width / 2;
  centerY = height / 2;

  // Initialize arrays to 0
  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = 0;
    nodeStartY[i] = 0;
    nodeX[i] = 0;
    nodeY[i] = 0;
    angle[i] = 0;
  }

  // Initialize frequencies for corner nodes
  for (let i = 0; i < nodes; i++) {
    frequency[i] = random(5, 12);
  }

  noStroke();
  angleMode(DEGREES);
}

function draw() {
  // Use alpha blending for fade effect
  // My comments: Making the lagging effect for the star. Some of his track will show behind but fading.
  background(0, 50);

  // Draw and move the shape
  // My comments: Call the functions that are created behind.
  drawShape();
  moveShape();
}

function drawShape() {
  // Calculate node starting locations
  // My comments:Place each node(5 in total) evenly around a circle.
  for (let i = 0; i < nodes; i++) {
    nodeStartX[i] = centerX + cos(rotAngle) * radius;
    nodeStartY[i] = centerY + sin(rotAngle) * radius;
    rotAngle += 360.0 / nodes;
  }

  // Draw the polygon
  curveTightness(organicConstant);
  // My comments: Let the color gradually changing from red to yellow and yellow to red, but depending on the stableness of the star, when it's fast, it turns more red, when its more stable, it turns more yellow.
  let shapeColor = lerpColor(color('red'), color('yellow'), organicConstant);
  fill(shapeColor);

  // My comments: Draw a margin for the star connecting the nodes.
  beginShape();
  for (let i = 0; i < nodes; i++) {
    curveVertex(nodeX[i], nodeY[i]);
  }
  endShape(CLOSE);
}

function moveShape() {
  // Move center point
  deltaX = mouseX - centerX;
  deltaY = mouseY - centerY;

  // Create springing effect
  deltaX *= springing;
  deltaY *= springing;
  accelX += deltaX;
  accelY += deltaY;

  // Move center
  // My comments: When mouse move to the other place, it's gonna chase it do accelaration
  centerX += accelX;
  centerY += accelY;

  // Slow down springing
  // My comments: When it's approching and getting close to the mouse position, its gonna slow down.
  accelX *= damping;
  accelY *= damping;

  // Change curve tightness based on the overall acceleration;
  // use abs() to avoid dependence on direction of acceleration
  // My comment: Detect the speed?
  // My quesiton: Why does the code use abs() when calculating organicConstant? What would go wrong without it?
  organicConstant = 1 - (abs(accelX) + abs(accelY)) * 0.1;

  // Move nodes
  // My comments: Offsets each node from its original even position using a sine wave. Each nodes has their own frequency, so they wobble independently when the star moving around.
  for (let i = 0; i < nodes; i++) {
    nodeX[i] = nodeStartX[i] + sin(angle[i]) * (accelX * 2);
    nodeY[i] = nodeStartY[i] + sin(angle[i]) * (accelY * 2);
    angle[i] += frequency[i];
  }
}