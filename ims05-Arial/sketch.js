// Source: https://p5js.org/examples/math-and-physics-soft-body/
// Created by Ira Greenberg. Revised by Darren Kessner. From 2024 onwards, edited and maintained by p5.js Contributors and Processing Foundation. Licensed under CC BY-NC-SA 4.0.

// Stars are repelled by body and hand keypoints.
// When two hands face each other, all stars gather into a ball between the palms.
// Repulsion is disabled during ball mode so stars can freely enter the ball.

//https://editor.p5js.org/rh3900/sketches/25k0XH6sn
//Ruijia Hu Arial

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20]
];

let video;
let bodyPose;
let handPose;
let poses = [];
let hands = [];
let repulsePoints = [];
let ballConstraint = null;


function modelReady() {
  bodyPose.detectStart(video, (results) => { poses = results; });
}

function handModelReady() {
  handPose.detectStart(video, (results) => { hands = results; });
}


// rebuilds repulsePoints every frame from both body and hand keypoints
//AI Claude
function updateRepulsePoints() {
  repulsePoints = [];

  let scaleX = width / video.width;
  let scaleY = height / video.height;

  if (poses && poses.length > 0) {
    for (let kp of poses[0].keypoints) {
      if (kp.confidence > 0.3) {
        repulsePoints.push({
          cx: (video.width - kp.x) * scaleX,
          cy: kp.y * scaleY,
        });
      }
    }
  }

  for (let hand of hands) {
    for (let kp of hand.keypoints) {
      repulsePoints.push({
        cx: (video.width - kp.x) * scaleX,
        cy: kp.y * scaleY,
      });
    }
  }
}


// checks if two hands are close enough to trigger the ball effect
//AI Claude
function updateBallConstraint() {
  ballConstraint = null;
  if (hands.length < 2) return;

  let scaleX = width / video.width;
  let scaleY = height / video.height;

  let w0 = hands[0].keypoints[0];
  let w1 = hands[1].keypoints[0];

  let x0 = (video.width - w0.x) * scaleX;
  let y0 = w0.y * scaleY;
  let x1 = (video.width - w1.x) * scaleX;
  let y1 = w1.y * scaleY;

  let d = dist(x0, y0, x1, y1);

  if (d > 80 && d < 350) {
    ballConstraint = {
      x: (x0 + x1) / 2,
      y: (y0 + y1) / 2,
      r: d * 0.3,
    };
  }
}


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

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  bodyPose = ml5.bodyPose("MoveNet", { flipped: false }, modelReady);
  handPose = ml5.handPose({ flipped: false }, handModelReady);
}


function draw() {
  let h = hour();
  let bgB = map(h, 0, 23, 5, 20);
  background(240, 30, bgB, 50);

  updateRepulsePoints();
  updateBallConstraint();

  // ── spawn cycle ───────────────────────────────────────────
  let elapsed = (millis() - cycleStart) / 1000;
  let resetTime = MAX_STARS * INTERVAL + INTERVAL;

  if (elapsed >= resetTime) {
    miniStars = [];
    cycleStart = millis();
    elapsed = 0;
  }

  let needed = min(floor(elapsed / INTERVAL), MAX_STARS);
  while (miniStars.length < needed) {
    miniStars.push(
      new Star(
        random(100, width - 100),
        random(100, height - 100),
        random(15, 30),
        true
      )
    );
  }

  // ── main star ─────────────────────────────────────────────
  let mainTarget;
  if (ballConstraint) {
    mainTarget = mainStar.getWanderTarget(ballConstraint);
  } else {
    mainTarget = mainStar.getWanderTarget();
  }
  mainStar.update(mainTarget.x, mainTarget.y);
  mainStar.draw();

  // ── mini stars ────────────────────────────────────────────
  for (let s of miniStars) {
    let t;
    if (ballConstraint) {
      t = s.getWanderTarget(ballConstraint);
    } else {
      t = s.getWanderTarget();
    }
    s.update(t.x, t.y);
    s.draw();
  }

  // ── skeleton overlay ──────────────────────────────────────
  colorMode(RGB);
  noFill();

  // body skeleton
  if (poses.length > 0) {
    let pose = poses[0];
    let connections = bodyPose.getSkeleton();
    let scaleX = width / video.width;
    let scaleY = height / video.height;

    stroke(255, 255, 255, 80);
    strokeWeight(2);
    for (let c of connections) {
      let kpA = pose.keypoints[c[0]];
      let kpB = pose.keypoints[c[1]];
      if (kpA.confidence > 0.3 && kpB.confidence > 0.3) {
        line(
          (video.width - kpA.x) * scaleX, kpA.y * scaleY,
          (video.width - kpB.x) * scaleX, kpB.y * scaleY
        );
      }
    }

    noStroke();
    for (let kp of pose.keypoints) {
      if (kp.confidence > 0.3) {
        fill(255, 255, 255, 120);
        circle((video.width - kp.x) * scaleX, kp.y * scaleY, 6);
      }
    }
  }

  // hand skeleton
  if (hands.length > 0) {
    let scaleX = width / video.width;
    let scaleY = height / video.height;

    for (let hand of hands) {
      stroke(255, 200, 100, 120);
      strokeWeight(2);
      for (let [a, b] of HAND_CONNECTIONS) {
        let kpA = hand.keypoints[a];
        let kpB = hand.keypoints[b];
        if (kpA && kpB) {
          line(
            (video.width - kpA.x) * scaleX, kpA.y * scaleY,
            (video.width - kpB.x) * scaleX, kpB.y * scaleY
          );
        }
      }

      noStroke();
      for (let kp of hand.keypoints) {
        fill(255, 200, 100, 160);
        circle((video.width - kp.x) * scaleX, kp.y * scaleY, 5);
      }
    }
  }

  // ball zone indicator
  if (ballConstraint) {
    noFill();
    stroke(255, 255, 255, 30);
    strokeWeight(1);
    circle(ballConstraint.x, ballConstraint.y, ballConstraint.r * 2);
  }

  noStroke();

  // ── debug text ────────────────────────────────────────────
  fill(255, 120);
  textSize(13);

  text("mini stars: " + miniStars.length + " / " + MAX_STARS, 16, 22);

  let inPause = miniStars.length >= MAX_STARS;
  if (inPause) {
    text("resetting in: " + ceil(resetTime - elapsed) + "s", 16, 40);
  } else {
    text("next in: " + (INTERVAL - floor(elapsed) % INTERVAL) + "s", 16, 40);
  }

  text("hour: " + hour() + "  min: " + minute(), 16, 58);
  text("repulse pts: " + repulsePoints.length, 16, 76);

  if (ballConstraint) {
    text("ball active  r=" + ceil(ballConstraint.r), 16, 94);
  } else {
    text("hands: " + hands.length, 16, 94);
  }

  colorMode(HSB, 360, 100, 100, 100);
}


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
    cycleStart = millis() - MAX_STARS * INTERVAL * 1000;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// ── Star class ────────────────────────────────────────────────────────────────
