import * as THREE from 'three';

function createSparkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(255, 215, 64, 0.95)');
  gradient.addColorStop(0.65, 'rgba(255, 90, 0, 0.5)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

function createFountainStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Corona glow
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 240, 150, 0.95)');
  grad.addColorStop(0.55, 'rgba(255, 160, 20, 0.6)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  // 4-Point Sparkling Star Rays
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.moveTo(32, 4);
  ctx.lineTo(35, 29);
  ctx.lineTo(60, 32);
  ctx.lineTo(35, 35);
  ctx.lineTo(32, 60);
  ctx.lineTo(29, 35);
  ctx.lineTo(4, 32);
  ctx.lineTo(29, 29);
  ctx.closePath();
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.sparkTex = createSparkTexture();
    this.fountainTex = createFountainStarTexture();

    // Reusable active particle arrays
    this.activeSparks = [];
    this.activeExplosions = [];

    // 1. Dedicated High-Density Anar Flowerpot Particle System
    this.maxFountainSparks = 600;
    this.fountainParticles = [];
    this.fountainPositions = new Float32Array(this.maxFountainSparks * 3);
    this.fountainColors = new Float32Array(this.maxFountainSparks * 3);
    this.fountainGeo = new THREE.BufferGeometry();
    this.fountainGeo.setAttribute('position', new THREE.BufferAttribute(this.fountainPositions, 3));
    this.fountainGeo.setAttribute('color', new THREE.BufferAttribute(this.fountainColors, 3));

    this.fountainMat = new THREE.PointsMaterial({
      size: 0.55,
      map: this.fountainTex,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.fountainPoints = new THREE.Points(this.fountainGeo, this.fountainMat);
    this.fountainPoints.frustumCulled = false; // Never cull active sparkles!
    this.scene.add(this.fountainPoints);

    // 2. Stream Particle System (Rocket thrust, Chakri wheel)
    this.maxStreamSparks = 300;
    this.streamParticles = [];
    this.streamPositions = new Float32Array(this.maxStreamSparks * 3);
    this.streamColors = new Float32Array(this.maxStreamSparks * 3);
    this.streamGeo = new THREE.BufferGeometry();
    this.streamGeo.setAttribute('position', new THREE.BufferAttribute(this.streamPositions, 3));
    this.streamGeo.setAttribute('color', new THREE.BufferAttribute(this.streamColors, 3));

    this.streamMat = new THREE.PointsMaterial({
      size: 0.42,
      map: this.sparkTex,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streamPoints = new THREE.Points(this.streamGeo, this.streamMat);
    this.streamPoints.frustumCulled = false;
    this.scene.add(this.streamPoints);
  }

  // ==========================================
  // 1. FUSE SPARKS
  // ==========================================
  spawnFuseSparks(position) {
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 1.5 + 0.5;

      this.activeSparks.push({
        x: position.x,
        y: position.y,
        z: position.z,
        vx: Math.cos(angle) * speed,
        vy: Math.random() * 2.0 + 0.8,
        vz: Math.sin(angle) * speed,
        life: 1.0,
        decay: Math.random() * 2.5 + 2.5
      });
    }
  }

  // ==========================================
  // 2. DAZZLING ANAR / FLOWERPOT VOLCANIC FOUNTAIN
  // ==========================================
  spawnAnarFountainSparks(apexPos, intensity = 1.0) {
    // 16 to 24 sparkling stars per frame during eruption!
    const count = Math.floor((Math.random() * 8 + 16) * Math.min(intensity, 1.4));
    for (let i = 0; i < count; i++) {
      if (this.fountainParticles.length >= this.maxFountainSparks) break;

      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * 0.38 + 0.06;
      // High upward vertical launch (shoots 3.5 to 5.5 units high!)
      const speed = (Math.random() * 4.5 + 6.8) * Math.min(intensity, 1.35);

      const randColor = Math.random();
      let r = 1.0, g = 0.92, b = 0.2; // Royal Gold default
      if (randColor > 0.6) {
        // Diamond White Star
        r = 1.0; g = 1.0; b = 1.0;
      } else if (randColor < 0.2) {
        // Fiery Orange Gold
        r = 1.0; g = 0.55; b = 0.05;
      }

      this.fountainParticles.push({
        x: apexPos.x + (Math.random() - 0.5) * 0.1,
        y: apexPos.y + 0.05,
        z: apexPos.z + (Math.random() - 0.5) * 0.1,
        vx: Math.cos(angle) * spread * speed,
        vy: speed,
        vz: Math.sin(angle) * spread * speed,
        gravity: 10.8, // Graceful parabolic umbrella arch
        r: r,
        g: g,
        b: b,
        life: 1.0,
        decay: Math.random() * 1.1 + 0.85 // Lasts ~1.0s to complete its full arch!
      });
    }
  }

  // ==========================================
  // 3. ROCKET THRUST JET TRAIL
  // ==========================================
  spawnRocketThrust(position) {
    for (let i = 0; i < 3; i++) {
      if (this.streamParticles.length >= this.maxStreamSparks) break;
      const spread = 0.35;
      this.streamParticles.push({
        x: position.x + (Math.random() - 0.5) * 0.08,
        y: position.y - 0.1,
        z: position.z + (Math.random() - 0.5) * 0.08,
        vx: (Math.random() - 0.5) * spread,
        vy: -(Math.random() * 5.0 + 4.5),
        vz: (Math.random() - 0.5) * spread,
        r: 1.0,
        g: 0.65 + Math.random() * 0.3,
        b: 0.1,
        life: 1.0,
        decay: Math.random() * 4.0 + 3.5
      });
    }
  }

  // ==========================================
  // 4. CHAKRI CENTRIFUGAL SPRAY
  // ==========================================
  spawnChakriWheelSparks(centerPos, spinAngle) {
    for (let i = 0; i < 4; i++) {
      if (this.streamParticles.length >= this.maxStreamSparks) break;

      const offsetAngle = spinAngle + (i * (Math.PI / 2)) + (Math.random() - 0.5) * 0.3;
      const radius = 0.52;
      const originX = centerPos.x + Math.cos(offsetAngle) * radius;
      const originZ = centerPos.z + Math.sin(offsetAngle) * radius;

      const speed = Math.random() * 4.5 + 3.2;
      const tangentX = -Math.sin(offsetAngle) * speed + (Math.random() - 0.5) * 1.0;
      const tangentZ = Math.cos(offsetAngle) * speed + (Math.random() - 0.5) * 1.0;

      const isGreen = Math.random() > 0.45;
      this.streamParticles.push({
        x: originX,
        y: 0.12 + Math.random() * 0.1,
        z: originZ,
        vx: tangentX,
        vy: Math.random() * 0.9 + 0.25,
        vz: tangentZ,
        gravity: 3.8,
        r: isGreen ? 0.05 : 1.0,
        g: isGreen ? 0.98 : 0.85,
        b: isGreen ? 0.45 : 0.1,
        life: 1.0,
        decay: Math.random() * 3.5 + 2.5
      });
    }
  }

  // ==========================================
  // 5. LADI MINI FIRECRACKER POP
  // ==========================================
  spawnMiniLadiPop(position) {
    const sparkCount = 14;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3 + 0] = position.x;
      sparkPositions[i * 3 + 1] = position.y + 0.15;
      sparkPositions[i * 3 + 2] = position.z;

      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.3) * Math.PI;
      const speed = Math.random() * 3.5 + 1.2;

      sparkVelocities.push({
        vx: Math.cos(elevation) * Math.cos(angle) * speed,
        vy: Math.sin(elevation) * speed + 0.8,
        vz: Math.cos(elevation) * Math.sin(angle) * speed
      });
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xff3311,
      size: 0.3,
      map: this.sparkTex,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(sparkPoints);

    this.activeExplosions.push({
      sparkPoints,
      sparkPositions,
      sparkVelocities,
      sparkCount,
      sparkMat,
      ring: null,
      age: 0,
      maxAge: 0.45
    });
  }

  // ==========================================
  // 6. SKY FIREWORK (ROCKET DETONATION)
  // ==========================================
  triggerSkyFirework(position, primaryColor = 0xffd700) {
    const sparkCount = 85;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3 + 0] = position.x;
      sparkPositions[i * 3 + 1] = position.y;
      sparkPositions[i * 3 + 2] = position.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = Math.random() * 7.5 + 3.0;

      sparkVelocities.push({
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed
      });
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: primaryColor,
      size: 0.45,
      map: this.fountainTex,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(sparkPoints);

    this.activeExplosions.push({
      sparkPoints,
      sparkPositions,
      sparkVelocities,
      sparkCount,
      sparkMat,
      ring: null,
      age: 0,
      maxAge: 1.6,
      isSky: true
    });
  }

  // ==========================================
  // 7. GROUND EXPLOSION (LAXMI BOMB & GENERAL)
  // ==========================================
  triggerExplosion(position, primaryColor = 0xff3322, isBomb = false) {
    const sparkCount = isBomb ? 75 : 55;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3 + 0] = position.x;
      sparkPositions[i * 3 + 1] = position.y;
      sparkPositions[i * 3 + 2] = position.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = Math.random() * (isBomb ? 8.5 : 6.0) + 2.5;

      sparkVelocities.push({
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed + (isBomb ? 2.0 : 1.2),
        vz: Math.cos(phi) * speed
      });
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: primaryColor,
      size: isBomb ? 0.45 : 0.35,
      map: this.sparkTex,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    this.scene.add(sparkPoints);

    const ringGeo = new THREE.RingGeometry(0.1, 0.4, 20);
    const ringMat = new THREE.MeshBasicMaterial({
      color: isBomb ? 0xff5500 : 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(position.x, 0.05, position.z);
    this.scene.add(ring);

    this.activeExplosions.push({
      sparkPoints,
      sparkPositions,
      sparkVelocities,
      sparkCount,
      sparkMat,
      ring,
      age: 0,
      maxAge: isBomb ? 1.5 : 1.3
    });
  }

  // ==========================================
  // UPDATE LOOP
  // ==========================================
  update(delta) {
    // 1. Update fuse sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const s = this.activeSparks[i];
      s.x += s.vx * delta;
      s.y += s.vy * delta;
      s.z += s.vz * delta;
      s.vy -= 9.8 * delta;
      s.life -= s.decay * delta;

      if (s.life <= 0) {
        this.activeSparks.splice(i, 1);
      }
    }

    // 2. Update Anar Flowerpot Sparkling Fountain
    let activeFountainCount = 0;
    const fPos = this.fountainPositions;
    const fCol = this.fountainColors;

    for (let i = this.fountainParticles.length - 1; i >= 0; i--) {
      const p = this.fountainParticles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy -= p.gravity * delta;
      p.life -= p.decay * delta;

      // Bounce softly on table
      if (p.y <= 0.05 && p.vy < 0) {
        p.vy = -p.vy * 0.25;
        p.vx *= 0.6;
        p.vz *= 0.6;
        p.y = 0.05;
      }

      if (p.life <= 0) {
        this.fountainParticles.splice(i, 1);
        continue;
      }

      if (activeFountainCount < this.maxFountainSparks) {
        const idx = activeFountainCount * 3;
        fPos[idx + 0] = p.x;
        fPos[idx + 1] = p.y;
        fPos[idx + 2] = p.z;

        // Bright sparkling glitter
        const flicker = 0.85 + Math.sin(p.life * 28.0) * 0.15;
        const fade = Math.max(0, p.life) * flicker;
        fCol[idx + 0] = p.r * fade;
        fCol[idx + 1] = p.g * fade;
        fCol[idx + 2] = p.b * fade;

        activeFountainCount++;
      }
    }

    this.fountainGeo.setDrawRange(0, activeFountainCount);
    this.fountainGeo.attributes.position.needsUpdate = true;
    this.fountainGeo.attributes.color.needsUpdate = true;

    // 3. Update continuous stream particles (thrust, chakri)
    let activeStreamCount = 0;
    const sPos = this.streamPositions;
    const sCol = this.streamColors;

    for (let i = this.streamParticles.length - 1; i >= 0; i--) {
      const p = this.streamParticles[i];
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      if (p.gravity) {
        p.vy -= p.gravity * delta;
      }
      p.life -= p.decay * delta;

      if (p.life <= 0 || p.y < 0.02) {
        this.streamParticles.splice(i, 1);
        continue;
      }

      if (activeStreamCount < this.maxStreamSparks) {
        const idx = activeStreamCount * 3;
        sPos[idx + 0] = p.x;
        sPos[idx + 1] = p.y;
        sPos[idx + 2] = p.z;

        const fade = Math.max(0, p.life);
        sCol[idx + 0] = p.r * fade;
        sCol[idx + 1] = p.g * fade;
        sCol[idx + 2] = p.b * fade;

        activeStreamCount++;
      }
    }

    this.streamGeo.setDrawRange(0, activeStreamCount);
    this.streamGeo.attributes.position.needsUpdate = true;
    this.streamGeo.attributes.color.needsUpdate = true;

    // 4. Update individual explosions
    for (let eIdx = this.activeExplosions.length - 1; eIdx >= 0; eIdx--) {
      const exp = this.activeExplosions[eIdx];
      exp.age += delta;
      const progress = exp.age / exp.maxAge;

      const pArr = exp.sparkPositions;
      const vel = exp.sparkVelocities;

      for (let i = 0; i < exp.sparkCount; i++) {
        const v = vel[i];
        pArr[i * 3 + 0] += v.vx * delta;
        pArr[i * 3 + 1] += v.vy * delta;
        pArr[i * 3 + 2] += v.vz * delta;
        v.vy -= (exp.isSky ? 3.5 : 6.5) * delta;
      }
      exp.sparkPoints.geometry.attributes.position.needsUpdate = true;
      exp.sparkMat.opacity = Math.max(0, 1.0 - progress);

      if (exp.ring) {
        const scale = 1.0 + progress * 18.0;
        exp.ring.scale.set(scale, scale, 1.0);
        exp.ring.material.opacity = Math.max(0, (1.0 - progress) * 0.9);
      }

      if (exp.age >= exp.maxAge) {
        this.scene.remove(exp.sparkPoints);
        if (exp.ring) this.scene.remove(exp.ring);
        exp.sparkPoints.geometry.dispose();
        exp.sparkMat.dispose();
        if (exp.ring) {
          exp.ring.geometry.dispose();
          exp.ring.material.dispose();
        }
        this.activeExplosions.splice(eIdx, 1);
      }
    }
  }
}
