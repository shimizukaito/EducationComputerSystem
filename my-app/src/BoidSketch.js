// BoidSketch.js ── 捕食者に 5 秒のライフ、速度 2 倍、タイムアウトで消滅
import React, { useEffect } from "react";
import Sketch from "react-p5";

let boids = [];       // Boid 配列
let particles = [];   // パーティクル配列
let p5Instance = null;

/* -------------------- Boid クラス -------------------- */
class Boid {
  constructor(x, y, p) {
    this.p = p;
    this.position = p.createVector(x, y);
    this.velocity = p.createVector(1, 0)
      .rotate(p.random(p.TWO_PI))
      .mult(p.random(2, 4));
    this.acceleration = p.createVector();

    this.baseMaxSpeed = 3;
    this.maxSpeed = this.baseMaxSpeed;
    this.maxForce = 0.2;

    this.trail = [];
    this.trailLength = 10;

    /* 捕食者状態 */
    this.isPredator = false;
    this.isEaten = false;  // 自身が食べられた
    this.expired  = false; // ライフ切れで消滅
    this.lastHunt = p.millis(); // 最後に捕食した時刻
  }

  /* 画面端を反射 */
  edges() {
    const { width, height } = this.p;
    if (this.position.x > width  || this.position.x < 0) this.velocity.x *= -1;
    if (this.position.y > height || this.position.y < 0) this.velocity.y *= -1;
  }

  /* flocking（align / cohesion / separation） */
  align(boids) {
    const steer = this.p.createVector();
    const R = 50;
    let cnt = 0;
    for (const other of boids) {
      if (other !== this && this.p5dist(other) < R) {
        steer.add(other.velocity);
        cnt++;
      }
    }
    if (cnt) {
      steer.div(cnt).setMag(this.maxSpeed)
           .sub(this.velocity).limit(this.maxForce);
    }
    return steer;
  }
  cohesion(boids) {
    const steer = this.p.createVector();
    const R = 50;
    let cnt = 0;
    for (const other of boids) {
      if (other !== this && this.p5dist(other) < R) {
        steer.add(other.position);
        cnt++;
      }
    }
    if (cnt) {
      steer.div(cnt).sub(this.position)
           .setMag(this.maxSpeed)
           .sub(this.velocity).limit(this.maxForce);
    }
    return steer;
  }
  separation(boids) {
    const steer = this.p.createVector();
    const R = 30;
    let cnt = 0;
    for (const other of boids) {
      const d = this.p5dist(other);
      if (other !== this && d < R) {
        steer.add(
          this.p.createVector(this.position.x, this.position.y)
                 .sub(other.position)
                 .normalize()
                 .div(d)
        );
        cnt++;
      }
    }
    if (cnt) {
      steer.div(cnt).setMag(this.maxSpeed)
           .sub(this.velocity).limit(this.maxForce * 1.5);
    }
    return steer;
  }

  /* 捕食者から逃げる & 捕食された瞬間の処理 */
  escape(boids) {
    const steer = this.p.createVector();
    const dangerR = 100;
    let cnt = 0;
    for (const other of boids) {
      if (!other.isPredator) continue;
      const d = this.p5dist(other);
      if (d < dangerR) {
        steer.add(
          this.p.createVector(this.position.x, this.position.y)
                 .sub(other.position)
                 .normalize()
                 .div(d)
        );
        cnt++;

        /* ----- 捕食判定 ----- */
        if (d < 10 && !this.isPredator && !this.isEaten) {
          this.isEaten = true;
          other.lastHunt = this.p.millis(); // 捕食者のタイマーをリセット

          /* オレンジ色パーティクル */
          for (let i = 0; i < 20; i++) {
            particles.push(
              new Particle(
                this.position.x,
                this.position.y,
                this.p,
                this.p.color(255, 180, 0)
              )
            );
          }
        }
      }
    }
    if (cnt) {
      steer.div(cnt).setMag(this.maxSpeed * 1.5)
           .sub(this.velocity).limit(this.maxForce * 2);
      this.acceleration.add(steer);
    }
  }

  /* 捕食行動 */
  hunt(boids) {
    if (!this.isPredator) return;
    let closest = null, minD = Infinity;
    for (const other of boids) {
      if (other.isPredator || other.isEaten) continue;
      const d = this.p5dist(other);
      if (d < minD) { minD = d; closest = other; }
    }
    if (closest) {
      const desired = this.p.createVector(closest.position.x, closest.position.y)
                            .sub(this.position)
                            .setMag(this.maxSpeed);
      this.acceleration.add(desired.sub(this.velocity).limit(this.maxForce * 2));
    }
  }

