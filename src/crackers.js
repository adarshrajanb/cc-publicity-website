import * as THREE from 'three';

function createLaxmiBombTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c5e2d';
  ctx.fillRect(0, 0, 128, 128);

  // Golden criss-cross jute twine string
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(64, 0); ctx.lineTo(64, 128);
  ctx.moveTo(0, 64); ctx.lineTo(128, 64);
  ctx.stroke();

  // Red seal
  ctx.fillStyle = '#b71c1c';
  ctx.beginPath();
  ctx.arc(64, 64, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffea00';
  ctx.font = 'bold 15px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('卐 LAXMI', 64, 60);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('BOMB', 64, 75);

  return new THREE.CanvasTexture(canvas);
}

function createChakriTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b71c1c';
  ctx.fillRect(0, 0, 128, 128);

  const numRays = 12;
  for (let i = 0; i < numRays; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ffd700' : '#00897b';
    ctx.beginPath();
    ctx.moveTo(64, 64);
    const a1 = (i / numRays) * Math.PI * 2;
    const a2 = ((i + 1) / numRays) * Math.PI * 2;
    ctx.arc(64, 64, 60, a1, a2);
    ctx.fill();
  }

  ctx.fillStyle = '#ffb300';
  ctx.beginPath();
  ctx.arc(64, 64, 20, 0, Math.PI * 2);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

export class Cracker {
  constructor(config, scene) {
    this.id = config.id;
    this.name = config.name;
    this.subtitle = config.subtitle;
    this.type = config.type;
    this.baseColor = config.color || 0xff4422;
    this.pos = new THREE.Vector3(config.position.x, config.position.y, config.position.z);
    this.scene = scene;

    this.state = 'idle'; // 'idle', 'sizzling', 'performing', 'burst', 'locked', 'burnt'
    this.group = new THREE.Group();
    this.group.position.copy(this.pos);

    this.localFuseTip = new THREE.Vector3(0, 1.2, 0);
    this.sizzleTime = 0;
    this.sizzleDuration = 1.0;

    // Cracker performance state
    this.performTime = 0;
    this.performDuration = 1.0;
    this.spinAngle = 0;
    this.spinSpeed = 0;
    this.rocketSpeed = 0;
    this.nextPopTime = 0;
    this.popCount = 0;

    this.initModel();
    this.scene.add(this.group);
  }

  initModel() {
    switch (this.type) {
      case 'flowerpot':
        this.buildFlowerpot();
        break;
      case 'bomb':
        this.buildBomb();
        break;
      case 'chakri':
        this.buildChakri();
        break;
      case 'rocket':
        this.buildRocket();
        break;
      case 'ladi':
      default:
        this.buildLadi();
        break;
    }

    // Base Glow Halo
    const auraGeo = new THREE.RingGeometry(0.8, 0.95, 20);
    this.auraMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    this.auraRing = new THREE.Mesh(auraGeo, this.auraMat);
    this.auraRing.rotation.x = -Math.PI / 2;
    this.auraRing.position.y = 0.02;
    this.group.add(this.auraRing);
  }

