// Source: https://p5js.org/examples/math-and-physics-soft-body/
// Created by Ira Greenberg. Revised by Darren Kessner. From 2024 onwards, edited and maintained by p5.js Contributors and Processing Foundation. Licensed under CC BY-NC-SA 4.0.


// When a person is detected, stars will avoid the circular region around them.


//https://editor.p5js.org/rh3900/sketches/25k0XH6sn
//Ruijia Hu Arial

let video;
let bodyPose;
let poses = [];
let personCircle = null;  // stores the detected person as a circle  (cx, cy, r) 


function modelReady() {
  bodyPose.detectStart(video, (results) => { poses = results; });
}


// runs every frame to update the person's circle based on latest pose data
//AI Claude
function updatePersonCircle() {
  // if no poses detected, clear the circle and stop
  if (!poses || poses.length === 0) { personCircle = null; return; }

  let pose = poses[0];  // only track the first person detected

  // only use keypoints with high enough confidence to avoid jitter
  let validKps = pose.keypoints.filter(kp => kp.confidence > 0.3);
  if (validKps.length < 3) { personCircle = null; return; }

  // scale keypoint coordinates from video size to canvas size
  let scaleX = width / video.width;
  let scaleY = height / video.height;

  // mirror horizontally so the person's left/right matches the screen
  let xs = validKps.map(kp => (video.width - kp.x) * scaleX);
  let ys = validKps.map(kp => kp.y * scaleY);

  // circle center = average position of all valid keypoints
  let cx = xs.reduce((a, b) => a + b) / xs.length;
  let cy = ys.reduce((a, b) => a + b) / ys.length;

  // circle radius = distance to the furthest keypoint + some padding
  let pad = 40;
  let r = max(xs.map((x, i) => dist(x, ys[i], cx, cy))) + pad;

  personCircle = { cx, cy, r };
}

// returns a wander target for a star that stays outside the person circle.
// the star still uses its own Perlin noise path
// inside the circle, it gets pushed outward along the same direction.
//AI Claude
function getTargetAvoidingCircle(star, circle) {
  let t = star.getWanderTarget();

  let d = dist(t.x, t.y, circle.cx, circle.cy);
  if (d < circle.r) {
    // calculate the angle from circle center to the target point
    let angle = atan2(t.y - circle.cy, t.x - circle.cx);
    let push = 30;
    // move the target to just outside the circle edge in the same direction
    t.x = circle.cx + cos(angle) * (circle.r + push);
    t.y = circle.cy + sin(angle) * (circle.r + push);
  }

  return t;
}

//Main
let mainStar;
let miniStars = [];
let cycleStart = 0;  

const MAX_STARS = 500;  
const INTERVAL = 40;     

function setup() {
  colorMode(HSB, 360, 100, 100, 100); 
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  noStroke();

  mainStar = new Star(width / 2, height / 2, 45, false);
  cycleStart = millis();

  // start webcam capture (hidden, used only for pose detection)
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  bodyPose = ml5.bodyPose("MoveNet", { flipped: false }, modelReady);
}

function draw() {
  // background color shifts subtly based on hour, darker at night, slightly brighter midday. 
  let h = hour();
  let bgB = map(h, 0, 23, 5, 20);
  background(240, 30, bgB, 50);

  // refresh person detection each frame
  updatePersonCircle();

  // calculate how many seconds have passed since this cycle started
  let elapsed = (millis() - cycleStart) / 1000;

  // total cycle length: 500 stars × 40s each + one extra 40s pause before reset
  let resetTime = MAX_STARS * INTERVAL + INTERVAL;

  // once the full cycle is complete, clear all mini stars and restart
  if (elapsed >= resetTime) {
    miniStars = [];
    cycleStart = millis();
    elapsed = 0;
  }

  // add new mini stars one at a time as time passes
  let needed = min(floor(elapsed / INTERVAL), MAX_STARS);
  while (miniStars.length < needed) {
    miniStars.push(
      new Star(
        random(100, width - 100),
        random(100, height - 100),
        random(15, 30),  // each mini star gets a random size at birth
        true
      )
    );
  }

  
  // if a person is detected, avoid their circle; otherwise wander freely
  let mainTarget;
  if (personCircle) {
    mainTarget = getTargetAvoidingCircle(mainStar, personCircle);
  } else {
    mainTarget = mainStar.getWanderTarget();
  }
  mainStar.update(mainTarget.x, mainTarget.y);
  mainStar.draw();

  // update and draw each mini star
  for (let s of miniStars) {
    let t;
    if (personCircle) {
      t = getTargetAvoidingCircle(s, personCircle);
    } else {
      t = s.getWanderTarget();
    }
    s.update(t.x, t.y);
    s.draw();
  }

  //date detecting, including time and cycle and num of star
  colorMode(RGB);
  fill(255, 120);
  noStroke();
  textSize(13);

  text("mini stars: " + miniStars.length + " / " + MAX_STARS, 16, 22);

  let inPause = miniStars.length >= MAX_STARS;
  if (inPause) {
    text("resetting in: " + ceil(resetTime - elapsed) + "s", 16, 40);
  } else {
    text("next in: " + (INTERVAL - floor(elapsed) % INTERVAL) + "s", 16, 40);
  }

  text("hour: " + hour() + "  min: " + minute(), 16, 58);

  if (personCircle) {
    text("person detected", 16, 76);
  } else {
    text("no person", 16, 76);
  }

  colorMode(HSB, 360, 100, 100, 100);
}