  p5dist(other) { return this.position.dist(other.position); }

  flock(boids) {
    if (this.isPredator) { this.hunt(boids); return; }
    this.acceleration.add(this.align(boids));
    this.acceleration.add(this.cohesion(boids));
    this.acceleration.add(this.separation(boids));
    this.escape(boids);
  }

  update() {
    /* 捕食者の寿命管理（5 秒無捕食で消滅） */
    if (this.isPredator && this.p.millis() - this.lastHunt > 5000) {
      this.expired = true;
      /* 消滅エフェクトが欲しければここで生成しても良い */
    }

    this.position.add(this.velocity);
    this.velocity.add(this.acceleration).limit(this.maxSpeed);
    this.acceleration.mult(0);

    /* テール */
    this.trail.push(this.position.copy());
    if (this.trail.length > this.trailLength) this.trail.shift();
  }

  show() {
    const p = this.p;
    /* テール */
    p.noFill();
    p.stroke(this.isPredator ? p.color(255, 50, 50, 100)
                             : p.color(100, 100, 255, 100));
    p.beginShape();
    for (const pos of this.trail) p.vertex(pos.x, pos.y);
    p.endShape();

    /* 本体 */
    p.push();
    p.translate(this.position.x, this.position.y);
    p.rotate(this.velocity.heading());
    p.fill(this.isPredator ? p.color(255, 0, 0) : 255);
    p.stroke(255);
    p.beginShape();
    p.vertex(10, 0);
    p.vertex(-10, 5);
    p.vertex(-10, -5);
    p.endShape(p.CLOSE);
    p.pop();
  }
}

/* -------------------- Particle クラス -------------------- */
class Particle {
  constructor(x, y, p, col = p.color(255, 100, 100)) {
    this.p = p;
    this.pos = p.createVector(x, y);
    this.vel = p.constructor.Vector.random2D().mult(p.random(2, 5));
    this.life = 60;
    this.col = col;
  }
  update() { this.pos.add(this.vel); this.life--; }
  show() {
    this.p.noStroke();
    this.p.fill(this.col.levels[0], this.col.levels[1],
                this.col.levels[2], this.life * 4);
    this.p.ellipse(this.pos.x, this.pos.y, 5);
  }
  isDead() { return this.life <= 0; }
}

/* -------------------- React-p5 コンポーネント -------------------- */
const BoidSketch = ({ boidCount, triggerAddPredator }) => {

  /* p5 setup */
  const setup = (p, canvasParentRef) => {
    p.createCanvas(p.windowWidth, p.windowHeight).parent(canvasParentRef);
    p5Instance = p;
    boids = Array.from({ length: boidCount }, () =>
      new Boid(p.random(p.width), p.random(p.height), p)
    );
  };

  /* p5 draw */
  const draw = p => {
    p.background(0);

    /* Boid 更新（捕食された／寿命切れ個体を除外） */
    boids = boids.filter(b => !b.expired && !(b.isEaten && !b.isPredator));
    for (const boid of boids) {
      boid.edges();
      boid.flock(boids);
      boid.update();
      boid.show();
    }

    /* パーティクル更新 */
    particles = particles.filter(pt => {
      pt.update();
      pt.show();
      return !pt.isDead();
    });
  };

  /* Boid 数の増減に対応 */
  useEffect(() => {
    if (!p5Instance) return;
    const diff = boidCount - boids.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        boids.push(
          new Boid(
            p5Instance.random(p5Instance.width),
            p5Instance.random(p5Instance.height),
            p5Instance
          )
        );
      }
    } else if (diff < 0) {
      boids.splice(diff); // diff は負
    }
  }, [boidCount]);

  /* 捕食者追加トリガ */
  useEffect(() => {
    if (!boids.length) return;
    const candidates = boids.filter(b => !b.isPredator);
    if (!candidates.length) return;

    const predator = candidates[Math.floor(Math.random() * candidates.length)];
    predator.isPredator = true;
    predator.maxSpeed = predator.baseMaxSpeed * 2;    // 速度 2 倍
    predator.lastHunt = p5Instance.millis();         // 寿命カウント開始

    /* 捕食者誕生エフェクト（赤） */
    for (let i = 0; i < 30; i++) {
      particles.push(
        new Particle(predator.position.x, predator.position.y, p5Instance)
      );
    }
  }, [triggerAddPredator]);

  return <Sketch setup={setup} draw={draw} />;
};

export default BoidSketch;
