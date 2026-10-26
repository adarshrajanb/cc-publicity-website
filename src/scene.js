import * as THREE from 'three';

// Procedural Diwali Rangoli & Table Texture - generated once
function createDiwaliTableTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep maroon background
  const bgGrad = ctx.createRadialGradient(256, 256, 30, 256, 256, 256);
  bgGrad.addColorStop(0, '#380a14');
  bgGrad.addColorStop(0.6, '#22060c');
  bgGrad.addColorStop(1, '#0f0205');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Concentric Golden Rangoli Borders
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 235, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 140, 0, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 215, 0, Math.PI * 2);
  ctx.stroke();

  // Outer Rangoli Petals
  const outerPetals = 16;
  for (let i = 0; i < outerPetals; i++) {
    const angle = (i / outerPetals) * Math.PI * 2;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(angle);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 102, 0, 0.5)' : 'rgba(218, 165, 32, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 160, 16, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Inner Mandala Lotus Petals
  const innerPetals = 12;
  for (let i = 0; i < innerPetals; i++) {
    const angle = (i / innerPetals) * Math.PI * 2;
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(0, 180, 160, 0.65)';
    ctx.beginPath();
    ctx.ellipse(0, 95, 14, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Concentric Golden Rings framing the Center Cultural Council Emblem
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(256, 256, 68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 180, 0, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(256, 256, 75, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class WorldScene {
  constructor(container) {
    this.container = container;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0c0612);

    // 2. Camera - dynamically framed for portrait mobiles & desktop
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      60
    );
    this.baseCameraPos = new THREE.Vector3(0, 5.6, 8.2);
    this.cameraLookTarget = new THREE.Vector3(0, 0.5, 0.2);

    // Camera shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;

    // 3. Renderer - Mobile Optimized (NO heavy shadows, capped pixel ratio)
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'default'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.shadowMap.enabled = false;
    this.container.appendChild(this.renderer.domElement);

    // Initial camera framing
    this.updateCameraFraming();

    // Handle context loss gracefully
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('WebGL context lost, recovering...');
    }, false);

    // 4. Rotating Ground Platform Group
    this.tableGroup = new THREE.Group();
    this.scene.add(this.tableGroup);

    // 5. Lights & Environment
    this.initLights();
    this.initTable();
    this.initDiyas();
    this.initHangingLanterns();

    window.addEventListener('resize', () => this.updateCameraFraming());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateCameraFraming(), 100);
    });
  }

  initLights() {
    const ambient = new THREE.AmbientLight(0xffeedd, 1.6);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffcc88, 1.2);
    dirLight.position.set(-3, 8, 4);
    this.scene.add(dirLight);
  }

  initTable() {
    const tableTex = createDiwaliTableTexture();
    const tableMat = new THREE.MeshStandardMaterial({
      map: tableTex,
      roughness: 0.35,
      metalness: 0.15
    });

    const tableGeo = new THREE.CylinderGeometry(6.6, 6.8, 0.35, 32);
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.18;
    this.tableGroup.add(table);

    // Gold rim
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(6.65, 0.08, 8, 32), rimMat);
    rim.rotation.x = Math.PI / 2;
    this.tableGroup.add(rim);

    // Cultural Council NIT Trichy Emblem Overlay at Center of Rotating Platform!
    this.initCenterLogo();
  }

  initCenterLogo() {
    // 1. Center Base Disc matching deep maroon palette
    const discGeo = new THREE.CircleGeometry(1.35, 32);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x22050c,
      side: THREE.DoubleSide
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.015;
    this.tableGroup.add(disc);

    // 2. High-resolution Cultural Council Logo (Transparent background with radiant metallic gold artwork)
    const textureLoader = new THREE.TextureLoader();
    const logoTex = textureLoader.load('/cc-logo-gold.png');
    logoTex.anisotropy = 4;

    const logoMat = new THREE.MeshBasicMaterial({
      map: logoTex,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide
    });
    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), logoMat);
    logoMesh.rotation.x = -Math.PI / 2;
    logoMesh.position.y = 0.022; // Layered cleanly on top of the disc
    this.tableGroup.add(logoMesh);

    // 3. Concentric Golden Ornamental Rims framing the insignia
    const outerRingGeo = new THREE.RingGeometry(1.32, 1.39, 36);
    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.85,
      roughness: 0.25,
      side: THREE.DoubleSide
    });
    const outerRing = new THREE.Mesh(outerRingGeo, goldRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.025;
    this.tableGroup.add(outerRing);

    const innerRingGeo = new THREE.RingGeometry(1.23, 1.27, 36);
    const innerRing = new THREE.Mesh(innerRingGeo, goldRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.025;
    this.tableGroup.add(innerRing);
  }

  initDiyas() {
    const count = 14;
    const radius = 5.8;
    const diyaMat = new THREE.MeshStandardMaterial({ color: 0xd97724, roughness: 0.7 });

    this.diyaFlames = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;

      const diya = new THREE.Group();
      diya.position.set(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius);

      // Clay bowl
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.12, 0.12, 12), diyaMat);
      diya.add(bowl);

      // Flame container group for wiggling/swaying
      const flameGroup = new THREE.Group();
      flameGroup.position.set(0, 0.12, 0);

      // Outer glowing flame
      const flameOuterMat = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      const flameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 8), flameOuterMat);
      flameOuter.position.y = 0.11;
      flameGroup.add(flameOuter);

      // Inner incandescent core
      const flameInnerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const flameInner = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.13, 8), flameInnerMat);
      flameInner.position.y = 0.07;
      flameGroup.add(flameInner);

      diya.add(flameGroup);
      this.tableGroup.add(diya);

      this.diyaFlames.push({
        group: flameGroup,
        outer: flameOuter,
        phase: i * 0.75 + Math.random() * 2.0,
        speed: 8.0 + Math.random() * 4.0
      });
    }
  }

  initHangingLanterns() {
    const lanternColors = [0xff3366, 0xffbb00, 0x00ccaa, 0xff6600];
    const lanternPositions = [
      { x: -4.5, y: 4.5, z: -3.5 },
      { x: -1.8, y: 5.0, z: -4.5 },
      { x: 1.8, y: 5.0, z: -4.5 },
      { x: 4.5, y: 4.5, z: -3.5 }
    ];

    this.lanterns = [];

    lanternPositions.forEach((pos, idx) => {
      const color = lanternColors[idx % lanternColors.length];
      const lantern = new THREE.Group();
      lantern.position.set(pos.x, pos.y, pos.z);

      const coreMat = new THREE.MeshBasicMaterial({ color: color });
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), coreMat);
      lantern.add(core);

      const cord = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 2.5, 4),
        new THREE.MeshBasicMaterial({ color: 0xffd700 })
      );
      cord.position.y = 1.3;
      lantern.add(cord);

      this.scene.add(lantern);
      this.lanterns.push({ group: lantern, baseY: pos.y, phase: idx * 0.9 });
    });
  }

  triggerShake(intensity = 0.35, duration = 0.5) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  updateCameraFraming() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;

    const requiredHorizontalHalfWidth = 4.0;
    const requiredVerticalHalfHeight = 3.6;

    if (aspect < 1.0) {
      this.camera.fov = 55;
      const radV = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
      const radH = Math.atan(aspect * Math.tan(radV));

      const distH = requiredHorizontalHalfWidth / Math.tan(radH);
      const distV = requiredVerticalHalfHeight / Math.tan(radV);
      const dist = Math.max(distH, distV, 9.5);

      const targetY = dist * 0.62;
      const targetZ = dist * 0.82;

      this.baseCameraPos.set(0, targetY, targetZ);
      this.cameraLookTarget.set(0, 0.35, 0.1);
    } else {
      this.camera.fov = 45;
      this.baseCameraPos.set(0, 5.4, 8.2);
      this.cameraLookTarget.set(0, 0.5, 0.2);
    }

    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.cameraLookTarget);
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  }

  update(delta) {
    // 1. Slow & majestic ground platform rotation
    if (this.tableGroup) {
      this.tableGroup.rotation.y += 0.045 * delta;
    }

    // 2. Diya lamp flames wiggle and dance in the festive breeze
    const now = performance.now() * 0.001;
    if (this.diyaFlames) {
      this.diyaFlames.forEach(f => {
        const swayZ = Math.sin(now * f.speed + f.phase) * 0.18 + Math.sin(now * (f.speed * 1.7) + f.phase) * 0.06;
        const swayX = Math.cos(now * (f.speed * 0.8) + f.phase) * 0.12;
        f.group.rotation.z = swayZ;
        f.group.rotation.x = swayX;

        const scaleY = 1.0 + Math.sin(now * (f.speed * 1.5) + f.phase) * 0.16;
        const scaleXZ = 1.0 + Math.cos(now * f.speed + f.phase) * 0.09;
        f.group.scale.set(scaleXZ, scaleY, scaleXZ);
      });
    }

    // 3. Camera shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= delta;
      const progress = this.shakeTimer / this.shakeDuration;
      const curIntensity = this.shakeIntensity * progress;

      this.camera.position.x = this.baseCameraPos.x + (Math.random() - 0.5) * curIntensity;
      this.camera.position.y = this.baseCameraPos.y + (Math.random() - 0.5) * curIntensity;
      this.camera.position.z = this.baseCameraPos.z + (Math.random() - 0.5) * curIntensity;
      this.camera.lookAt(this.cameraLookTarget);
    } else {
      this.camera.position.copy(this.baseCameraPos);
      this.camera.lookAt(this.cameraLookTarget);
    }

    // 4. Hanging lanterns sway
    const lanternTime = performance.now() * 0.0015;
    if (this.lanterns) {
      this.lanterns.forEach(l => {
        l.group.rotation.z = Math.sin(lanternTime + l.phase) * 0.06;
      });
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