// F = toggle fullscreen
// S = instantly fill all 500 stars (for testing pose detection)
function keyPressed() {
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
  }
  if (key === 's' || key === 'S') {
    while (miniStars.length < MAX_STARS) {
      miniStars.push(
        new Star(
          random(100, width - 100),
          random(100, height - 100),
          random(15, 30),
          true
        )
      );
    }
    // push cycleStart back so the timer thinks 500 intervals have already passed
    cycleStart = millis() - MAX_STARS * INTERVAL * 1000;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}



//This part is modified according to the original code for drawing stars
class Star {
  constructor(x, y, r = 45, isMini = false) {
    this.centerX = x;
    this.centerY = y;
    this.baseRadius = r;  // saved so breathing animation scales from the original size
    this.radius = r;
    this.isMini = isMini;

    this.rotAngle = -90;  // start at the top of the circle
    this.accelX = 0;
    this.accelY = 0;

    // all stars are 5-pointed
    this.nodes = 5;
    this.nodeStartX = new Array(5).fill(0);
    this.nodeStartY = new Array(5).fill(0);
    this.nodeX = new Array(5).fill(0);
    this.nodeY = new Array(5).fill(0);
    this.angle = new Array(5).fill(0);

    // each node oscillates at a different speed for the wobbly soft-body effect
    this.frequency = Array.from({ length: 5 }, () => random(5, 12));

    this.organicConstant = 1.0;  
    
    // mini stars spring faster/slower randomly; main star is fixed
    if (isMini) {
      this.springing = random(0.0005, 0.0015);
    } else {
      this.springing = 0.0009;
    }

    this.damping = 0.98;  // slows acceleration each frame so stars don't fly off

    // separate noise offsets per axis so X and Y move independently
    this.noiseOffsetX = random(10000);
    this.noiseOffsetY = random(10000);

    // mini stars wander at different speeds so they don't clump together
    if (isMini) {
      this.noiseSpeed = random(0.002, 0.007);
    } else {
      this.noiseSpeed = 0.004;
    }

    // each mini star gets a random hue at birth and keeps it forever
    if (isMini) {
      this.starColor = color(random(360), 80, 100);
    }
  }

  update(targetX, targetY) {
    // mini stars breathe in size based on minute() + second()
    // so the size cycles smoothly once per minute regardless of when the sketch started
    if (this.isMini) {
      let breathe = map(minute() + second() / 60.0, 0, 60, 0.7, 1.3);
      this.radius = this.baseRadius * breathe;
    }

    // recalculate the 5 base node positions around the current center
    this.rotAngle = -90;
    for (let i = 0; i < this.nodes; i++) {
      this.nodeStartX[i] = this.centerX + cos(this.rotAngle) * this.radius;
      this.nodeStartY[i] = this.centerY + sin(this.rotAngle) * this.radius;
      this.rotAngle += 360.0 / this.nodes;
    }

    // spring physics: pull center toward target, apply damping to slow it down
    let dx = (targetX - this.centerX) * this.springing;
    let dy = (targetY - this.centerY) * this.springing;
    this.accelX += dx;
    this.accelY += dy;
    this.centerX += this.accelX;
    this.centerY += this.accelY;
    this.accelX *= this.damping;
    this.accelY *= this.damping;

    // faster movement = more squishing (lower organicConstant = looser curves)
    this.organicConstant = 1 - (abs(this.accelX) + abs(this.accelY)) * 0.1;

    // each node wiggles independently based on its own angle and frequency
    for (let i = 0; i < this.nodes; i++) {
      this.nodeX[i] = this.nodeStartX[i] + sin(this.angle[i]) * (this.accelX * 2);
      this.nodeY[i] = this.nodeStartY[i] + sin(this.angle[i]) * (this.accelY * 2);
      this.angle[i] += this.frequency[i];
    }
  }

  // generates the next wander target using Perlin noise
  // noise() always returns smooth values so movement never feels random or jumpy
  getWanderTarget() {
    this.noiseOffsetX += this.noiseSpeed;
    this.noiseOffsetY += this.noiseSpeed;
    let margin = 80;  // keeps stars away from the very edge of the canvas
    return {
      x: map(noise(this.noiseOffsetX), 0, 1, margin, width - margin),
      y: map(noise(this.noiseOffsetY), 0, 1, margin, height - margin),
    };
  }

  draw() {
    curveTightness(this.organicConstant);

    // mini stars use their own fixed random color
    // main star shifts from red to yellow based on how fast it is moving
    if (this.isMini) {
      fill(this.starColor);
    } else {
      fill(lerpColor(color('red'), color('yellow'), this.organicConstant));
    }

    // draw a closed curved shape through all 5 node positions
    beginShape();
    for (let i = 0; i < this.nodes; i++) {
      curveVertex(this.nodeX[i], this.nodeY[i]);
    }
    endShape(CLOSE);
  }
}