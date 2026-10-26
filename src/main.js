import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { WorldScene } from './scene.js';
import { Candle } from './candle.js';
import { Cracker } from './crackers.js';
import { ParticleSystem } from './particles.js';
import { soundEngine } from './audio.js';

// ==============================================================
// 🪔 GOOGLE FORMS REDIRECTION CONFIGURATION
// Replace anytime with official Cultural Council Google Form URL
// ==============================================================
export const GOOGLE_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScXQ_SAMPLE_TICKET_CLAIM/viewform';
const STORAGE_CLAIM_KEY = 'diwali_cracker_stunt_claim_v1';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.statusText = document.getElementById('status-text');
    this.instructionToast = document.getElementById('instruction-toast');
    this.rewardModal = document.getElementById('reward-modal');
    this.countdownVal = document.getElementById('countdown-val');
    this.claimTicketBtn = document.getElementById('claim-ticket-btn');
    this.pauseRedirectBtn = document.getElementById('pause-redirect-btn');
    this.backToScreenBtn = document.getElementById('back-to-screen-btn');
    this.closeModalXBtn = document.getElementById('close-modal-x-btn');
    this.claimedFloatingCard = document.getElementById('claimed-floating-card');
    this.viewTicketBannerBtn = document.getElementById('view-ticket-banner-btn');
    this.bannerTicketCode = document.getElementById('banner-ticket-code');

    this.scheduleBtn = document.getElementById('schedule-btn');
    this.scheduleModal = document.getElementById('schedule-modal');
    this.closeScheduleXBtn = document.getElementById('close-schedule-x-btn');
    this.closeScheduleBtn = document.getElementById('close-schedule-btn');

    this.settingsBtn = document.getElementById('settings-btn');
    this.settingsModal = document.getElementById('settings-modal');
    this.formUrlInput = document.getElementById('form-url-input');
    this.saveSettingsBtn = document.getElementById('save-settings-btn');
    this.cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    this.editFormLinkBtn = document.getElementById('edit-form-link-btn');

    this.soundBtn = document.getElementById('sound-btn');
    this.soundIcon = document.getElementById('sound-icon');
    this.soundText = document.getElementById('sound-text');

    this.clock = new THREE.Clock();
    this.hasBursted = false;
    this.activeCracker = null;

    this.countdownSeconds = 8;
    this.isRedirectPaused = false;
    this.countdownInterval = null;

    this.googleFormsUrl = localStorage.getItem('diwali_forms_url') || GOOGLE_FORMS_URL;
    this.updateClaimButtonUrl();

    // Check URL query ?reset=true for developer testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      localStorage.removeItem(STORAGE_CLAIM_KEY);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check cached claim (Fraud prevention: 1 burst per participant)
    this.cachedClaim = this.loadCachedClaim();

    this.init3D();
    this.initUI();

    // If user already burst and claimed a ticket, lock everything immediately!
    if (this.cachedClaim) {
      this.applyClaimedLock(this.cachedClaim);
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadCachedClaim() {
    try {
      const data = localStorage.getItem(STORAGE_CLAIM_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveClaim(ticketCode, crackerName, crackerId) {
    const claim = {
      hasBurst: true,
      ticketCode: ticketCode,
      crackerName: crackerName,
      crackerId: crackerId,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_CLAIM_KEY, JSON.stringify(claim));
    } catch (e) {}
    this.cachedClaim = claim;
    return claim;
  }

  init3D() {
    this.world = new WorldScene(this.container);
    this.particles = new ParticleSystem(this.world.scene);
    this.candle = new Candle(this.world.scene, this.world.camera, this.world.renderer.domElement);

    // 5 Traditional Diwali Crackers arranged symmetrically
    this.crackers = [];
    const crackerConfigs = [
      { id: 'ladi', name: '1000-Wala Red Ladi', subtitle: 'Grand string of red firecrackers', type: 'ladi', color: 0xdd2222, position: { x: -3.3, y: 0, z: 0.3 } },
      { id: 'flowerpot', name: 'Royal Golden Anar', subtitle: 'Sparkling flowerpot fountain', type: 'flowerpot', color: 0xffaa00, position: { x: -1.65, y: 0, z: -1.2 } },
      { id: 'rocket', name: 'Aakash Ganga Rocket', subtitle: 'Diwali sky celebration missile', type: 'rocket', color: 0x1565c0, position: { x: 0, y: 0, z: -1.8 } },
      { id: 'chakri', name: 'Zamin Chakri Wheel', subtitle: 'Whirling ground fire spinner', type: 'chakri', color: 0x00a86b, position: { x: 1.65, y: 0, z: -1.2 } },
      { id: 'bomb', name: 'Classic Laxmi Bomb', subtitle: 'High decibel green twine bomb', type: 'bomb', color: 0x2e7d32, position: { x: 3.3, y: 0, z: 0.3 } }
    ];

    crackerConfigs.forEach(cfg => {
      const cracker = new Cracker(cfg, this.world.scene);
      this.crackers.push(cracker);
    });

    this.initClickToIgnite();
  }

  initClickToIgnite() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (e) => {
      if (this.cachedClaim || this.hasBursted || this.activeCracker) {
        if (this.cachedClaim) {
          this.statusText.textContent = `🔒 You already claimed Ticket ${this.cachedClaim.ticketCode}! Only 1 burst allowed.`;
        }
        return;
      }
      if (this.candle.isDragging) return;

      const rect = this.container.getBoundingClientRect();
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0].clientY);
      if (clientX === undefined) return;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.world.camera);

      for (const cracker of this.crackers) {
        if (cracker.state === 'idle') {
          const intersects = raycaster.intersectObjects(cracker.group.children, true);
          if (intersects.length > 0) {
            this.candle.moveToPosition(cracker.pos.x, cracker.pos.z + 0.4);
            setTimeout(() => {
              if (!this.hasBursted && !this.activeCracker) {
                this.igniteCracker(cracker);
              }
            }, 250);
            break;
          }
        }
      }
    };

    this.container.addEventListener('click', handleClick);
  }

  initUI() {
    // Sound Toggle
    this.soundBtn.addEventListener('click', () => {
      soundEngine.init();
      const muted = soundEngine.toggleMute();
      this.soundIcon.textContent = muted ? '🔇' : '🔊';
      this.soundText.textContent = muted ? 'Sound: OFF' : 'Sound: ON';
    });

    // Hidden Admin Panel (Only accessible with ?admin=true or secret triple-click)
    const openAdminSettings = () => {
      if (this.formUrlInput) this.formUrlInput.value = this.googleFormsUrl;
      if (this.settingsModal) this.settingsModal.classList.add('active');
    };
    const closeAdminSettings = () => {
      if (this.settingsModal) this.settingsModal.classList.remove('active');
    };

    if (this.cancelSettingsBtn) this.cancelSettingsBtn.addEventListener('click', closeAdminSettings);
    if (this.saveSettingsBtn) {
      this.saveSettingsBtn.addEventListener('click', () => {
        const url = this.formUrlInput.value.trim();
        if (url) {
          this.googleFormsUrl = url;
          localStorage.setItem('diwali_forms_url', url);
          this.updateClaimButtonUrl();
        }
        closeAdminSettings();
      });
    }

    // Auto-open admin panel if URL query contains ?admin=true
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      openAdminSettings();
    }

    // Secret Admin Gesture: Triple-click Brand Title opens Admin Menu
    const brandTitle = document.querySelector('.brand-title');
    let titleClickCount = 0;
    if (brandTitle) {
      brandTitle.addEventListener('click', () => {
        titleClickCount++;
        if (titleClickCount >= 3) {
          titleClickCount = 0;
          const choice = prompt("👑 DIWALI ADMIN PANEL:\nType '1' to Change Google Form Link\nType '2' to Reset Participant Cache (Test Again)\nType 'cancel' to exit:", "1");
          if (choice === '1') {
            openAdminSettings();
          } else if (choice === '2') {
            localStorage.removeItem(STORAGE_CLAIM_KEY);
            alert("Cache cleared! Page will reload.");
            window.location.reload();
          }
        }
      });
    }

    // Pause / Resume Redirect
    this.pauseRedirectBtn.addEventListener('click', () => {
      this.isRedirectPaused = !this.isRedirectPaused;
      this.pauseRedirectBtn.textContent = this.isRedirectPaused ? '▶ Resume Redirect' : '⏸ Pause Redirect';
    });

    // Claim Ticket Click
    this.claimTicketBtn.addEventListener('click', () => {
      clearInterval(this.countdownInterval);
    });

    // Close Modal / Return to Main Screen
    const returnToScreen = () => {
      clearInterval(this.countdownInterval);
      this.rewardModal.classList.remove('active');
      soundEngine.playWhoosh(0.5);

      if (this.cachedClaim) {
        this.showClaimedBanner(this.cachedClaim);
      }
    };

    if (this.backToScreenBtn) this.backToScreenBtn.addEventListener('click', returnToScreen);
    if (this.closeModalXBtn) this.closeModalXBtn.addEventListener('click', returnToScreen);

    if (this.viewTicketBannerBtn) {
      this.viewTicketBannerBtn.addEventListener('click', () => {
        this.showRiggedRewardModal(false);
      });
    }

    this.rewardModal.addEventListener('click', (e) => {
      if (e.target === this.rewardModal) returnToScreen();
    });

    // Schedule Modal Controls
    const openSchedule = () => {
      if (this.scheduleModal) {
        this.scheduleModal.classList.add('active');
        soundEngine.playWhoosh(0.5);
      }
    };
    const closeSchedule = () => {
      if (this.scheduleModal) {
        this.scheduleModal.classList.remove('active');
        soundEngine.playWhoosh(0.4);
      }
    };

    if (this.scheduleBtn) this.scheduleBtn.addEventListener('click', openSchedule);
    if (this.closeScheduleXBtn) this.closeScheduleXBtn.addEventListener('click', closeSchedule);
    if (this.closeScheduleBtn) this.closeScheduleBtn.addEventListener('click', closeSchedule);

    if (this.scheduleModal) {
      this.scheduleModal.addEventListener('click', (e) => {
        if (e.target === this.scheduleModal) closeSchedule();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.rewardModal && this.rewardModal.classList.contains('active')) {
          returnToScreen();
        }
        if (this.scheduleModal && this.scheduleModal.classList.contains('active')) {
          closeSchedule();
        }
      }
    });

    window.addEventListener('pointerdown', () => soundEngine.init(), { once: true });
  }

  updateClaimButtonUrl() {
    this.claimTicketBtn.href = this.googleFormsUrl;
  }

  applyClaimedLock(claim) {
    this.hasBursted = true;

    // Lock candle
    this.candle.setLockedState(true);

    // Lock crackers: find if specific one was burnt
    this.crackers.forEach(c => {
      if (c.id === claim.crackerId || c.name === claim.crackerName) {
        c.setBurntState();
      } else {
        c.lock();
      }
    });

    // Update UI
    this.instructionToast.innerHTML = `<span class="badge" style="background:#ff3344">Locked</span> <span>You have already burst your 1 cracker! <b>Ticket: ${claim.ticketCode}</b></span>`;
    this.statusText.textContent = `🔒 Burst used • Claimed ${claim.ticketCode}`;

    this.showClaimedBanner(claim);
  }

  showClaimedBanner(claim) {
    if (this.claimedFloatingCard) {
      this.claimedFloatingCard.classList.add('visible');
      if (this.bannerTicketCode) this.bannerTicketCode.textContent = claim.ticketCode;
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    this.world.update(delta);
    this.candle.update(delta);
    this.particles.update(delta);

    // Proximity check only when idle
    if (!this.cachedClaim && !this.hasBursted && !this.activeCracker) {
      this.checkProximity();
    } else if (this.activeCracker) {
      // Update active cracker state machine
      const result = this.activeCracker.update(delta, {
        onSpark: (sparkPos) => {
          this.particles.spawnFuseSparks(sparkPos);
        },
        onRocketThrust: (nozzlePos) => {
          this.particles.spawnRocketThrust(nozzlePos);
        },
        onAnarFountain: (apexPos, intensity) => {
          this.particles.spawnAnarFountainSparks(apexPos, intensity);
        },
        onChakriSparks: (centerPos, spinAngle) => {
          this.particles.spawnChakriWheelSparks(centerPos, spinAngle);
        },
        onLadiPop: (popPos, count) => {
          this.particles.spawnMiniLadiPop(popPos);
          soundEngine.playMiniPop(0, 0.9 + Math.random() * 0.4);
          this.world.triggerShake(0.08, 0.08);
        }
      });

      if (result) {
        if (result.phase === 'fuse_finished') {
          this.startCrackerPerformance(this.activeCracker);
        } else if (result.phase === 'performance_finished') {
          this.finalizeBurst(this.activeCracker, result);
        }
      }
    }

    this.world.render();
  }

  checkProximity() {
    const candlePos = this.candle.getCenterPosition();
    let closestCracker = null;
    let closestDist = Infinity;

    this.crackers.forEach(cracker => {
      if (cracker.state === 'idle') {
        const dist = cracker.getHorizontalDistance(candlePos);
        if (dist < closestDist) {
          closestDist = dist;
          closestCracker = cracker;
        }
        cracker.highlight(dist < 1.7);
      }
    });

    if (closestCracker && closestDist < 1.7) {
      this.candle.setNearCracker(closestCracker);
      this.statusText.textContent = `Near ${closestCracker.name}... Bring candle closer to ignite!`;

      if (closestDist < 1.05) {
        this.igniteCracker(closestCracker);
      }
    } else {
      this.candle.setNearCracker(null);
      if (this.candle.isDragging) {
        this.statusText.textContent = 'Dragging candle... move to any cracker fuse!';
      } else {
        this.statusText.textContent = 'Drag the candle or tap any cracker to burst it';
      }
    }
  }

  igniteCracker(cracker) {
    if (this.cachedClaim || this.activeCracker || this.hasBursted) return;

    this.activeCracker = cracker;
    cracker.startSizzle();

    // Lock all other crackers
    this.crackers.forEach(c => {
      if (c !== cracker) c.lock();
    });

    this.candle.setDraggable(false);
    soundEngine.startSizzle();
    this.statusText.textContent = `🔥 ${cracker.name} fuse is sizzling! STAND BACK!`;
    this.instructionToast.classList.add('hidden');
  }

  startCrackerPerformance(cracker) {
    soundEngine.stopSizzle();
    cracker.startPerformance();

    // Cracker-specific realistic sound & UI callouts
    switch (cracker.type) {
      case 'rocket':
        soundEngine.playRocketAscent(cracker.performDuration);
        this.statusText.textContent = '🚀 Aakash Ganga Rocket ascending into the night sky! Whoooosh!';
        break;

      case 'flowerpot':
        soundEngine.startAnarFountain();
        this.statusText.textContent = '✨ Royal Golden Anar sparkling fountain erupting!';
        break;

      case 'chakri':
        soundEngine.startChakriSpin();
        this.statusText.textContent = '💫 Zamin Chakri whirling at high speed on the floor!';
        break;

      case 'ladi':
        this.statusText.textContent = '🧨 1000-Wala Red Ladi firing in rapid staccato!';
        break;

      case 'bomb':
      default:
        this.statusText.textContent = '💣 Fuse entered Laxmi Bomb... HOLD YOUR BREATH!';
        break;
    }
  }

  finalizeBurst(cracker, result) {
    this.hasBursted = true;
    this.activeCracker = null;

    // Stop continuous audio loops
    soundEngine.stopAllContinuous();

    const burstPos = result.position || cracker.getFuseWorldPosition();

    // Trigger cracker-specific finale burst effects
    if (result.action === 'rocket_sky_burst') {
      soundEngine.playSkyExplosion();
      this.particles.triggerSkyFirework(burstPos, 0x4fc3f7);
      this.world.triggerShake(0.35, 0.45);
    } else if (result.action === 'anar_shower_done') {
      soundEngine.playDebrisCrackle();
      this.particles.triggerExplosion(burstPos, 0xffd700, false);
      this.world.triggerShake(0.25, 0.35);
    } else if (result.action === 'chakri_done') {
      soundEngine.playMiniPop(0, 1.4);
      this.particles.triggerExplosion(burstPos, 0x00e676, false);
      this.world.triggerShake(0.25, 0.3);
    } else if (result.action === 'ladi_done') {
      soundEngine.playMiniPop(0, 1.6);
      this.particles.triggerExplosion(burstPos, 0xd32f2f, false);
      this.world.triggerShake(0.3, 0.35);
    } else {
      // Laxmi Bomb: High-decibel heavy concussion
      soundEngine.playExplosion(true);
      this.particles.triggerExplosion(burstPos, 0x2e7d32, true);
      this.world.triggerShake(0.65, 0.8);
    }

    // Save fraud-proof claim to cache immediately!
    const ticketCode = `#DIWALI-${Math.floor(10000 + Math.random() * 90000)}`;
    const claim = this.saveClaim(ticketCode, cracker.name, cracker.id);

    // Lock candle permanently
    this.candle.setLockedState(true);

    this.launchDiwaliConfetti();
    this.statusText.textContent = `💥 DHAMAKA! ${cracker.name} burst!`;

    setTimeout(() => {
      this.showRiggedRewardModal(true);
    }, 1100);
  }

  launchDiwaliConfetti() {
    confetti({
      origin: { y: 0.65 },
      particleCount: 120,
      spread: 90,
      colors: ['#ffd700', '#ff6600', '#ff3344', '#00e676', '#ffffff'],
      zIndex: 999
    });
  }

  showRiggedRewardModal(isFresh = true) {
    if (isFresh) {
      soundEngine.playFanfare();
      setTimeout(() => soundEngine.playSparkle(), 300);
    }

    const codeElem = document.querySelector('.ticket-code');
    if (codeElem && this.cachedClaim) {
      codeElem.textContent = this.cachedClaim.ticketCode;
    }

    this.rewardModal.classList.add('active');

    // Countdown timer to Google Forms
    this.countdownSeconds = 8;
    this.isRedirectPaused = false;
    this.countdownVal.textContent = this.countdownSeconds;
    this.pauseRedirectBtn.textContent = 'Pause Redirect';

    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      if (!this.isRedirectPaused) {
        this.countdownSeconds--;
        this.countdownVal.textContent = this.countdownSeconds;

        if (this.countdownSeconds <= 0) {
          clearInterval(this.countdownInterval);
          this.statusText.textContent = 'Redirecting to Diwali Google Form...';
          window.location.href = this.googleFormsUrl;
        }
      }
    }, 1000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
