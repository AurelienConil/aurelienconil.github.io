class Agent {
  constructor(x, y, angle, length, color, i) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.length = length;
    this.color = color;
    this.targetX = x;
    this.targetY = y;
    this.targetAngle = angle;
    this.targetLength = length;
    this.targetColor = color;
    this.id = i;
    this.isInteraction = false
  }

  setTarget(x, y, angle, length) {
    this.targetX = x;
    this.targetY = y;
    this.targetAngle = angle;
    this.targetLength = length;

  }

  setTargetColor(x, y, angle, length, color) {
    this.color = color;
    this.setTarget(x, y, angle, length);

  }

  update(t) {

    //let isTarget = true;
    let isTarget = this.color > 0;
    if (mouseIsPressed) {
      isTarget = true;
    }

    if (t < 0.5) {
      isTarget = true
    }


    if (isTarget) {
      this.x += (this.targetX - this.x) * 0.001 * deltaTime;
      this.y += (this.targetY - this.y) * 0.001 * deltaTime;
      this.angle = lerp(this.angle, this.targetAngle, 0.05);
      this.length = lerp(this.length, this.targetLength, 0.05);
    } else {
      this.x += map(noise(this.id * 10, 0, t), 0, 1, -1, 1) * deltaTime * 0.1;
      this.y += map(noise(this.id * 10, 100, t), 0, 1, -1, 1) * deltaTime * 0.1;
    }


  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);
    fill(this.color);
    rect(0, 0, this.length, 5);
    pop();
  }

  displayShader() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    rectMode(CENTER);
    rect(0, 0, this.length, 10);
    pop();
  }



  applyRepulsion(mouseX, mouseY) {
    if (color > 0) {
      let d = dist(mouseX, mouseY, this.x, this.y);
      if (d < 30) {
        let angle = atan2(this.y - mouseY, this.x - mouseX);
        this.x += cos(angle) * 5;
        this.y += sin(angle) * 5;
        this.isInteraction = true;
      } else {
        this.isInteraction = false;
      }


    } else {
      let d = dist(mouseX, mouseY, this.targetX, this.targetY);
      if (d < 70) {
        this.x = lerp(this.x, this.targetX, 0.05);
        this.y = lerp(this.y, this.targetY, 0.05);
        this.isInteraction = true;
      } else {
        this.isInteraction = false;
      }

    }
  }
}