import * as THREE from 'three';
import { soundEngine } from './audio.js';

export class Candle {
  constructor(scene, camera, domElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    this.group = new THREE.Group();
    this.targetPos = new THREE.Vector3(0, 0, 3.2);
    this.currentPos = this.targetPos.clone();
    this.velocity = new THREE.Vector3();
    this.isDragging = false;
    this.canDrag = true;
    this.isLocked = false;

    // Fading state
    this.isFading = false;
    this.fadeOpacity = 1.0;

    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.planeIntersect = new THREE.Vector3();

    this.time = 0;
    this.nearCracker = null;

    this.initModel();
    this.initEvents();

    this.scene.add(this.group);
  }

  initModel() {
    this.materials = [];

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xffcc33,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: 1.0
    });
    this.materials.push(brassMat);

    // Brass base plate
    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.85, 0.12, 16),
      brassMat
    );
    basePlate.position.y = 0.06;
    this.group.add(basePlate);

    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 0.3, 16),
      brassMat
    );
    collar.position.y = 0.25;
    this.group.add(collar);

    // Candle Wax Stick
    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xd62828,
      roughness: 0.4,
      transparent: true,
      opacity: 1.0
    });
    this.materials.push(waxMat);

    const candleStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.24, 1.6, 16),
      waxMat
    );
    candleStick.position.y = 1.05;
    this.group.add(candleStick);

    // Wick
    const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 1.0 });
    this.materials.push(wickMat);
    const wick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6),
      wickMat
    );
    wick.position.set(0, 1.9, 0);
    this.group.add(wick);

    // Flame Group
    this.flameGroup = new THREE.Group();
    this.flameGroup.position.set(0, 2.05, 0);

    const innerMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 });
    this.materials.push(innerMat);
    const innerCone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 10), innerMat);
    innerCone.position.y = 0.15;
    this.flameGroup.add(innerCone);

    this.flameOuterMat = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.materials.push(this.flameOuterMat);
    this.flameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 10), this.flameOuterMat);
    this.flameOuter.position.y = 0.22;
    this.flameGroup.add(this.flameOuter);

    this.group.add(this.flameGroup);

    // Ground Target Ring
    const ringGeo = new THREE.RingGeometry(0.85, 1.0, 24);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    this.materials.push(this.ringMat);

    this.targetRing = new THREE.Mesh(ringGeo, this.ringMat);
    this.targetRing.rotation.x = -Math.PI / 2;
    this.targetRing.position.y = 0.02;
    this.group.add(this.targetRing);

    this.group.position.copy(this.currentPos);
  }

  initEvents() {
    const getPointerPos = (e) => {
      const rect = this.domElement.getBoundingClientRect();
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      return {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1
      };
    };

    const onPointerDown = (e) => {
      if (!this.canDrag || this.isLocked || this.isFading) return;
      const p = getPointerPos(e);
      this.mouse.set(p.x, p.y);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hit = this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersect);

      const dist = hit ? Math.hypot(hit.x - this.currentPos.x, hit.z - this.currentPos.z) : 999;
      if (dist < 2.8) {
        this.isDragging = true;
        this.domElement.style.cursor = 'grabbing';
        soundEngine.init();
        soundEngine.playWhoosh(0.7);
        this.ringMat.opacity = 0.85;
      }
    };

    const onPointerMove = (e) => {
      if (this.isLocked || this.isFading) return;
      const p = getPointerPos(e);
      this.mouse.set(p.x, p.y);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hit = this.raycaster.ray.intersectPlane(this.dragPlane, this.planeIntersect);

      if (!this.isDragging) {
        const dist = hit ? Math.hypot(hit.x - this.currentPos.x, hit.z - this.currentPos.z) : 999;
        if (dist < 2.5 && this.canDrag) {
          this.domElement.style.cursor = 'grab';
          this.ringMat.opacity = 0.75;
        } else {
          this.domElement.style.cursor = 'default';
          this.ringMat.opacity = 0.35;
        }
        return;
      }

      if (hit) {
        this.targetPos.x = Math.max(-5.5, Math.min(5.5, hit.x));
        this.targetPos.z = Math.max(-4.5, Math.min(4.8, hit.z));
      }
    };

    const onPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.domElement.style.cursor = 'grab';
      }
    };

    this.domElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    this.domElement.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
  }

  moveToPosition(x, z) {
    if (this.isLocked || this.isFading) return;
    this.targetPos.x = x;
    this.targetPos.z = z;
    soundEngine.playWhoosh(0.8);
  }

  setDraggable(allowed) {
    this.canDrag = allowed;
    if (!allowed) {
      this.isDragging = false;
      this.domElement.style.cursor = 'default';
      this.ringMat.opacity = 0.15;
    }
  }

  fadeOut() {
    this.isFading = true;
    this.canDrag = false;
    this.isDragging = false;
    this.domElement.style.cursor = 'default';
  }

  setLockedState(locked) {
    this.isLocked = locked;
    this.canDrag = !locked;
    this.isDragging = false;
    if (locked) {
      this.group.visible = false; // Hide completely once claimed/locked
    } else {
      this.group.visible = true;
      this.group.scale.set(1, 1, 1);
      this.fadeOpacity = 1.0;
      this.isFading = false;
      this.materials.forEach(m => {
        m.opacity = 1.0;
      });
      this.flameOuterMat.opacity = 0.85;
      this.ringMat.opacity = 0.45;
    }
  }

  getFlameWorldPosition() {
    const pos = new THREE.Vector3();
    this.flameGroup.getWorldPosition(pos);
    pos.y += 0.25;
    return pos;
  }

  getCenterPosition() {
    return this.currentPos.clone();
  }

  setNearCracker(cracker) {
    this.nearCracker = cracker;
  }

  update(delta) {
    this.time += delta;

    // Smooth fading out after lighting a cracker
    if (this.isFading) {
      this.fadeOpacity = Math.max(0, this.fadeOpacity - delta * 2.2);
      this.currentPos.y -= 1.2 * delta; // Sinks below table
      this.group.scale.multiplyScalar(Math.max(0.01, 1.0 - delta * 1.8));

      this.materials.forEach(m => {
        m.opacity = this.fadeOpacity;
      });

      if (this.fadeOpacity <= 0) {
        this.group.visible = false;
        this.isFading = false;
      }
    }

    if (!this.group.visible) return;

    const targetY = this.isDragging ? 0.3 : 0;
    this.currentPos.y += (targetY - this.currentPos.y) * 12 * delta;

    const prevPos = this.currentPos.clone();
    this.currentPos.x += (this.targetPos.x - this.currentPos.x) * 15 * delta;
    this.currentPos.z += (this.targetPos.z - this.currentPos.z) * 15 * delta;

    this.velocity.subVectors(this.currentPos, prevPos).divideScalar(Math.max(delta, 0.001));
    this.group.position.copy(this.currentPos);

    let targetTiltX = Math.max(-0.25, Math.min(0.25, -this.velocity.z * 0.04));
    let targetTiltZ = Math.max(-0.25, Math.min(0.25, this.velocity.x * 0.04));

    if (this.nearCracker) {
      const dx = this.nearCracker.pos.x - this.currentPos.x;
      const dz = this.nearCracker.pos.z - this.currentPos.z;
      const angle = Math.atan2(dx, dz);
      targetTiltX += Math.cos(angle) * 0.22;
      targetTiltZ += Math.sin(angle) * 0.22;
    }

    this.group.rotation.x += (targetTiltX - this.group.rotation.x) * 10 * delta;
    this.group.rotation.z += (targetTiltZ - this.group.rotation.z) * 10 * delta;

    if (!this.isLocked && !this.isFading) {
      const scaleY = 1.0 + Math.sin(this.time * 16) * 0.08;
      this.flameOuter.scale.set(1.0, scaleY, 1.0);
    }
  }
}
