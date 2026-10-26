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

function createSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(220, 220, 220, 0.6)');
  gradient.addColorStop(0.5, 'rgba(180, 180, 180, 0.3)');
  gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.sparkTex = createSparkTexture();
    this.smokeTex = createSmokeTexture();

    // Reusable active particle arrays
    this.activeSparks = [];
    this.activeExplosions = [];
    this.activeFountainSparks = [];
    this.activeSmokePuffs = [];

    // Pooled points mesh for continuous sparks (fountain, thrust, chakri)
    this.maxStreamSparks = 240;
    this.streamPositions = new Float32Array(this.maxStreamSparks * 3);
    this.streamColors = new Float32Array(this.maxStreamSparks * 3);
    this.streamGeo = new THREE.BufferGeometry();
    this.streamGeo.setAttribute('position', new THREE.BufferAttribute(this.streamPositions, 3));
    this.streamGeo.setAttribute('color', new THREE.BufferAttribute(this.streamColors, 3));

    this.streamMat = new THREE.PointsMaterial({
      size: 0.38,
      map: this.sparkTex,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.streamPoints = new THREE.Points(this.streamGeo, this.streamMat);
    this.scene.add(this.streamPoints);

    this.streamParticles = [];
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
  // 2. ROCKET THRUST JET TRAIL
  // ==========================================
  spawnRocketThrust(position) {
    // 3 high-speed downward flame sparks per frame
    for (let i = 0; i < 3; i++) {
      if (this.streamParticles.length >= this.maxStreamSparks) break;
      const spread = 0.35;
      this.streamParticles.push({
        x: position.x + (Math.random() - 0.5) * 0.08,
        y: position.y - 0.1,
        z: position.z + (Math.random() - 0.5) * 0.08,
        vx: (Math.random() - 0.5) * spread,
        vy: -(Math.random() * 4.5 + 4.0), // Fast downward jet
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
  // 3. ANAR / FLOWERPOT VOLCANIC FOUNTAIN
  // ==========================================
  spawnAnarFountainSparks(apexPos, intensity = 1.0) {
    // 6-8 towering parabolic fountain sparks per tick
    const count = Math.floor(6 * intensity);
    for (let i = 0; i < count; i++) {
      if (this.streamParticles.length >= this.maxStreamSparks) break;

      // Conical upward ejection
      const angle = Math.random() * Math.PI * 2;
      const coneSpread = Math.random() * 0.32 + 0.05;
      const speed = (Math.random() * 3.5 + 4.8) * Math.min(intensity, 1.3);

      const isWhiteGold = Math.random() > 0.4;
      this.streamParticles.push({
        x: apexPos.x + (Math.random() - 0.5) * 0.08,
        y: apexPos.y + 0.05,
        z: apexPos.z + (Math.random() - 0.5) * 0.08,
        vx: Math.cos(angle) * coneSpread * speed,
        vy: Math.sin(Math.acos(coneSpread)) * speed, // Upward velocity
        vz: Math.sin(angle) * coneSpread * speed,
        gravity: 8.8, // Parabolic arch
        r: isWhiteGold ? 1.0 : 1.0,
        g: isWhiteGold ? 0.95 : 0.7,
        b: isWhiteGold ? 0.6 : 0.05,
        life: 1.0,
        decay: Math.random() * 1.6 + 1.2
      });
    }
  }

  // ==========================================
  // 4. CHAKRI CENTRIFUGAL SPRAY
  // ==========================================
  spawnChakriWheelSparks(centerPos, spinAngle) {
    // 4 tangential sparks shooting along the ground
    for (let i = 0; i < 4; i++) {
      if (this.streamParticles.length >= this.maxStreamSparks) break;

      const offsetAngle = spinAngle + (i * (Math.PI / 2)) + (Math.random() - 0.5) * 0.3;
      const radius = 0.5;
      const originX = centerPos.x + Math.cos(offsetAngle) * radius;
      const originZ = centerPos.z + Math.sin(offsetAngle) * radius;

      // Tangent velocity + radial kick
      const speed = Math.random() * 4.0 + 3.0;
      const tangentX = -Math.sin(offsetAngle) * speed + (Math.random() - 0.5) * 1.0;
      const tangentZ = Math.cos(offsetAngle) * speed + (Math.random() - 0.5) * 1.0;

      // Vibrant festive colors: Emerald green or royal gold
      const isGreen = Math.random() > 0.5;

      this.streamParticles.push({
        x: originX,
        y: 0.12 + Math.random() * 0.1,
        z: originZ,
        vx: tangentX,
        vy: Math.random() * 0.9 + 0.2,
        vz: tangentZ,
        gravity: 3.5,
        r: isGreen ? 0.1 : 1.0,
        g: isGreen ? 0.95 : 0.8,
        b: isGreen ? 0.4 : 0.1,
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
      size: 0.28,
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
    // 80 glittering stars in sky
    const sparkCount = 80;
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
      size: 0.42,
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

    // Expanding shockwave ring on table
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

    // 2. Update continuous stream particles (fountain, thrust, chakri)
    let activeStreamCount = 0;
    const pos = this.streamPositions;
    const col = this.streamColors;

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
        pos[idx + 0] = p.x;
        pos[idx + 1] = p.y;
        pos[idx + 2] = p.z;

        const fade = Math.max(0, p.life);
        col[idx + 0] = p.r * fade;
        col[idx + 1] = p.g * fade;
        col[idx + 2] = p.b * fade;

        activeStreamCount++;
      }
    }

    // Zero out unused slots to hide them
    for (let i = activeStreamCount; i < this.maxStreamSparks; i++) {
      const idx = i * 3;
      pos[idx + 1] = -9999;
    }

    this.streamGeo.attributes.position.needsUpdate = true;
    this.streamGeo.attributes.color.needsUpdate = true;

    // 3. Update explosions
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