// Modified from the original p5.js soft body example

class Star {
  constructor(x, y, r = 45, isMini = false) {
    this.centerX = x;
    this.centerY = y;
    this.baseRadius = r;
    this.radius = r;
    this.isMini = isMini;

    this.rotAngle = -90;
    this.accelX = 0;
    this.accelY = 0;

    this.nodes = 5;
    this.nodeStartX = new Array(5).fill(0);
    this.nodeStartY = new Array(5).fill(0);
    this.nodeX = new Array(5).fill(0);
    this.nodeY = new Array(5).fill(0);
    this.angle = new Array(5).fill(0);

    this.frequency = Array.from({ length: 5 }, () => random(5, 12));
    this.organicConstant = 1.0;

    this.springing = isMini ? random(0.0005, 0.0015) : 0.0009;
    this.damping = 0.98;

    this.noiseOffsetX = random(10000);
    this.noiseOffsetY = random(10000);
    this.noiseSpeed = isMini ? random(0.002, 0.007) : 0.004;

    if (isMini) {
      this.starColor = color(random(360), 80, 100);
    }
  }

  update(targetX, targetY) {
    if (this.isMini) {
      let breathe = map(minute() + second() / 60.0, 0, 60, 0.7, 1.3);
      this.radius = this.baseRadius * breathe;
    }

    this.rotAngle = -90;
    for (let i = 0; i < this.nodes; i++) {
      this.nodeStartX[i] = this.centerX + cos(this.rotAngle) * this.radius;
      this.nodeStartY[i] = this.centerY + sin(this.rotAngle) * this.radius;
      this.rotAngle += 360.0 / this.nodes;
    }

    // spring toward wander target
    let dx = (targetX - this.centerX) * this.springing;
    let dy = (targetY - this.centerY) * this.springing;
    this.accelX += dx;
    this.accelY += dy;

    // repulsion from body + hand keypoints
    // disabled during ball mode so stars can freely enter the ball
    //AI Claude
    if (!ballConstraint) {
      let repulseRadius = 120;
      let maxForce = 2.5;

      for (let kp of repulsePoints) {
        let d = dist(this.centerX, this.centerY, kp.cx, kp.cy);
        if (d < repulseRadius && d > 0) {
          let force = map(d, 0, repulseRadius, maxForce, 0);
          let a = atan2(this.centerY - kp.cy, this.centerX - kp.cx);
          this.accelX += cos(a) * force;
          this.accelY += sin(a) * force;
        }
      }
    }

    this.centerX += this.accelX;
    this.centerY += this.accelY;
    this.accelX *= this.damping;
    this.accelY *= this.damping;

    this.organicConstant = 1 - (abs(this.accelX) + abs(this.accelY)) * 0.1;

    for (let i = 0; i < this.nodes; i++) {
      this.nodeX[i] = this.nodeStartX[i] + sin(this.angle[i]) * (this.accelX * 2);
      this.nodeY[i] = this.nodeStartY[i] + sin(this.angle[i]) * (this.accelY * 2);
      this.angle[i] += this.frequency[i];
    }
  }

  // constraint is optional: { x, y, r } keeps the target inside a circle
  //AI Claude
  getWanderTarget(constraint = null) {
    this.noiseOffsetX += this.noiseSpeed;
    this.noiseOffsetY += this.noiseSpeed;

    if (constraint) {
      let a = map(noise(this.noiseOffsetX), 0, 1, 0, 360);
      let r = map(noise(this.noiseOffsetY), 0, 1, 0, constraint.r);
      return {
        x: constraint.x + cos(a) * r,
        y: constraint.y + sin(a) * r,
      };
    }

    let margin = 80;
    return {
      x: map(noise(this.noiseOffsetX), 0, 1, margin, width - margin),
      y: map(noise(this.noiseOffsetY), 0, 1, margin, height - margin),
    };
  }

  draw() {
    curveTightness(this.organicConstant);

    if (this.isMini) {
      fill(this.starColor);
    } else {
      fill(lerpColor(color('red'), color('yellow'), this.organicConstant));
    }

    beginShape();
    for (let i = 0; i < this.nodes; i++) {
      curveVertex(this.nodeX[i], this.nodeY[i]);
    }
    endShape(CLOSE);
  }
}