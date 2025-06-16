import React, { useEffect } from "react";
import Sketch from "react-p5";

let particles = [];

function Particle(x, y, p) {
  this.x = x;
  this.y = y;
  this.vx = p.random(-1, 1);
  this.vy = p.random(-1, 1);

  this.update = function () {
    this.x += this.vx;
    this.y += this.vy;
  };

  this.show = function (p) {
    p.noStroke();
    p.fill(255);
    p.ellipse(this.x, this.y, 10, 10);
  };
}

const ParticleSketch = ({ particleCount }) => {
  const setup = (p, canvasParentRef) => {
    p.createCanvas(400, 400).parent(canvasParentRef);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(p.random(p.width), p.random(p.height), p));
    }
  };

  const draw = (p) => {
    p.background(0);
    for (let particle of particles) {
      particle.update();
      particle.show(p);
    }
  };

  // particleCountが変化したら反映
  useEffect(() => {
    const diff = particleCount - particles.length;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        particles.push(new Particle(Math.random() * 400, Math.random() * 400, {
          random: Math.random,
        }));
      }
    }
  }, [particleCount]);

  return <Sketch setup={setup} draw={draw} />;
};

export default ParticleSketch;