  buildFlowerpot() {
    const potMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.7, roughness: 0.25 });
    this.potMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.65, 1.3, 16), potMat);
    this.potMesh.position.y = 0.65;
    this.group.add(this.potMesh);

    const foilMat = new THREE.MeshStandardMaterial({ color: 0xd81b60, roughness: 0.3 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.48, 0.22, 16), foilMat);
    band.position.y = 0.5;
    this.group.add(band);

    // Glowing nozzle rim at top
    const nozzleMat = new THREE.MeshBasicMaterial({ color: 0xffcc33 });
    this.nozzleRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 8, 16), nozzleMat);
    this.nozzleRim.rotation.x = Math.PI / 2;
    this.nozzleRim.position.y = 1.3;
    this.group.add(this.nozzleRim);

    this.buildFuse(new THREE.Vector3(0, 1.3, 0), 0.45, 0.1);
  }

  buildBomb() {
    const bombTex = createLaxmiBombTexture();
    const bombMat = new THREE.MeshStandardMaterial({ map: bombTex, roughness: 0.5 });
    this.bombBox = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 0.85), bombMat);
    this.bombBox.position.y = 0.35;
    this.group.add(this.bombBox);

    this.buildFuse(new THREE.Vector3(0, 0.7, 0), 0.5, 0.12);
  }

  buildChakri() {
    const chakriTex = createChakriTexture();
    const chakriMat = new THREE.MeshStandardMaterial({ map: chakriTex, roughness: 0.35 });
    this.discMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.16, 20), chakriMat);
    this.discMesh.position.y = 0.08;
    this.group.add(this.discMesh);

    const capMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.22, 12), capMat);
    cap.position.y = 0.15;
    this.group.add(cap);

    this.buildFuse(new THREE.Vector3(0.1, 0.22, 0), 0.45, 0.2);
  }

  buildRocket() {
    const stickMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 });
    this.rocketStick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), stickMat);
    this.rocketStick.position.set(-0.1, 0.8, 0);
    this.rocketStick.rotation.z = -0.1;
    this.group.add(this.rocketStick);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1565c0, metalness: 0.5, roughness: 0.3 });
    this.rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.9, 14), bodyMat);
    this.rocketBody.position.set(0.04, 1.1, 0);
    this.rocketBody.rotation.z = -0.1;
    this.group.add(this.rocketBody);

    const noseMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f });
    this.rocketNose = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 14), noseMat);
    this.rocketNose.position.set(0.1, 1.65, 0);
    this.rocketNose.rotation.z = -0.1;
    this.group.add(this.rocketNose);

    this.buildFuse(new THREE.Vector3(-0.02, 0.65, 0), 0.45, -0.15);
  }

  buildLadi() {
    const rollMat = new THREE.MeshStandardMaterial({ color: 0xc62828, roughness: 0.4 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });

    this.ladiCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 16), rollMat);
    this.ladiCoil.position.y = 0.13;
    this.group.add(this.ladiCoil);

    this.ladiStick = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.85, 10), rollMat);
    this.ladiStick.position.set(0, 0.6, 0);
    this.group.add(this.ladiStick);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 12), goldMat);
    band.position.y = 0.6;
    this.group.add(band);

    this.buildFuse(new THREE.Vector3(0, 1.0, 0), 0.5, 0.12);
  }

  buildFuse(startPos, height, curve) {
    const points = [];
    const segments = 6;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3(
        startPos.x + Math.sin(t * Math.PI) * curve,
        startPos.y + t * height,
        startPos.z + (t * 0.08)
      ));
    }

    const curvePath = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curvePath, 10, 0.025, 6, false);
    const fuseMat = new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.9 });

    this.fuseMesh = new THREE.Mesh(tubeGeo, fuseMat);
    this.group.add(this.fuseMesh);
    this.localFuseTip = points[points.length - 1].clone();
  }

  getFuseWorldPosition() {
    const tip = this.localFuseTip ? this.localFuseTip.clone() : new THREE.Vector3(0, 1.2, 0);
    this.group.localToWorld(tip);
    return tip;
  }

  getHorizontalDistance(pos) {
    return Math.hypot(this.pos.x - pos.x, this.pos.z - pos.z);
  }

  highlight(isHovered) {
    if (this.state !== 'idle') return;
    this.auraMat.opacity = isHovered ? 0.85 : 0.25;
    this.auraMat.color.setHex(isHovered ? 0xffcc00 : 0xff9900);
    this.auraRing.scale.setScalar(isHovered ? 1.2 : 1.0);
  }

  startSizzle() {
    if (this.state !== 'idle') return false;
    this.state = 'sizzling';
    this.sizzleTime = 0;
    this.auraMat.color.setHex(0xff3300);
    this.auraMat.opacity = 1.0;
    return true;
  }

  startPerformance() {
    this.state = 'performing';
    this.performTime = 0;

    // Hide burnt fuse
    if (this.fuseMesh) {
      this.fuseMesh.visible = false;
    }

    switch (this.type) {
      case 'rocket':
        this.performDuration = 0.95;
        this.rocketSpeed = 1.2;
        break;
      case 'flowerpot':
        this.performDuration = 2.4;
        break;
      case 'chakri':
        this.performDuration = 2.2;
        this.spinAngle = 0;
        this.spinSpeed = 6;
        break;
      case 'ladi':
        this.performDuration = 1.7;
        this.nextPopTime = 0.05;
        this.popCount = 0;
        break;
      case 'bomb':
      default:
        this.performDuration = 0.26; // Suspense pause before blast!
        break;
    }
  }

  lock() {
    if (this.state === 'idle') {
      this.state = 'locked';
      this.auraMat.opacity = 0.05;
      this.group.traverse(child => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone();
          child.material.color.multiplyScalar(0.4);
        }
      });
    }
  }

  setBurntState() {
    this.state = 'burnt';
    this.auraMat.opacity = 0;
    this.group.traverse(child => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.color.setHex(0x1a1a1a); // Ash black
      }
    });
  }

  burst() {
    this.state = 'burst';
    this.scene.remove(this.group);
  }

  // Called each frame from main animation loop
  update(delta, callbacks = {}) {
    // 1. Sizzling Phase (fuse sparks)
    if (this.state === 'sizzling') {
      this.sizzleTime += delta;
      const progress = Math.min(1.0, this.sizzleTime / this.sizzleDuration);

      if (callbacks.onSpark) {
        const sparkPos = this.getFuseWorldPosition();
        sparkPos.y -= progress * 0.15;
        callbacks.onSpark(sparkPos);
      }

      if (this.sizzleTime >= this.sizzleDuration) {
        return { phase: 'fuse_finished' };
      }
      return null;
    }

    // 2. Realistic Cracker Performance Phase
    if (this.state === 'performing') {
      this.performTime += delta;

      // ----------------------------------------
      // AAKASH GANGA ROCKET
      // ----------------------------------------
      if (this.type === 'rocket') {
        this.rocketSpeed += 19.0 * delta; // Accelerate upward!
        this.group.position.y += this.rocketSpeed * delta;

        // Slight flight wobble
        this.group.rotation.z = -0.1 + Math.sin(this.performTime * 35) * 0.04;
        this.group.rotation.x = Math.cos(this.performTime * 30) * 0.03;

        // Tail jet sparks
        if (callbacks.onRocketThrust) {
          const nozzlePos = this.group.position.clone().add(new THREE.Vector3(0, 0.4, 0));
          callbacks.onRocketThrust(nozzlePos);
        }

        // Sky apex reached!
        if (this.performTime >= this.performDuration || this.group.position.y >= 8.2) {
          const skyBurstPos = this.group.position.clone();
          this.burst();
          return {
            phase: 'performance_finished',
            action: 'rocket_sky_burst',
            position: skyBurstPos,
            color: 0x4fc3f7
          };
        }
        return null;
      }

      // ----------------------------------------
      // ROYAL GOLDEN ANAR / FLOWERPOT
      // ----------------------------------------
      if (this.type === 'flowerpot') {
        const progress = this.performTime / this.performDuration;

        // Intensity bell curve: swells quickly, sustains, then pops
        let intensity = 1.0;
        if (this.performTime < 0.4) {
          intensity = this.performTime / 0.4;
        } else if (progress > 0.85) {
          intensity = (1.0 - progress) / 0.15;
        }

        // Pot cone glows red-hot with intense heat
        if (this.potMesh && this.potMesh.material) {
          this.potMesh.material.emissive = new THREE.Color(0xff4400);
          this.potMesh.material.emissiveIntensity = 0.5 * intensity;
        }

        // Top nozzle spews towering golden fountain
        if (callbacks.onAnarFountain) {
          const apexPos = this.group.position.clone().add(new THREE.Vector3(0, 1.35, 0));
          callbacks.onAnarFountain(apexPos, Math.max(0.3, intensity * 1.25));
        }

        // Subtle vibration
        this.group.position.x = this.pos.x + Math.sin(this.performTime * 60) * 0.012;

        if (this.performTime >= this.performDuration) {
          this.setBurntState();
          return {
            phase: 'performance_finished',
            action: 'anar_shower_done',
            position: this.group.position.clone().add(new THREE.Vector3(0, 1.35, 0)),
            color: 0xffd700
          };
        }
        return null;
      }

      // ----------------------------------------
      // ZAMIN CHAKRI WHEEL
      // ----------------------------------------
      if (this.type === 'chakri') {
        // Accelerate spin speed
        this.spinSpeed = Math.min(48, this.spinSpeed + 35 * delta);
        this.spinAngle += this.spinSpeed * delta;

        if (this.discMesh) {
          this.discMesh.rotation.y = this.spinAngle;
        }

        // Small organic spiral drift on table
        const driftRadius = Math.sin((this.performTime / this.performDuration) * Math.PI) * 0.4;
        const driftAngle = this.performTime * 4.2;
        this.group.position.x = this.pos.x + Math.cos(driftAngle) * driftRadius;
        this.group.position.z = this.pos.z + Math.sin(driftAngle) * driftRadius;

        // Centrifugal tangential sparks
        if (callbacks.onChakriSparks) {
          callbacks.onChakriSparks(this.group.position, this.spinAngle);
        }

        if (this.performTime >= this.performDuration) {
          this.setBurntState();
          return {
            phase: 'performance_finished',
            action: 'chakri_done',
            position: this.group.position.clone(),
            color: 0x00e676
          };
        }
        return null;
      }

      // ----------------------------------------
      // 1000-WALA RED LADI
      // ----------------------------------------
      if (this.type === 'ladi') {
        if (this.performTime >= this.nextPopTime && this.popCount < 14) {
          const popOffset = new THREE.Vector3(
            (Math.random() - 0.5) * 0.65,
            0.15 + Math.random() * 0.35,
            (Math.random() - 0.5) * 0.65
          );
          const popPos = this.group.position.clone().add(popOffset);

          if (callbacks.onLadiPop) {
            callbacks.onLadiPop(popPos, this.popCount);
          }

          // Cracker jitter
          this.group.position.y = (Math.random() - 0.5) * 0.04;
          this.popCount++;
          this.nextPopTime += 0.08 + Math.random() * 0.07;
        }

        if (this.performTime >= this.performDuration) {
          this.setBurntState();
          return {
            phase: 'performance_finished',
            action: 'ladi_done',
            position: this.group.position.clone().add(new THREE.Vector3(0, 0.4, 0)),
            color: 0xd32f2f
          };
        }
        return null;
      }

      // ----------------------------------------
      // CLASSIC LAXMI BOMB
      // ----------------------------------------
      if (this.type === 'bomb') {
        // Dramatic 0.26s suspense pause after fuse disappears into green box
        if (this.performTime >= this.performDuration) {
          const blastPos = this.group.position.clone().add(new THREE.Vector3(0, 0.35, 0));
          this.burst();
          return {
            phase: 'performance_finished',
            action: 'bomb_blast',
            position: blastPos,
            color: 0x2e7d32
          };
        }
        return null;
      }
    }

    return null;
  }
}
