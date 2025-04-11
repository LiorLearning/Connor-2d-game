import * as THREE from 'three';
import { ObjectPool } from './ObjectPool.js';
// Cache frequently used objects
const _vector3 = new THREE.Vector3();
const _euler = new THREE.Euler();
const _frustum = new THREE.Frustum();
const _matrix4 = new THREE.Matrix4();
function initGame() {
    // Initialize object pools
    const particlePool = new ObjectPool(() => new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ transparent: true })
    ));
    
    const projectilePool = new ObjectPool(() => new THREE.Mesh(
        new THREE.PlaneGeometry(1.0, 0.4),
        new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide })
    ));
  // Scene, Camera, Renderer, and Lights
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.Fog(0x050510, 10, 30);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 2, 0);
  
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'mediump'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.getElementById('renderDiv').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x101020);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0x9090ff, 1);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // Load Textures
  const textureLoader = new THREE.TextureLoader();
  const textureOptions = { anisotropy: 1, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const ninjaTexture = textureLoader.load('https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__04_35_45_AM-removebg-preview.png?ilkK', undefined, undefined, undefined, textureOptions);
  const villainTexture = textureLoader.load('https://play.rosebud.ai/assets/image (19).png?4ziz', undefined, undefined, undefined, textureOptions);
  const smokeBombTexture = textureLoader.load('https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__10_51_55_PM-removebg-preview.png?rK7q', undefined, undefined, undefined, textureOptions);
  const minionTexture = villainTexture.clone();

  // Game Phase, Movement Lock, and Intro Overlay
  let gamePhase = "intro";
  let movementLocked = false;
  const introOverlay = document.createElement('div');
  introOverlay.id = "introOverlay";
  Object.assign(introOverlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
    zIndex: '10'
  });
  introOverlay.innerHTML = `
    <h1 style="font-size: 48px; margin: 0;">LIGHTNING BOLT</h1>
    <p style="font-size: 24px; margin: 10px 0;">Neon-lit City Ninja Showdown</p>
    <p style="font-size: 20px; margin: 10px 0;">A neon-lit city at night with glowing skyscrapers and windy rooftops.</p>
    <p style="font-size: 18px; margin: 10px 0;">Watch as our brave ninja stands tall... and a mysterious villain emerges.</p>
    <p style="font-size: 20px; margin-top: 20px;">Press Enter to Start</p>
  `;
  document.getElementById('renderDiv').appendChild(introOverlay);

  // Create Hero: Lightning Bolt (Sprite + Glow)
  const hero = {
    position: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 0, y: 0 },
    grounded: true,
    falling: false,
    group: new THREE.Group(),
    lastAttack: 0,
    health: 100,
    lastHit: 0,
    invulnerableTime: 1000,
    isInvulnerable: false,
    isDodging: false,
    dodgeSpeed: 0.6,
    dodgeDirection: 0,
    dodgeStartTime: 0,
    dodgeDuration: 250,
    dodgeCooldown: 1000,
    lastDodge: 0,
    hasReachedSecondRooftop: false,
    hasSmokeAttack: false,
    smokeBombsCount: 0,
    lastSmokeBombRespawn: 0,
    smokeBombRespawnCooldown: 10000
  };
  
  const heroMaterial = new THREE.SpriteMaterial({
    map: ninjaTexture,
    transparent: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  const heroSprite = new THREE.Sprite(heroMaterial);
  heroSprite.scale.set(3.0, 3.0, 1);
  hero.group.add(heroSprite);
  const heroGlowMaterial = new THREE.SpriteMaterial({
    map: ninjaTexture,
    transparent: true,
    color: 0x00ffff,
    opacity: 0.3
  });
  const heroGlowSprite = new THREE.Sprite(heroGlowMaterial);
  heroGlowSprite.scale.set(3.3, 3.3, 1);
  hero.group.add(heroGlowSprite);
  hero.group.position.set(0, hero.position.y, 0);
  scene.add(hero.group);

  // Add health bar for hero
  const createHealthBar = () => {
    const healthContainer = document.createElement('div');
    healthContainer.id = 'heroHealthContainer';
    Object.assign(healthContainer.style, {
      position: 'absolute',
      top: '20px',
      left: '20px',
      width: '200px',
      height: '30px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      border: '2px solid #00ffff',
      borderRadius: '5px',
      overflow: 'hidden',
      zIndex: '100'
    });
    const healthFill = document.createElement('div');
    healthFill.id = 'heroHealthFill';
    Object.assign(healthFill.style, {
      width: '100%',
      height: '100%',
      backgroundColor: '#00ffff',
      transition: 'width 0.3s ease-out'
    });
    const healthLabel = document.createElement('div');
    healthLabel.id = 'heroHealthLabel';
    Object.assign(healthLabel.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '14px',
      textShadow: '0 0 3px #000',
      zIndex: '101'
    });
    healthLabel.textContent = 'HP: 100/100';
    healthContainer.appendChild(healthFill);
    healthContainer.appendChild(healthLabel);
    document.getElementById('renderDiv').appendChild(healthContainer);
    return function updateHealthBar(health) {
      const percentage = Math.max(0, Math.min(100, health));
      healthFill.style.width = `${percentage}%`;
      healthLabel.textContent = `HP: ${Math.round(percentage)}/100`;
      if (percentage > 60) {
        healthFill.style.backgroundColor = '#00ffff';
      } else if (percentage > 30) {
        healthFill.style.backgroundColor = '#ffff00';
      } else {
        healthFill.style.backgroundColor = '#ff3333';
      }
    };
  };
  const updateHealthBarFunc = createHealthBar();

  // Create Villain: Smoke (Sprite + Red Glow)
  let minionsFought = 0;
  const totalMinions = 20;
  let minionsSpawned = false;
  const villain = { group: new THREE.Group() };
  const villainMaterial = new THREE.SpriteMaterial({
    map: villainTexture,
    transparent: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  const villainSprite = new THREE.Sprite(villainMaterial);
  villainSprite.scale.set(3.0, 3.0, 1);
  villainSprite.scale.x = -Math.abs(villainSprite.scale.x);
  villain.group.add(villainSprite);
  const villainGlowMaterial = new THREE.SpriteMaterial({
    map: villainTexture,
    transparent: true,
    color: 0xff3333,
    opacity: 0.3
  });
  const villainGlowSprite = new THREE.Sprite(villainGlowMaterial);
  villainGlowSprite.scale.set(3.3, 3.3, 1);
  villainGlowSprite.scale.x = -Math.abs(villainGlowSprite.scale.x);
  villain.group.add(villainGlowSprite);
  villain.group.position.set(3, 1.5, 0);
  scene.add(villain.group);

  // Speech Bubble for Villain
  const speechBubble = document.createElement('div');
  speechBubble.id = "villainSpeechBubble";
  Object.assign(speechBubble.style, {
    position: 'absolute',
    background: '#fff',
    border: '2px solid #ff3333',
    borderRadius: '10px',
    padding: '8px 12px',
    color: '#ff3333',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '16px',
    zIndex: '20',
    opacity: '0'
  });
  speechBubble.innerHTML = "Try and beat me if you can!";
  document.getElementById('renderDiv').appendChild(speechBubble);

  // Rooftop and Decorative Elements
  const rooftops = [];
  const groundGeometry = new THREE.BoxGeometry(30, 1, 10);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x005566,
    emissive: 0x003344,
    emissiveIntensity: 0.5,
    shininess: 50
  });
  const initialRooftop = new THREE.Mesh(groundGeometry, groundMaterial);
  initialRooftop.position.set(0, -0.5, 0);
  initialRooftop.userData = { id: 0, xMin: -15, xMax: 15 };
  scene.add(initialRooftop);
  rooftops.push(initialRooftop);
  const nextRooftop = new THREE.Mesh(
    new THREE.BoxGeometry(25, 1, 10),
    new THREE.MeshPhongMaterial({
      color: 0x006677,
      emissive: 0x004455,
      emissiveIntensity: 0.6,
      shininess: 60
    })
  );
  nextRooftop.position.set(35, -0.5, 0);
  nextRooftop.userData = { id: 1, xMin: 22.5, xMax: 47.5 };
  scene.add(nextRooftop);
  rooftops.push(nextRooftop);

  // Create minions array and function to create a minion
  const minions = [];
  function createMinion(x, y, z) {
    const minion = {
      position: { x, y, z },
      health: 100,
      active: true,
      group: new THREE.Group(),
      lastHit: 0,
      hitCooldown: 500
    };
    const minionMaterial = new THREE.SpriteMaterial({
      map: minionTexture,
      transparent: true,
      alphaTest: 0.1,
      color: 0xbbbbff
    });
    const minionSprite = new THREE.Sprite(minionMaterial);
    minionSprite.scale.set(2.0, 2.0, 1);
    minionSprite.scale.x = -Math.abs(minionSprite.scale.x);
    minion.group.add(minionSprite);
    const minionGlowMaterial = new THREE.SpriteMaterial({
      map: minionTexture,
      transparent: true,
      color: 0x8833ff,
      opacity: 0.3
    });
    const minionGlowSprite = new THREE.Sprite(minionGlowMaterial);
    minionGlowSprite.scale.set(2.2, 2.2, 1);
    minionGlowSprite.scale.x = -Math.abs(minionGlowSprite.scale.x);
    minion.group.add(minionGlowSprite);
    minion.group.position.set(x, y, z);
    scene.add(minion.group);
    const healthBarWidth = 1.5;
    const healthBarHeight = 0.15;
    const healthBarBackground = new THREE.Mesh(
      new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    healthBarBackground.position.set(0, 2.0, 0);
    minion.group.add(healthBarBackground);
    const healthBarFill = new THREE.Mesh(
      new THREE.PlaneGeometry(healthBarWidth - 0.05, healthBarHeight - 0.05),
      new THREE.MeshBasicMaterial({ color: 0x8833ff })
    );
    healthBarFill.position.set(0, 2.0, 0.01);
    minion.healthBar = healthBarFill;
    minion.group.add(healthBarFill);
    return minion;
  }

  // Create jump boost indicator on first rooftop
  const jumpBoostGeometry = new THREE.PlaneGeometry(8, 10);
  const jumpBoostMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const jumpBoostIndicator = new THREE.Mesh(jumpBoostGeometry, jumpBoostMaterial);
  jumpBoostIndicator.rotation.x = -Math.PI / 2;
  jumpBoostIndicator.position.set(11, -0.49, 0);
  scene.add(jumpBoostIndicator);
  function animateJumpBoost() {
    requestAnimationFrame(animateJumpBoost);
    jumpBoostMaterial.opacity = 0.1 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.2;
  }
  animateJumpBoost();

  // Create glowing edges for rooftops and add them
  const edgeHeight = 0.3, edgeWidth = 0.3;
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ddff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.6,
    shininess: 30
  });
  function addEdgesToRooftop(rooftop) {
    const width = rooftop.geometry.parameters.width;
    const depth = rooftop.geometry.parameters.depth;
    const edges = new THREE.Group();
    const northEdge = new THREE.Mesh(new THREE.BoxGeometry(width, edgeHeight, edgeWidth), edgeMaterial);
    northEdge.position.set(0, -0.5 + edgeHeight / 2, -depth/2);
    edges.add(northEdge);
    const southEdge = new THREE.Mesh(new THREE.BoxGeometry(width, edgeHeight, edgeWidth), edgeMaterial);
    southEdge.position.set(0, -0.5 + edgeHeight / 2, depth/2);
    edges.add(southEdge);
    const eastEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, depth), edgeMaterial);
    eastEdge.position.set(width/2, -0.5 + edgeHeight / 2, 0);
    edges.add(eastEdge);
    const westEdge = new THREE.Mesh(new THREE.BoxGeometry(edgeWidth, edgeHeight, depth), edgeMaterial);
    westEdge.position.set(-width/2, -0.5 + edgeHeight / 2, 0);
    edges.add(westEdge);
    edges.position.copy(rooftop.position);
    scene.add(edges);
    return edges;
  }
  const rooftopEdges = rooftops.map(rooftop => addEdgesToRooftop(rooftop));

  // Create smoke bomb collectible
  function createSmokeBombCollectible() {
    const collectibleGroup = new THREE.Group();
    const smokeBombMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      opacity: 1.0
    });
    const smokeBombSprite = new THREE.Sprite(smokeBombMaterial);
    smokeBombSprite.scale.set(1.2, 1.2, 1);
    collectibleGroup.add(smokeBombSprite);
    const glowMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      color: 0x00ffff,
      opacity: 0.5
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(1.5, 1.5, 1);
    collectibleGroup.add(glowSprite);
    collectibleGroup.position.set(22.5, 2.0, 0);
    scene.add(collectibleGroup);
    const startY = collectibleGroup.position.y;
    function animateCollectible() {
      collectibleGroup.position.y = startY + Math.sin(Date.now() * 0.003) * 0.5;
      glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      smokeBombSprite.material.rotation += 0.01;
      glowSprite.material.rotation += 0.005;
      requestAnimationFrame(animateCollectible);
    }
    animateCollectible();
    return {
      group: collectibleGroup,
      collected: false,
      checkCollision: function(playerPos) {
        if (this.collected) return false;
        const distance = Math.sqrt(Math.pow(playerPos.x - this.group.position.x, 2) + Math.pow(playerPos.y - this.group.position.y, 2));
        return distance < 1.5;
      },
      collect: function() {
        this.collected = true;
        this.group.visible = false;
      }
    };
  }
  const smokeBombCollectibleObj = createSmokeBombCollectible();

  // Skyline creation
  const skyline = (function createNeonSkyline() {
    const skylineGroup = new THREE.Group();
    const buildingCount = 40;
    const buildingWidth = 2;
    const spacing = 2.5;
    const buildingGeometries = [
      new THREE.BoxGeometry(buildingWidth, 4, 1.5),
      new THREE.BoxGeometry(buildingWidth, 6, 1.5),
      new THREE.BoxGeometry(buildingWidth, 8, 1.5)
    ];
    const buildingMaterials = [
      new THREE.MeshPhongMaterial({ color: 0x000000, emissive: new THREE.Color(0.05, 0.05, 0.2), shininess: 30 }),
      new THREE.MeshPhongMaterial({ color: 0x000000, emissive: new THREE.Color(0.05, 0.2, 0.05), shininess: 30 }),
      new THREE.MeshPhongMaterial({ color: 0x000000, emissive: new THREE.Color(0.2, 0.05, 0.05), shininess: 30 })
    ];
    for (let i = 0; i < buildingCount; i++) {
      const geom = buildingGeometries[Math.floor(Math.random() * buildingGeometries.length)];
      const mat = buildingMaterials[Math.floor(Math.random() * buildingMaterials.length)];
      const building = new THREE.Mesh(geom, mat);
      const height = geom.parameters.height;
      building.position.set((i - buildingCount / 2) * spacing, height / 2 - 0.5, -10 - (Math.random() * 10));
      skylineGroup.add(building);
    }
    scene.add(skylineGroup);
    return skylineGroup;
  })();

  // Gameplay Instructions Overlay
  const instructions = document.createElement('div');
  Object.assign(instructions.style, {
    position: 'absolute',
    bottom: '20px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '16px',
    color: '#0099ff',
    zIndex: '10'
  });
  instructions.innerHTML = '';
  document.getElementById('renderDiv').appendChild(instructions);

  // Add Google Font Link
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
  
  // Add CSS animation for bomb counter
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulseBombCount {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(styleSheet);

  // Trail and Particle Effects System
  const trail = {
    particles: [],
    update: function () {
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.userData.life -= particle.userData.decay;
        if (particle.userData.velocity) {
          particle.position.add(particle.userData.velocity);
          particle.userData.velocity.y -= 0.002;
        }
        const lifeScale = particle.userData.life * particle.userData.life;
        particle.scale.set(lifeScale, lifeScale, lifeScale);
        particle.material.opacity = lifeScale * 0.8;
        if (particle.userData.life <= 0) {
          scene.remove(particle);
          this.particles.splice(i, 1);
          i--;
        }
      }
    },
    createVillainParticle: function(position, color, velocity) {
      const particle = particlePool.get();
      particle.material.color.set(color);
      particle.material.opacity = 0.8;
      particle.position.copy(position);
      particle.userData = { type: 'villainVanish', life: 1.0, decay: 0.03 + Math.random() * 0.02, velocity: velocity };
      scene.add(particle);
      this.particles.push(particle);
      return particle;
    }
  };

  // Keyboard Controls
  const keys = { left: false, right: false, jump: false, attack: false, dodge: false };
  const dodgeIndicator = document.createElement('div');
  dodgeIndicator.id = 'dodgeIndicator';
  Object.assign(dodgeIndicator.style, {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '150px',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid #00ffff',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: '100'
  });
  const dodgeFill = document.createElement('div');
  dodgeFill.id = 'dodgeFill';
  Object.assign(dodgeFill.style, {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffaa00',
    transition: 'width 0.1s linear'
  });
  const dodgeLabel = document.createElement('div');
  dodgeLabel.textContent = 'DODGE [SHIFT]';
  Object.assign(dodgeLabel.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '12px',
    textShadow: '0 0 3px #000',
    zIndex: '101'
  });
  dodgeIndicator.appendChild(dodgeFill);
  dodgeIndicator.appendChild(dodgeLabel);
  document.getElementById('renderDiv').appendChild(dodgeIndicator);
  
  function updateDodgeIndicator() {
    const now = Date.now();
    const elapsed = now - hero.lastDodge;
    if (elapsed < hero.dodgeCooldown) {
      const percentage = (elapsed / hero.dodgeCooldown) * 100;
      dodgeFill.style.width = `${percentage}%`;
      if (percentage < 50) {
        dodgeFill.style.backgroundColor = '#ff3333';
      } else if (percentage < 100) {
        dodgeFill.style.backgroundColor = '#ffaa00';
      }
    } else {
      dodgeFill.style.width = '100%';
      dodgeFill.style.backgroundColor = '#00ffff';
    }
  }
  document.addEventListener('keydown', (event) => {
    if (gamePhase === "intro" && event.key === 'Enter') {
      gamePhase = "gameplay";
      movementLocked = true;
      document.getElementById('renderDiv').removeChild(introOverlay);
      instructions.innerHTML = 'Use ARROW KEYS or WASD to move and jump';
      speechBubble.style.opacity = '1';
      speechBubble.style.left = '60%';
      speechBubble.style.top = '30%';
      setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);
      setTimeout(() => {
        function createHeroPulseEffect() {
          const pulseCount = 3;
          const pulseDuration = 300;
          let currentPulse = 0;
          const originalHeroColor = heroSprite.material.color.clone();
          const originalGlowColor = heroGlowSprite.material.color.clone();
          const originalGlowOpacity = heroGlowSprite.material.opacity;
          function doPulse() {
            if (currentPulse >= pulseCount * 2) {
              heroSprite.material.color.copy(originalHeroColor);
              heroGlowSprite.material.color.copy(originalGlowColor);
              heroGlowSprite.material.opacity = originalGlowOpacity;
              return;
            }
            if (currentPulse % 2 === 0) {
              heroSprite.material.color.set(0xffffff);
              heroGlowSprite.material.color.set(0x00ffff);
              heroGlowSprite.material.opacity = 0.8;
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 2;
                const particlePos = new THREE.Vector3(
                  hero.position.x + Math.cos(angle) * distance,
                  hero.position.y + Math.sin(angle) * distance,
                  hero.position.z
                );
                const velocity = new THREE.Vector3(Math.cos(angle) * 0.06, Math.sin(angle) * 0.06, 0);
                const particleColor = new THREE.Color(0x00ffff);
                trail.createVillainParticle(particlePos, particleColor, velocity);
              }
            } else {
              heroSprite.material.color.copy(originalHeroColor);
              heroGlowSprite.material.color.copy(originalGlowColor);
              heroGlowSprite.material.opacity = originalGlowOpacity;
            }
            currentPulse++;
            setTimeout(doPulse, pulseDuration);
          }
          const unlockNotification = document.createElement('div');
          Object.assign(unlockNotification.style, {
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            zIndex: '100',
            opacity: '0',
            transition: 'opacity 0.5s'
          });
          unlockNotification.innerHTML = 'MOVEMENT UNLOCKED!';
          document.getElementById('renderDiv').appendChild(unlockNotification);
          setTimeout(() => { 
            unlockNotification.style.opacity = '1';
            setTimeout(() => {
              unlockNotification.style.opacity = '0';
              setTimeout(() => {
                document.getElementById('renderDiv').removeChild(unlockNotification);
              }, 500);
            }, 2000);
          }, 10);
          doPulse();
        }
        const startOpacity = 1.0;
        const duration = 1500;
        const startTime = Date.now();
        function fadeVillain() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1.0);
          villainSprite.material.opacity = startOpacity * (1 - progress);
          villainGlowSprite.material.opacity = 0.3 * (1 - progress);
          if (progress < 1.0 && Math.random() > 0.7) {
            const particleColor = new THREE.Color(0xff0000);
            particleColor.lerp(new THREE.Color(0x000000), Math.random() * 0.5);
            const particlePosition = new THREE.Vector3(
              villain.group.position.x + (Math.random() - 0.5) * 1.5,
              villain.group.position.y + (Math.random() - 0.5) * 3,
              villain.group.position.z + (Math.random() - 0.5) * 0.5
            );
            const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() * 0.1) - 0.05, (Math.random() - 0.5) * 0.05);
            trail.createVillainParticle(particlePosition, particleColor, velocity);
            trail.createVillainParticle(particlePosition, particleColor, velocity);
          }
          if (progress < 1.0) {
            requestAnimationFrame(fadeVillain);
          } else {
            villain.group.visible = false;
            movementLocked = false;
            createHeroPulseEffect();
          }
        }
        fadeVillain();
      }, 5000);
    } else if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft': case 'a': keys.left = true; break;
        case 'ArrowRight': case 'd': keys.right = true; break;
        case 'ArrowUp': case 'w': case ' ': keys.jump = true; break;
        case 'f': case 'e': keys.attack = true; break;
        case 'Shift': keys.dodge = true; break;
      }
    }
  });
  document.addEventListener('keyup', (event) => {
    if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft': case 'a': keys.left = false; break;
        case 'ArrowRight': case 'd': keys.right = false; break;
        case 'ArrowUp': case 'w': case ' ': keys.jump = false; break;
        case 'f': case 'e': keys.attack = false; break;
        case 'Shift': keys.dodge = false; break;
      }
    }
  });

  // Animation Loop and Performance Optimization
  const clock = new THREE.Clock();
  let lastTime = 0;
  function animate(currentTime) {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    const elapsed = currentTime - lastTime;
    lastTime = currentTime;
    if (elapsed > 33.33) return;
    if (gamePhase === "gameplay") {
      if (!movementLocked) {
        updateDodgeIndicator();
        if (!smokeBombCollectibleObj.collected && smokeBombCollectibleObj.checkCollision(hero.position)) {
          smokeBombCollectibleObj.collect();
          movementLocked = true;
          showMathQuiz();
        }
        if (keys.dodge && !hero.isDodging) {
          const now = Date.now();
          if (now - hero.lastDodge > hero.dodgeCooldown) {
            hero.isDodging = true;
            hero.dodgeStartTime = now;
            hero.lastDodge = now;
            if (keys.left) hero.dodgeDirection = -1;
            else if (keys.right) hero.dodgeDirection = 1;
            else hero.dodgeDirection = (heroSprite.scale.x > 0) ? 1 : -1;
            createDodgeEffect();
            hero.isInvulnerable = true;
            hero.lastHit = now;
            hero.invulnerableTime = hero.dodgeDuration + 100;
            const dodgeNotification = document.createElement('div');
            Object.assign(dodgeNotification.style, {
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '24px',
              color: '#00ffff',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
              zIndex: '100',
              opacity: '0',
              transition: 'opacity 0.2s'
            });
            dodgeNotification.innerHTML = 'DODGE!';
            document.getElementById('renderDiv').appendChild(dodgeNotification);
            setTimeout(() => { 
              dodgeNotification.style.opacity = '1';
              setTimeout(() => {
                dodgeNotification.style.opacity = '0';
                setTimeout(() => {
                  document.getElementById('renderDiv').removeChild(dodgeNotification);
                }, 200);
              }, 200);
            }, 10);
          }
        }
        if (hero.isDodging) {
          const now = Date.now();
          const dodgeElapsed = now - hero.dodgeStartTime;
          if (dodgeElapsed < hero.dodgeDuration) {
            hero.velocity.x = hero.dodgeDirection * hero.dodgeSpeed;
            if (dodgeElapsed % 50 === 0) { createAfterimage(); }
          } else {
            hero.isDodging = false;
            hero.velocity.x *= 0.5;
          }
        } else {
          if (keys.left) hero.velocity.x = -0.3;
          else if (keys.right) hero.velocity.x = 0.3;
          else hero.velocity.x *= 0.85;
        }
        if (keys.jump && hero.grounded) {
          let isNearFirstRooftopEdge = false, onFirstRooftop = false;
          for (const rooftop of rooftops) {
            if (hero.position.x >= rooftop.userData.xMin && hero.position.x <= rooftop.userData.xMax && Math.abs(hero.position.z) <= rooftop.geometry.parameters.depth / 2) {
              if (rooftop.userData.id === 0) {
                onFirstRooftop = true;
                if (hero.position.x > 7) isNearFirstRooftopEdge = true;
              }
              break;
            }
          }
          if (isNearFirstRooftopEdge) {
            hero.velocity.y = 0.35;
            hero.velocity.x = 0.4;
            const originalOpacity = jumpBoostMaterial.opacity;
            jumpBoostMaterial.opacity = 0.8;
            setTimeout(() => { jumpBoostMaterial.opacity = originalOpacity; }, 300);
          } else {
            hero.velocity.y = 0.25;
          }
          hero.grounded = false;
          const jumpFlash = new THREE.Mesh(
            new THREE.CircleGeometry(0.3, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
          );
          jumpFlash.position.set(hero.position.x, hero.position.y - 0.5, hero.position.z);
          jumpFlash.rotation.x = -Math.PI / 2;
          scene.add(jumpFlash);
          const startTime = Date.now();
          (function removeJumpFlash() {
            const elapsed = Date.now() - startTime;
            if (elapsed < 500) {
              jumpFlash.scale.set(1 + elapsed / 250, 1 + elapsed / 250, 1);
              jumpFlash.material.opacity = 0.8 * (1 - elapsed / 500);
              requestAnimationFrame(removeJumpFlash);
            } else {
              scene.remove(jumpFlash);
            }
          })();
        }
        hero.velocity.y -= 0.015;
      } else {
        hero.velocity.x = 0;
        hero.velocity.y = 0;
      }
      hero.position.x += hero.velocity.x;
      hero.position.y += hero.velocity.y;
    } else {
      hero.velocity.x = 0;
      hero.velocity.y = 0;
    }
    
    let onAnyRooftop = false, currentRooftop = null;
    const heroHalfWidth = 1.0;
    for (const rooftop of rooftops) {
      if (hero.position.x + heroHalfWidth >= rooftop.userData.xMin && hero.position.x - heroHalfWidth <= rooftop.userData.xMax && Math.abs(hero.position.z) <= rooftop.geometry.parameters.depth / 2) {
        onAnyRooftop = true;
        currentRooftop = rooftop;
        if (rooftop.userData.id === 1 && !hero.hasReachedSecondRooftop) {
          hero.hasReachedSecondRooftop = true;
        }
        break;
      }
    }
    if (hero.health <= 0 && !hero.falling) {
      hero.falling = true;
      hero.grounded = false;
      const deathEffect = document.createElement('div');
      Object.assign(deathEffect.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '64px',
        color: '#ff0000',
        textShadow: '0 0 20px rgba(255, 0, 0, 0.8)',
        zIndex: '100',
        opacity: '0',
        transition: 'opacity 0.5s'
      });
      deathEffect.innerHTML = 'DEFEATED!';
      document.getElementById('renderDiv').appendChild(deathEffect);
      setTimeout(() => { 
        deathEffect.style.opacity = '1';
        setTimeout(() => {
          deathEffect.style.opacity = '0';
          setTimeout(() => {
            document.getElementById('renderDiv').removeChild(deathEffect);
            hero.health = 100;
            hero.position.x = 0;
            hero.position.y = 1.5;
            hero.position.z = 0;
            hero.velocity.x = 0;
            hero.velocity.y = 0;
            hero.falling = false;
            hero.grounded = true;
            hero.isInvulnerable = true;
            hero.lastHit = Date.now();
            updateHealthBarFunc(hero.health);
          }, 500);
        }, 2000);
      }, 10);
    }
    if (!onAnyRooftop && !hero.falling && hero.position.y <= 1.5) {
      hero.falling = true;
      hero.grounded = false;
      const fallEffect = document.createElement('div');
      Object.assign(fallEffect.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '48px',
        color: '#ff3333',
        textShadow: '0 0 15px rgba(255, 50, 50, 0.8)',
        zIndex: '100',
        opacity: '0',
        transition: 'opacity 0.5s'
      });
      fallEffect.innerHTML = 'GAME RESTART';
      document.getElementById('renderDiv').appendChild(fallEffect);
      setTimeout(() => { fallEffect.style.opacity = '1'; }, 10);
      const shakeAmount = 0.05;
      const originalCameraPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        camera.position.x = originalCameraPos.x + (Math.random() - 0.5) * shakeAmount * 2;
        camera.position.y = originalCameraPos.y + (Math.random() - 0.5) * shakeAmount;
        shakeCount++;
        if (shakeCount > 10) {
          clearInterval(shakeInterval);
          camera.position.set(originalCameraPos.x, originalCameraPos.y, originalCameraPos.z);
        }
      }, 50);
      setTimeout(() => {
        hero.position.x = 0;
        hero.position.y = 1.5;
        hero.position.z = 0;
        hero.velocity.x = 0;
        hero.velocity.y = 0;
        hero.falling = false;
        hero.grounded = true;
        hero.health = 100;
        hero.isInvulnerable = true;
        hero.lastHit = Date.now();
        hero.isDodging = false;
        hero.lastDodge = 0;
        villain.group.position.set(3, 1.5, 0);
        villain.group.visible = true;
        villainSprite.material.opacity = 1.0;
        villainGlowSprite.material.opacity = 0.3;
        minions.forEach(minion => {
          if (minion.group) scene.remove(minion.group);
        });
        minions.length = 0;
        minionsSpawned = false;
        minionsFought = 0;
        gamePhase = "gameplay";
        movementLocked = true;
        hero.lastDodge = 0;
        updateDodgeIndicator();
        updateHealthBarFunc(hero.health);
        fallEffect.style.opacity = '0';
        setTimeout(() => { 
          document.getElementById('renderDiv').removeChild(fallEffect);
          const restartNotification = document.createElement('div');
          Object.assign(restartNotification.style, {
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            zIndex: '100',
            opacity: '0',
            transition: 'opacity 0.5s'
          });
          restartNotification.innerHTML = 'GAME RESTARTED';
          document.getElementById('renderDiv').appendChild(restartNotification);
          setTimeout(() => { 
            restartNotification.style.opacity = '1';
            setTimeout(() => {
              restartNotification.style.opacity = '0';
              setTimeout(() => {
                document.getElementById('renderDiv').removeChild(restartNotification);
              }, 500);
            }, 2000);
          }, 10);
          speechBubble.style.opacity = '1';
          speechBubble.style.left = '60%';
          speechBubble.style.top = '30%';
          setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);
          function createHeroPulseEffect() {
            const pulseCount = 3, pulseDuration = 300;
            let currentPulse = 0;
            const originalHeroColor = heroSprite.material.color.clone();
            const originalGlowColor = heroGlowSprite.material.color.clone();
            const originalGlowOpacity = heroGlowSprite.material.opacity;
            function doPulse() {
              if (currentPulse >= pulseCount * 2) {
                heroSprite.material.color.copy(originalHeroColor);
                heroGlowSprite.material.color.copy(originalGlowColor);
                heroGlowSprite.material.opacity = originalGlowOpacity;
                return;
              }
              if (currentPulse % 2 === 0) {
                heroSprite.material.color.set(0xffffff);
                heroGlowSprite.material.color.set(0x00ffff);
                heroGlowSprite.material.opacity = 0.8;
                for (let i = 0; i < 12; i++) {
                  const angle = (i / 12) * Math.PI * 2;
                  const distance = 2;
                  const particlePos = new THREE.Vector3(
                    hero.position.x + Math.cos(angle) * distance,
                    hero.position.y + Math.sin(angle) * distance,
                    hero.position.z
                  );
                  const velocity = new THREE.Vector3(Math.cos(angle) * 0.06, Math.sin(angle) * 0.06, 0);
                  const particleColor = new THREE.Color(0x00ffff);
                  trail.createVillainParticle(particlePos, particleColor, velocity);
                }
              } else {
                heroSprite.material.color.copy(originalHeroColor);
                heroGlowSprite.material.color.copy(originalGlowColor);
                heroGlowSprite.material.opacity = originalGlowOpacity;
              }
              currentPulse++;
              setTimeout(doPulse, pulseDuration);
            }
            const unlockNotification = document.createElement('div');
            Object.assign(unlockNotification.style, {
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '24px',
              color: '#00ffff',
              textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
              zIndex: '100',
              opacity: '0',
              transition: 'opacity 0.5s'
            });
            unlockNotification.innerHTML = 'MOVEMENT UNLOCKED!';
            document.getElementById('renderDiv').appendChild(unlockNotification);
            setTimeout(() => { 
              unlockNotification.style.opacity = '1';
              setTimeout(() => {
                unlockNotification.style.opacity = '0';
                setTimeout(() => {
                  document.getElementById('renderDiv').removeChild(unlockNotification);
                }, 500);
              }, 2000);
            }, 10);
            doPulse();
          }
          setTimeout(() => {
            const startOpacity = 1.0, duration = 1500, startTime = Date.now();
            function fadeVillain() {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1.0);
              villainSprite.material.opacity = startOpacity * (1 - progress);
              villainGlowSprite.material.opacity = 0.3 * (1 - progress);
              if (progress < 1.0 && Math.random() > 0.7) {
                const particleColor = new THREE.Color(0xff0000);
                particleColor.lerp(new THREE.Color(0x000000), Math.random() * 0.5);
                const particlePosition = new THREE.Vector3(
                  villain.group.position.x + (Math.random() - 0.5) * 1.5,
                  villain.group.position.y + (Math.random() - 0.5) * 3,
                  villain.group.position.z + (Math.random() - 0.5) * 0.5
                );
                const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.05, (Math.random() * 0.1) - 0.05, (Math.random() - 0.5) * 0.05);
                trail.createVillainParticle(particlePosition, particleColor, velocity);
              }
              if (progress < 1.0) requestAnimationFrame(fadeVillain);
              else {
                villain.group.visible = false;
                movementLocked = false;
                createHeroPulseEffect();
              }
            }
            fadeVillain();
          }, 5000);
        }
      }
      if (hero.position.y < 1.5 && !hero.falling) {
        hero.position.y = 1.5;
        hero.velocity.y = 0;
        hero.grounded = true;
      }
      hero.group.position.set(hero.position.x, hero.position.y, 0);
      if (hero.position.x < villain.group.position.x) {
        heroSprite.scale.x = Math.abs(heroSprite.scale.x);
        villainSprite.scale.x = -Math.abs(villainSprite.scale.x);
        villainGlowSprite.scale.x = -Math.abs(villainGlowSprite.scale.x);
      } else {
        heroSprite.scale.x = -Math.abs(heroSprite.scale.x);
        villainSprite.scale.x = Math.abs(villainSprite.scale.x);
        villainGlowSprite.scale.x = Math.abs(villainGlowSprite.scale.x);
      }
      heroSprite.position.y = Math.sin(Date.now() * 0.003) * 0.1;
      heroGlowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.1;
      trail.update();
      camera.position.x = hero.position.x;
      skyline.position.x = hero.position.x * 0.4;
      if (currentRooftop && currentRooftop.userData.id === 1 && !minionsSpawned) {
        minionsSpawned = true;
        const spawnNotification = document.createElement('div');
        spawnNotification.id = 'spawnNotification';
        Object.assign(spawnNotification.style, {
          position: 'absolute',
          top: '40%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '28px',
          color: '#ff33ff',
          textShadow: '0 0 15px rgba(255, 50, 255, 0.8)',
          zIndex: '100',
          opacity: '0',
          transition: 'opacity 0.5s',
          textAlign: 'center'
        });
        spawnNotification.innerHTML = `SMOKE'S MINIONS APPEAR!<br><span style="font-size: 20px">Defeat 3 of 20 minions</span>`;
        document.getElementById('renderDiv').appendChild(spawnNotification);
        setTimeout(() => { 
          spawnNotification.style.opacity = '1';
          setTimeout(() => {
            spawnNotification.style.opacity = '0';
            setTimeout(() => {
              document.getElementById('renderDiv').removeChild(spawnNotification);
            }, 500);
          }, 2000);
        }, 10);
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const xPos = 35 + (i - 1) * 5;
            const zPos = (Math.random() - 0.5) * 3;
            const minion = createMinion(xPos, 1.5, zPos);
            minions.push(minion);
            const spawnEffect = new THREE.Mesh(
              new THREE.CircleGeometry(1, 16),
              new THREE.MeshBasicMaterial({ 
                color: 0xff33ff, 
                transparent: true, 
                opacity: 0.8,
                side: THREE.DoubleSide
              })
            );
            spawnEffect.position.set(xPos, 1.5, zPos);
            spawnEffect.rotation.x = -Math.PI / 2;
            scene.add(spawnEffect);
            const startTime = Date.now();
            (function expandSpawnEffect() {
              const elapsed = Date.now() - startTime;
              if (elapsed < 800) {
                spawnEffect.scale.set(1 + elapsed / 200, 1 + elapsed / 200, 1);
                spawnEffect.material.opacity = 0.8 * (1 - elapsed / 800);
                requestAnimationFrame(expandSpawnEffect);
              } else {
                scene.remove(spawnEffect);
              }
            })();
          }, i * 600);
        }
        instructions.innerHTML = hero.hasSmokeAttack ? 'SMOKE\'S MINIONS BLOCK YOUR PATH! Press E or F to attack!' : 'SMOKE\'S MINIONS BLOCK YOUR PATH! Find smoke bombs to attack!';
      }
      const attackRange = 3.0;
      let enemyInRange = false;
      minions.forEach(minion => {
        if (minion.active) {
          const distance = Math.abs(hero.position.x - minion.group.position.x);
          if (distance < attackRange) {
            enemyInRange = true;
            if (!minion.indicator) {
              const indicatorGeometry = new THREE.RingGeometry(1.2, 1.3, 32);
              const indicatorMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff3333,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
              });
              const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
              indicator.rotation.x = -Math.PI / 2;
              indicator.position.y = -1.45;
              minion.indicator = indicator;
              minion.group.add(indicator);
            } else {
              minion.indicator.visible = true;
              const pulseScale = 1 + Math.sin(Date.now() * 0.008) * 0.2;
              minion.indicator.scale.set(pulseScale, pulseScale, 1);
            }
          } else if (minion.indicator) {
            minion.indicator.visible = false;
          }
        }
      });
      if (enemyInRange && !document.getElementById('attackPrompt')) {
        const attackPrompt = document.createElement('div');
        attackPrompt.id = 'attackPrompt';
        Object.assign(attackPrompt.style, {
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '20px',
          color: '#ff3333',
          textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
          zIndex: '100',
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px',
          pointerEvents: 'none'
        });
        attackPrompt.innerHTML = hero.hasSmokeAttack ? `ENEMY IN RANGE! Press E or F to attack (${hero.smokeBombsCount} bombs left)` : 'ENEMY IN RANGE! Find smoke bombs to attack';
        document.getElementById('renderDiv').appendChild(attackPrompt);
      } else if (!enemyInRange && document.getElementById('attackPrompt')) {
        const attackPrompt = document.getElementById('attackPrompt');
        document.getElementById('renderDiv').removeChild(attackPrompt);
      }
      if (gamePhase === "gameplay" && keys.attack && !movementLocked) {
        const now = Date.now();
        const attackRange = 3.0;
        let hasAttacked = false;
        if (now - hero.lastAttack > 500 && hero.hasSmokeAttack && hero.smokeBombsCount > 0) {
          minions.forEach(minion => {
            if (minion.active) {
              const distance = Math.abs(hero.position.x - minion.group.position.x);
              if (distance < attackRange) {
                hasAttacked = true;
                hero.lastAttack = now;
                const attackDirection = hero.position.x < minion.group.position.x ? 1 : -1;
                const projectileMaterial = new THREE.SpriteMaterial({
                  map: smokeBombTexture,
                  transparent: true,
                  opacity: 1.0
                });
                const projectile = new THREE.Sprite(projectileMaterial);
                projectile.scale.set(0.8, 0.8, 1);
                projectile.position.set(hero.position.x + (attackDirection * 0.8), hero.position.y, 0);
                scene.add(projectile);
                const particleCount = 8;
                const particles = [];
                for (let i = 0; i < particleCount; i++) {
                  const particleMaterial = new THREE.SpriteMaterial({
                    map: smokeBombTexture,
                    transparent: true,
                    opacity: 0.4
                  });
                  const particle = new THREE.Sprite(particleMaterial);
                  particle.scale.set(0.3, 0.3, 1);
                  particle.position.copy(projectile.position);
                  scene.add(particle);
                  particles.push(particle);
                }
                const projectileStartTime = Date.now();
                const projectileDuration = 200;
                const startX = projectile.position.x;
                const targetX = minion.group.position.x;
                const totalDistance = targetX - startX;
                (function animateProjectile() {
                  const elapsed = Date.now() - projectileStartTime;
                  if (elapsed < projectileDuration) {
                    const progress = elapsed / projectileDuration;
                    projectile.position.x = startX + (progress * totalDistance);
                    projectile.position.y = hero.position.y + Math.sin(progress * Math.PI) * 0.5;
                    projectile.material.rotation += 0.1;
                    for (let i = 0; i < particles.length; i++) {
                      const particle = particles[i];
                      const particleProgress = Math.max(0, progress - (i * 0.05));
                      if (particleProgress > 0) {
                        particle.position.x = startX + (particleProgress * totalDistance);
                        particle.position.y = hero.position.y + Math.sin(particleProgress * Math.PI) * 0.5;
                        particle.material.opacity = 0.4 * (1 - particleProgress);
                        const scale = 0.3 * (1 - particleProgress * 0.7);
                        particle.scale.set(scale, scale, 1);
                      }
                    }
                    requestAnimationFrame(animateProjectile);
                  } else {
                    const smokeParticleCount = 20;
                    const smokeParticles = [];
                    for (let i = 0; i < smokeParticleCount; i++) {
                      const smokeMaterial = new THREE.SpriteMaterial({
                        map: smokeBombTexture,
                        transparent: true,
                        opacity: 0.8,
                        color: new THREE.Color(0xaaffff)
                      });
                      const smokeParticle = new THREE.Sprite(smokeMaterial);
                      const size = 0.3 + Math.random() * 0.7;
                      smokeParticle.scale.set(size, size, 1);
                      smokeParticle.position.set(
                        minion.group.position.x + (Math.random() - 0.5) * 1.2,
                        minion.group.position.y + (Math.random() - 0.5) * 1.2,
                        minion.group.position.z + (Math.random() - 0.5) * 0.2
                      );
                      smokeParticle.userData = {
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, 0),
                        rotation: Math.random() * 0.1 - 0.05
                      };
                      scene.add(smokeParticle);
                      smokeParticles.push(smokeParticle);
                    }
                    const smokeStartTime = Date.now();
                    const smokeDuration = 800;
                    (function animateSmoke() {
                      const smokeElapsed = Date.now() - smokeStartTime;
                      if (smokeElapsed < smokeDuration) {
                        const smokeProgress = smokeElapsed / smokeDuration;
                        smokeParticles.forEach(particle => {
                          particle.position.add(particle.userData.velocity);
                          particle.position.y += 0.005;
                          particle.material.rotation += particle.userData.rotation;
                          const expansion = 1 + smokeProgress * 0.5;
                          particle.scale.x = particle.scale.x * expansion;
                          particle.scale.y = particle.scale.y * expansion;
                          particle.material.opacity = 0.8 * (1 - Math.pow(smokeProgress, 2));
                        });
                        requestAnimationFrame(animateSmoke);
                      } else {
                        smokeParticles.forEach(particle => scene.remove(particle));
                      }
                    })();
                    scene.remove(projectile);
                    particles.forEach(particle => scene.remove(particle));
                  }
                })();
                minion.health -= 25;
                const healthBarWidth = 1.5;
                const healthPercentage = Math.max(0, minion.health) / 100;
                const healthBarOriginalWidth = healthBarWidth - 0.05;
                minion.healthBar.scale.x = healthPercentage;
                minion.healthBar.position.x = -((1 - healthPercentage) * healthBarOriginalWidth) / 2;
                minion.group.children[0].material.color.set(0xffffff);
                setTimeout(() => {
                  if (minion.active) {
                    minion.group.children[0].material.color.set(0xbbbbff);
                  }
                }, 100);
                if (minion.health <= 0) {
                  minion.active = false;
                  const defeatEffect = new THREE.Mesh(
                    new THREE.CircleGeometry(1.5, 16),
                    new THREE.MeshBasicMaterial({ color: 0x8833ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
                  );
                  defeatEffect.position.copy(minion.group.position);
                  defeatEffect.rotation.x = -Math.PI / 2;
                  scene.add(defeatEffect);
                  const defeatStartTime = Date.now();
                  (function expandDefeatEffect() {
                    const elapsed = Date.now() - defeatStartTime;
                    if (elapsed < 800) {
                      defeatEffect.scale.set(1 + elapsed / 200, 1 + elapsed / 200, 1);
                      defeatEffect.material.opacity = 0.8 * (1 - elapsed / 800);
                      requestAnimationFrame(expandDefeatEffect);
                    } else {
                      scene.remove(defeatEffect);
                    }
                  })();
                  minion.group.visible = false;
                  minionsFought++;
                  const defeatNotification = document.createElement('div');
                  Object.assign(defeatNotification.style, {
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '24px',
                    color: '#8833ff',
                    textShadow: '0 0 10px rgba(136, 51, 255, 0.8)',
                    zIndex: '100',
                    opacity: '0',
                    transition: 'opacity 0.5s',
                    textAlign: 'center'
                  });
                  defeatNotification.innerHTML = `MINION DEFEATED!<br><span style="font-size: 18px">${minionsFought} of ${totalMinions}</span>`;
                  document.getElementById('renderDiv').appendChild(defeatNotification);
                  setTimeout(() => { 
                    defeatNotification.style.opacity = '1';
                    setTimeout(() => {
                      defeatNotification.style.opacity = '0';
                      setTimeout(() => {
                        document.getElementById('renderDiv').removeChild(defeatNotification);
                      }, 500);
                    }, 1500);
                  }, 10);
                  if (minionsFought === 3) {
                    hero.health = 100;
                    updateHealthBarFunc(hero.health);
                    const healEffect = document.createElement('div');
                    Object.assign(healEffect.style, {
                      position: 'absolute',
                      top: '40%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontFamily: "'Orbitron', sans-serif",
                      fontSize: '28px',
                      color: '#00ff88',
                      textShadow: '0 0 15px rgba(0, 255, 136, 0.8)',
                      zIndex: '100',
                      opacity: '0',
                      transition: 'opacity 0.5s',
                      textAlign: 'center'
                    });
                    healEffect.innerHTML = 'HEALTH FULLY RESTORED!';
                    document.getElementById('renderDiv').appendChild(healEffect);
                    for (let i = 0; i < 20; i++) {
                      const angle = (i / 20) * Math.PI * 2;
                      const distance = 1.5;
                      const particlePos = new THREE.Vector3(
                        hero.position.x + Math.cos(angle) * distance,
                        hero.position.y + Math.sin(angle) * distance,
                        hero.position.z
                      );
                      const velocity = new THREE.Vector3(Math.cos(angle) * 0.03, Math.sin(angle) * 0.03, 0);
                      const particleColor = new THREE.Color(0x00ff88);
                      trail.createVillainParticle(particlePos, particleColor, velocity);
                    }
                    setTimeout(() => { 
                      healEffect.style.opacity = '1';
                      setTimeout(() => {
                        healEffect.style.opacity = '0';
                        setTimeout(() => {
                          document.getElementById('renderDiv').removeChild(healEffect);
                        }, 500);
                      }, 2000);
                    }, 10);
                  }
                }
              }
            });
            if (hasAttacked) {
              hero.lastAttack = now;
              hero.smokeBombsCount--;
              updateSmokeBombCounter();
              if (hero.smokeBombsCount <= 0) {
                const outOfBombsNotification = document.createElement('div');
                Object.assign(outOfBombsNotification.style, {
                  position: 'absolute',
                  top: '40%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '24px',
                  color: '#ff3333',
                  textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
                  zIndex: '100',
                  opacity: '0',
                  transition: 'opacity 0.3s'
                });
                outOfBombsNotification.innerHTML = 'OUT OF SMOKE BOMBS!';
                document.getElementById('renderDiv').appendChild(outOfBombsNotification);
                setTimeout(() => { 
                  outOfBombsNotification.style.opacity = '1';
                  setTimeout(() => {
                    outOfBombsNotification.style.opacity = '0';
                    setTimeout(() => {
                      document.getElementById('renderDiv').removeChild(outOfBombsNotification);
                    }, 300);
                  }, 1500);
                }, 10);
                const now = Date.now();
                if (now - hero.lastSmokeBombRespawn > hero.smokeBombRespawnCooldown) {
                  spawnSmokeBombOnFirstRooftop();
                  hero.lastSmokeBombRespawn = now;
                }
              }
            }
          }
        }
        if (hasAttacked) {
          const originalColor = heroSprite.material.color.clone();
          const originalGlowColor = heroGlowSprite.material.color.clone();
          const originalGlowOpacity = heroGlowSprite.material.opacity;
          heroSprite.material.color.set(0xffffff);
          heroGlowSprite.material.color.set(0x00ffff);
          heroGlowSprite.material.opacity = 0.6;
          setTimeout(() => {
            heroSprite.material.color.copy(originalColor);
            heroGlowSprite.material.color.copy(originalGlowColor);
            heroGlowSprite.material.opacity = originalGlowOpacity;
          }, 150);
        }
      }
      updateHealthBarFunc(hero.health);
      if (hero.isInvulnerable) {
        const flashRate = 150;
        const now = Date.now();
        const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
        heroSprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
        if (now - hero.lastHit > hero.invulnerableTime) {
          hero.isInvulnerable = false;
          heroSprite.material.opacity = 1.0;
        }
      }
      minions.forEach(minion => {
        if (minion.active) {
          const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;
          minion.group.children[0].position.y = hoverAmount;
          minion.group.children[1].position.y = hoverAmount;
          minion.healthBar.position.y = 2.0 + hoverAmount;
          minion.group.children[2].position.y = 2.0 + hoverAmount;
          const minionSprite = minion.group.children[0];
          const minionGlow = minion.group.children[1];
          if (minion.group.position.x > hero.position.x) {
            minionSprite.scale.x = -Math.abs(minionSprite.scale.x);
            minionGlow.scale.x = -Math.abs(minionGlow.scale.x);
          } else {
            minionSprite.scale.x = Math.abs(minionSprite.scale.x);
            minionGlow.scale.x = Math.abs(minionGlow.scale.x);
          }
          const now = Date.now();
          const attackDistance = 2.5;
          const distance = Math.abs(hero.position.x - minion.group.position.x);
          if (distance < attackDistance && now - minion.lastHit > minion.hitCooldown) {
            minion.lastHit = now;
            if (!hero.isInvulnerable) {
              hero.health -= 10;
              hero.lastHit = now;
              hero.isInvulnerable = true;
              updateHealthBarFunc(hero.health);
              const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;
              const projectileGeometry = new THREE.PlaneGeometry(1.0, 0.4);
              const projectileMaterial = new THREE.MeshBasicMaterial({
                color: 0xff3333,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
              });
              const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
              projectile.position.set(minion.group.position.x + (attackDirection * 0.7), minion.group.position.y, 0);
              projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 : Math.PI / 6;
              scene.add(projectile);
              const trailObj = new THREE.Mesh(
                new THREE.PlaneGeometry(0.6, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 0.5 })
              );
              trailObj.position.copy(projectile.position);
              trailObj.position.x -= attackDirection * 0.5;
              trailObj.rotation.z = projectile.rotation.z;
              scene.add(trailObj);
              const projectileStartTime = Date.now();
              const projectileDuration = 300;
              const startX = projectile.position.x;
              const targetX = hero.position.x;
              const totalDistance = targetX - startX;
              (function animateProjectile() {
                const elapsed = Date.now() - projectileStartTime;
                if (elapsed < projectileDuration) {
                  const progress = elapsed / projectileDuration;
                  projectile.position.x = startX + (progress * totalDistance);
                  projectile.position.y = hero.position.y + Math.sin(progress * Math.PI) * 0.5;
                  projectile.material.rotation += 0.1;
                  for (let i = 0; i < particles.length; i++) {
                    const particle = particles[i];
                    const particleProgress = Math.max(0, progress - (i * 0.05));
                    if (particleProgress > 0) {
                      particle.position.x = startX + (particleProgress * totalDistance);
                      particle.position.y = hero.position.y + Math.sin(particleProgress * Math.PI) * 0.5;
                      particle.material.opacity = 0.4 * (1 - particleProgress);
                      const scale = 0.3 * (1 - particleProgress * 0.7);
                      particle.scale.set(scale, scale, 1);
                    }
                  }
                  requestAnimationFrame(animateProjectile);
                } else {
                  const smokeParticleCount = 20;
                  const smokeParticles = [];
                  for (let i = 0; i < smokeParticleCount; i++) {
                    const smokeMaterial = new THREE.SpriteMaterial({
                      map: smokeBombTexture,
                      transparent: true,
                      opacity: 0.8,
                      color: new THREE.Color(0xaaffff)
                    });
                    const smokeParticle = new THREE.Sprite(smokeMaterial);
                    const size = 0.3 + Math.random() * 0.7;
                    smokeParticle.scale.set(size, size, 1);
                    smokeParticle.position.set(
                      minion.group.position.x + (Math.random() - 0.5) * 1.2,
                      minion.group.position.y + (Math.random() - 0.5) * 1.2,
                      minion.group.position.z + (Math.random() - 0.5) * 0.2
                    );
                    smokeParticle.userData = {
                      velocity: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, 0),
                      rotation: Math.random() * 0.1 - 0.05
                    };
                    scene.add(smokeParticle);
                    smokeParticles.push(smokeParticle);
                  }
                  const smokeStartTime = Date.now();
                  const smokeDuration = 800;
                  (function animateSmoke() {
                    const smokeElapsed = Date.now() - smokeStartTime;
                    if (smokeElapsed < smokeDuration) {
                      const smokeProgress = smokeElapsed / smokeDuration;
                      smokeParticles.forEach(particle => {
                        particle.position.add(particle.userData.velocity);
                        particle.position.y += 0.005;
                        particle.material.rotation += particle.userData.rotation;
                        const expansion = 1 + smokeProgress * 0.5;
                        particle.scale.x = particle.scale.x * expansion;
                        particle.scale.y = particle.scale.y * expansion;
                        particle.material.opacity = 0.8 * (1 - Math.pow(smokeProgress, 2));
                      });
                      requestAnimationFrame(animateSmoke);
                    } else {
                      smokeParticles.forEach(particle => scene.remove(particle));
                    }
                  })();
                  scene.remove(projectile);
                  particles.forEach(particle => scene.remove(particle));
                }
              })();
              const originalColor = heroSprite.material.color.clone();
              const originalGlowColor = heroGlowSprite.material.color.clone();
              const originalGlowOpacity = heroGlowSprite.material.opacity;
              heroSprite.material.color.set(0xffffff);
              heroGlowSprite.material.color.set(0x00ffff);
              heroGlowSprite.material.opacity = 0.6;
              setTimeout(() => {
                heroSprite.material.color.copy(originalColor);
                heroGlowSprite.material.color.copy(originalGlowColor);
                heroGlowSprite.material.opacity = originalGlowOpacity;
              }, 150);
            }
          }
        }
        updateHealthBarFunc(hero.health);
        if (hero.isInvulnerable) {
          const flashRate = 150;
          const now = Date.now();
          const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
          heroSprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
          if (now - hero.lastHit > hero.invulnerableTime) {
            hero.isInvulnerable = false;
            heroSprite.material.opacity = 1.0;
          }
        }
        minions.forEach(minion => {
          if (minion.active) {
            const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;
            minion.group.children[0].position.y = hoverAmount;
            minion.group.children[1].position.y = hoverAmount;
            minion.healthBar.position.y = 2.0 + hoverAmount;
            minion.group.children[2].position.y = 2.0 + hoverAmount;
            const minionSprite = minion.group.children[0];
            const minionGlow = minion.group.children[1];
            if (minion.group.position.x > hero.position.x) {
              minionSprite.scale.x = -Math.abs(minionSprite.scale.x);
              minionGlow.scale.x = -Math.abs(minionGlow.scale.x);
            } else {
              minionSprite.scale.x = Math.abs(minionSprite.scale.x);
              minionGlow.scale.x = Math.abs(minionGlow.scale.x);
            }
            const now = Date.now();
            const attackDistance = 2.5;
            const distance = Math.abs(hero.position.x - minion.group.position.x);
            if (distance < attackDistance && now - minion.lastHit > minion.hitCooldown) {
              minion.lastHit = now;
              if (!hero.isInvulnerable) {
                hero.health -= 10;
                hero.lastHit = now;
                hero.isInvulnerable = true;
                updateHealthBarFunc(hero.health);
                const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;
                const projectileGeometry = new THREE.PlaneGeometry(1.0, 0.4);
                const projectileMaterial = new THREE.MeshBasicMaterial({
                  color: 0xff3333,
                  transparent: true,
                  opacity: 0.9,
                  side: THREE.DoubleSide
                });
                const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
                projectile.position.set(minion.group.position.x + (attackDirection * 0.7), minion.group.position.y, 0);
                projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 : Math.PI / 6;
                scene.add(projectile);
                const trail = new THREE.Mesh(
                  new THREE.PlaneGeometry(0.6, 0.3),
                  new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 0.5 })
                );
                trail.position.copy(projectile.position);
                trail.position.x -= attackDirection * 0.5;
                trail.rotation.z = projectile.rotation.z;
                scene.add(trail);
                const projectileStartTime = Date.now();
                const projectileDuration = 300;
                const startX = projectile.position.x;
                const targetX = hero.position.x;
                const totalDistance = targetX - startX;
                (function animateProjectile() {
                  const elapsed = Date.now() - projectileStartTime;
                  if (elapsed < projectileDuration) {
                    const progress = elapsed / projectileDuration;
                    projectile.position.x = startX + (progress * totalDistance);
                    projectile.position.y = hero.position.y + Math.sin(progress * Math.PI) * 0.5;
                    projectile.material.rotation += 0.1;
                    for (let i = 0; i < particles.length; i++) {
                      const particle = particles[i];
                      const particleProgress = Math.max(0, progress - (i * 0.05));
                      if (particleProgress > 0) {
                        particle.position.x = startX + (particleProgress * totalDistance);
                        particle.position.y = hero.position.y + Math.sin(particleProgress * Math.PI) * 0.5;
                        particle.material.opacity = 0.4 * (1 - particleProgress);
                        const scale = 0.3 * (1 - particleProgress * 0.7);
                        particle.scale.set(scale, scale, 1);
                      }
                    }
                    requestAnimationFrame(animateProjectile);
                  } else {
                    const smokeParticleCount = 20;
                    const smokeParticles = [];
                    for (let i = 0; i < smokeParticleCount; i++) {
                      const smokeMaterial = new THREE.SpriteMaterial({
                        map: smokeBombTexture,
                        transparent: true,
                        opacity: 0.8,
                        color: new THREE.Color(0xaaffff)
                      });
                      const smokeParticle = new THREE.Sprite(smokeMaterial);
                      const size = 0.3 + Math.random() * 0.7;
                      smokeParticle.scale.set(size, size, 1);
                      smokeParticle.position.set(
                        minion.group.position.x + (Math.random() - 0.5) * 1.2,
                        minion.group.position.y + (Math.random() - 0.5) * 1.2,
                        minion.group.position.z + (Math.random() - 0.5) * 0.2
                      );
                      smokeParticle.userData = {
                        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, 0),
                        rotation: Math.random() * 0.1 - 0.05
                      };
                      scene.add(smokeParticle);
                      smokeParticles.push(smokeParticle);
                    }
                    const smokeStartTime = Date.now();
                    const smokeDuration = 800;
                    (function animateSmoke() {
                      const smokeElapsed = Date.now() - smokeStartTime;
                      if (smokeElapsed < smokeDuration) {
                        const smokeProgress = smokeElapsed / smokeDuration;
                        smokeParticles.forEach(particle => {
                          particle.position.add(particle.userData.velocity);
                          particle.position.y += 0.005;
                          particle.material.rotation += particle.userData.rotation;
                          const expansion = 1 + smokeProgress * 0.5;
                          particle.scale.x = particle.scale.x * expansion;
                          particle.scale.y = particle.scale.y * expansion;
                          particle.material.opacity = 0.8 * (1 - Math.pow(smokeProgress, 2));
                        });
                        requestAnimationFrame(animateSmoke);
                      } else {
                        smokeParticles.forEach(particle => scene.remove(particle));
                      }
                    })();
                    scene.remove(projectile);
                    particles.forEach(particle => scene.remove(particle));
                  }
                })();
              }
            }
          }
        });
        if (hasAttacked) {
          hero.lastAttack = now;
          hero.smokeBombsCount--;
          updateSmokeBombCounter();
          if (hero.smokeBombsCount <= 0) {
            const outOfBombsNotification = document.createElement('div');
            Object.assign(outOfBombsNotification.style, {
              position: 'absolute',
              top: '40%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '24px',
              color: '#ff3333',
              textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
              zIndex: '100',
              opacity: '0',
              transition: 'opacity 0.3s'
            });
            outOfBombsNotification.innerHTML = 'OUT OF SMOKE BOMBS!';
            document.getElementById('renderDiv').appendChild(outOfBombsNotification);
            setTimeout(() => { 
              outOfBombsNotification.style.opacity = '1';
              setTimeout(() => {
                outOfBombsNotification.style.opacity = '0';
                setTimeout(() => {
                  document.getElementById('renderDiv').removeChild(outOfBombsNotification);
                }, 300);
              }, 1500);
            }, 10);
            const now = Date.now();
            if (now - hero.lastSmokeBombRespawn > hero.smokeBombRespawnCooldown) {
              spawnSmokeBombOnFirstRooftop();
              hero.lastSmokeBombRespawn = now;
            }
          }
        }
      }
      if (hasAttacked) {
        const originalColor = heroSprite.material.color.clone();
        const originalGlowColor = heroGlowSprite.material.color.clone();
        const originalGlowOpacity = heroGlowSprite.material.opacity;
        heroSprite.material.color.set(0xffffff);
        heroGlowSprite.material.color.set(0x00ffff);
        heroGlowSprite.material.opacity = 0.6;
        setTimeout(() => {
          heroSprite.material.color.copy(originalColor);
          heroGlowSprite.material.color.copy(originalGlowColor);
          heroGlowSprite.material.opacity = originalGlowOpacity;
        }, 150);
      }
    }
    updateHealthBarFunc(hero.health);
    if (hero.isInvulnerable) {
      const flashRate = 150;
      const now = Date.now();
      const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
      heroSprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
      if (now - hero.lastHit > hero.invulnerableTime) {
        hero.isInvulnerable = false;
        heroSprite.material.opacity = 1.0;
      }
    }
    minions.forEach(minion => {
      if (minion.active) {
        const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;
        minion.group.children[0].position.y = hoverAmount;
        minion.group.children[1].position.y = hoverAmount;
        minion.healthBar.position.y = 2.0 + hoverAmount;
        minion.group.children[2].position.y = 2.0 + hoverAmount;
        const minionSprite = minion.group.children[0];
        const minionGlow = minion.group.children[1];
        if (minion.group.position.x > hero.position.x) {
          minionSprite.scale.x = -Math.abs(minionSprite.scale.x);
          minionGlow.scale.x = -Math.abs(minionGlow.scale.x);
        } else {
          minionSprite.scale.x = Math.abs(minionSprite.scale.x);
          minionGlow.scale.x = Math.abs(minionGlow.scale.x);
        }
        const now = Date.now();
        const attackDistance = 2.5;
        const distance = Math.abs(hero.position.x - minion.group.position.x);
        if (distance < attackDistance && now - minion.lastHit > minion.hitCooldown) {
          minion.lastHit = now;
          if (!hero.isInvulnerable) {
            hero.health -= 10;
            hero.lastHit = now;
            hero.isInvulnerable = true;
            updateHealthBarFunc(hero.health);
            const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;
            const projectileGeometry = new THREE.PlaneGeometry(1.0, 0.4);
            const projectileMaterial = new THREE.MeshBasicMaterial({
              color: 0xff3333,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide
            });
            const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            projectile.position.set(minion.group.position.x + (attackDirection * 0.7), minion.group.position.y, 0);
            projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 : Math.PI / 6;
            scene.add(projectile);
            const trailObj = new THREE.Mesh(
              new THREE.PlaneGeometry(0.6, 0.3),
              new THREE.MeshBasicMaterial({ color: 0x880000, transparent: true, opacity: 0.5 })
            );
            trailObj.position.copy(projectile.position);
            trailObj.position.x -= attackDirection * 0.5;
            trailObj.rotation.z = projectile.rotation.z;
            scene.add(trailObj);
            const projectileStartTime = Date.now();
            const projectileDuration = 300;
            const startX = projectile.position.x;
            const targetX = hero.position.x;
            const totalDistance = targetX - startX;
            (function animateProjectile() {
              const elapsed = Date.now() - projectileStartTime;
              if (elapsed < projectileDuration) {
                const progress = elapsed / projectileDuration;
                projectile.position.x = startX + (progress * totalDistance);
                trailObj.position.x = projectile.position.x - (attackDirection * 0.5);
                if (elapsed % 40 < 20) {
                  projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 - 0.1 : Math.PI / 6 + 0.1;
                  projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
                } else {
                  projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 + 0.1 : Math.PI / 6 - 0.1;
                  projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
                }
                trailObj.material.opacity = 0.5 * (1 - progress);
                requestAnimationFrame(animateProjectile);
              } else {
                const impactEffect = new THREE.Mesh(
                  new THREE.CircleGeometry(0.8, 16),
                  new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.8 })
                );
                impactEffect.position.set(hero.position.x, hero.position.y, 0);
                scene.add(impactEffect);
                const impactStartTime = Date.now();
                const impactDuration = 150;
                (function animateImpact() {
                  const impactElapsed = Date.now() - impactStartTime;
                  if (impactElapsed < impactDuration) {
                    const impactProgress = impactElapsed / impactDuration;
                    impactEffect.scale.set(1 + impactProgress * 2, 1 + impactProgress * 2, 1);
                    impactEffect.material.opacity = 0.8 * (1 - impactProgress);
                    requestAnimationFrame(animateImpact);
                  } else {
                    scene.remove(impactEffect);
                  }
                })();
                scene.remove(projectile);
                scene.remove(trailObj);
              }
            })();
            const hitNotification = document.createElement('div');
            Object.assign(hitNotification.style, {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '28px',
              color: '#ff3333',
              textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
              zIndex: '100',
              opacity: '0',
              transition: 'opacity 0.3s',
              pointerEvents: 'none'
            });
            hitNotification.innerHTML = '-10 HP';
            document.getElementById('renderDiv').appendChild(hitNotification);
            setTimeout(() => {
              hitNotification.style.opacity = '1';
              setTimeout(() => {
                hitNotification.style.opacity = '0';
                setTimeout(() => {
                  document.getElementById('renderDiv').removeChild(hitNotification);
                }, 300);
              }, 500);
            }, 10);
          }
        }
      });
      if (enemyInRange && !document.getElementById('attackPrompt')) {
        const attackPrompt = document.createElement('div');
        attackPrompt.id = 'attackPrompt';
        Object.assign(attackPrompt.style, {
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '20px',
          color: '#ff3333',
          textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
          zIndex: '100',
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '10px',
          pointerEvents: 'none'
        });
        attackPrompt.innerHTML = hero.hasSmokeAttack ? `ENEMY IN RANGE! Press E or F to attack (${hero.smokeBombsCount} bombs left)` : 'ENEMY IN RANGE! Find smoke bombs to attack';
        document.getElementById('renderDiv').appendChild(attackPrompt);
      } else if (!enemyInRange && document.getElementById('attackPrompt')) {
        const attackPrompt = document.getElementById('attackPrompt');
        document.getElementById('renderDiv').removeChild(attackPrompt);
      }
    // Update frustum for culling
    _matrix4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_matrix4);
    // Only render visible objects
    scene.traverse(object => {
        if (object.isMesh) {
            object.visible = _frustum.containsPoint(object.position);
        }
    });
    renderer.render(scene, camera);
    }
    function createDodgeEffect() {
      const dodgeEffect = new THREE.Mesh(
        new THREE.CircleGeometry(1, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      dodgeEffect.position.set(hero.position.x, hero.position.y - 0.5, hero.position.z);
      dodgeEffect.rotation.x = -Math.PI / 2;
      scene.add(dodgeEffect);
      const startTime = Date.now();
      (function animateDodgeEffect() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
          dodgeEffect.scale.set(1 + elapsed / 100, 1 + elapsed / 100, 1);
          dodgeEffect.material.opacity = 0.5 * (1 - elapsed / 300);
          requestAnimationFrame(animateDodgeEffect);
        } else {
          scene.remove(dodgeEffect);
        }
      })();
    }
    function createSmokeBombCounter() {
      const counterContainer = document.createElement('div');
      counterContainer.id = 'smokeBombCounter';
      Object.assign(counterContainer.style, {
        position: 'absolute',
        top: '60px',
        right: '20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 10, 20, 0.7)',
        padding: '5px 10px',
        borderRadius: '5px',
        border: '1px solid #00ffff',
        zIndex: '100'
      });
      const bombIcon = document.createElement('div');
      bombIcon.id = 'smokeBombIcon';
      Object.assign(bombIcon.style, {
        width: '30px',
        height: '30px',
        backgroundImage: `url(${smokeBombTexture.source.data.src})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        marginRight: '10px'
      });
      const bombCount = document.createElement('div');
      bombCount.id = 'smokeBombCount';
      Object.assign(bombCount.style, {
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '24px',
        color: '#00ffff',
        textShadow: '0 0 5px rgba(0, 255, 255, 0.8)',
        minWidth: '40px',
        textAlign: 'center'
      });
      bombCount.textContent = `x${hero.smokeBombsCount}`;
      counterContainer.appendChild(bombIcon);
      counterContainer.appendChild(bombCount);
      document.getElementById('renderDiv').appendChild(counterContainer);
    }
    function updateSmokeBombCounter() {
      const bombCount = document.getElementById('smokeBombCount');
      if (bombCount) {
        bombCount.textContent = `x${hero.smokeBombsCount}`;
        if (hero.smokeBombsCount <= 1) {
          bombCount.style.color = '#ff3333';
          bombCount.style.textShadow = '0 0 5px rgba(255, 51, 51, 0.8)';
        } else {
          bombCount.style.color = '#00ffff';
          bombCount.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.8)';
        }
        bombCount.style.animation = 'none';
        void bombCount.offsetWidth;
        bombCount.style.animation = 'pulseBombCount 0.5s ease-in-out';
      }
    }
    function createAfterimage() {
      const afterimageSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: ninjaTexture, transparent: true, opacity: 0.3, color: 0x00ffff }));
      afterimageSprite.scale.copy(heroSprite.scale);
      afterimageSprite.position.set(hero.position.x, hero.position.y, hero.position.z);
      scene.add(afterimageSprite);
      const startTime = Date.now();
      (function fadeAfterimage() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 200) {
          afterimageSprite.material.opacity = 0.3 * (1 - elapsed / 200);
          requestAnimationFrame(fadeAfterimage);
        } else {
          scene.remove(afterimageSprite);
        }
      })();
    }
    function showMathQuiz() {
      const mathQuestions = [
        { question: "What is 8 × 7?", options: ["54", "56", "64", "72"], correctAnswer: "56" },
        { question: "Solve: 15 + 26 - 13", options: ["18", "28", "38", "48"], correctAnswer: "28" },
        { question: "What is 125 ÷ 5?", options: ["20", "25", "35", "45"], correctAnswer: "25" }
      ];
      let currentQuestionIndex = 0, correctAnswers = 0;
      const quizContainer = document.createElement('div');
      quizContainer.id = 'mathQuizContainer';
      Object.assign(quizContainer.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        maxWidth: '500px',
        backgroundColor: 'rgba(0, 10, 20, 0.95)',
        borderRadius: '10px',
        border: '2px solid #00ffff',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
        padding: '20px',
        zIndex: '1000',
        fontFamily: "'Orbitron', sans-serif",
        color: '#ffffff',
        textAlign: 'center'
      });
      const title = document.createElement('h2');
      title.textContent = 'Ninja Math Challenge';
      Object.assign(title.style, {
        color: '#00ffff',
        marginTop: '0',
        fontSize: '24px',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
      });
      quizContainer.appendChild(title);
      const subtitle = document.createElement('p');
      subtitle.textContent = 'Answer correctly to earn smoke bombs!';
      Object.assign(subtitle.style, { color: '#aaffff', fontSize: '16px', marginBottom: '20px' });
      quizContainer.appendChild(subtitle);
      const questionContainer = document.createElement('div');
      questionContainer.id = 'questionContainer';
      quizContainer.appendChild(questionContainer);
      function showQuestion(index) {
        questionContainer.innerHTML = '';
        const progress = document.createElement('div');
        progress.textContent = `Question ${index + 1} of ${mathQuestions.length}`;
        Object.assign(progress.style, { color: '#aaffff', fontSize: '14px', marginBottom: '15px' });
        questionContainer.appendChild(progress);
        const questionText = document.createElement('div');
        questionText.textContent = mathQuestions[index].question;
        Object.assign(questionText.style, { fontSize: '22px', marginBottom: '20px', fontWeight: 'bold' });
        questionContainer.appendChild(questionText);
        const optionsContainer = document.createElement('div');
        Object.assign(optionsContainer.style, { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' });
        mathQuestions[index].options.forEach(option => {
          const optionButton = document.createElement('button');
          optionButton.textContent = option;
          Object.assign(optionButton.style, { backgroundColor: 'rgba(0, 50, 80, 0.8)', border: '2px solid #0088aa', borderRadius: '5px', padding: '10px', color: 'white', fontSize: '18px', cursor: 'pointer', transition: 'all 0.2s' });
          optionButton.addEventListener('mouseover', () => {
            optionButton.style.backgroundColor = 'rgba(0, 70, 100, 0.8)';
            optionButton.style.borderColor = '#00ffff';
          });
          optionButton.addEventListener('mouseout', () => {
            optionButton.style.backgroundColor = 'rgba(0, 50, 80, 0.8)';
            optionButton.style.borderColor = '#0088aa';
          });
          optionButton.addEventListener('click', () => {
            const isCorrect = option === mathQuestions[index].correctAnswer;
            const allButtons = optionsContainer.querySelectorAll('button');
            allButtons.forEach(btn => { btn.disabled = true; btn.style.cursor = 'default'; btn.style.opacity = '0.7'; });
            if (isCorrect) {
              optionButton.style.backgroundColor = 'rgba(0, 150, 50, 0.8)';
              optionButton.style.borderColor = '#00ff00';
              correctAnswers++;
            } else {
              optionButton.style.backgroundColor = 'rgba(150, 0, 0, 0.8)';
              optionButton.style.borderColor = '#ff0000';
              allButtons.forEach(btn => { if (btn.textContent === mathQuestions[index].correctAnswer) { btn.style.backgroundColor = 'rgba(0, 150, 50, 0.8)'; btn.style.borderColor = '#00ff00'; } });
            }
            const feedback = document.createElement('div');
            feedback.textContent = isCorrect ? 'Correct! +2 Smoke Bombs' : 'Incorrect!';
            Object.assign(feedback.style, { color: isCorrect ? '#00ff00' : '#ff3333', fontSize: '18px', fontWeight: 'bold', marginTop: '10px', marginBottom: '10px' });
            questionContainer.appendChild(feedback);
            const nextButton = document.createElement('button');
            nextButton.textContent = currentQuestionIndex < mathQuestions.length - 1 ? 'Next Question' : 'Finish';
            Object.assign(nextButton.style, { backgroundColor: 'rgba(0, 100, 150, 0.8)', border: '2px solid #00ffff', borderRadius: '5px', padding: '10px 20px', color: 'white', fontSize: '16px', cursor: 'pointer', margin: '10px auto', display: 'block', transition: 'all 0.2s' });
            nextButton.addEventListener('mouseover', () => { nextButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)'; });
            nextButton.addEventListener('mouseout', () => { nextButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)'; });
            nextButton.addEventListener('click', () => { if (currentQuestionIndex < mathQuestions.length - 1) { currentQuestionIndex++; showQuestion(currentQuestionIndex); } else { finishQuiz(); } });
            questionContainer.appendChild(nextButton);
          });
          optionsContainer.appendChild(optionButton);
        });
        questionContainer.appendChild(optionsContainer);
      }
      function finishQuiz() {
        questionContainer.innerHTML = '';
        const earnedSmokeBombs = correctAnswers * 2;
        const resultsContainer = document.createElement('div');
        Object.assign(resultsContainer.style, { textAlign: 'center', padding: '20px' });
        const resultsTitle = document.createElement('h3');
        resultsTitle.textContent = 'Quiz Complete!';
        Object.assign(resultsTitle.style, { color: '#00ffff', fontSize: '22px', marginBottom: '10px' });
        resultsContainer.appendChild(resultsTitle);
        const scoreText = document.createElement('p');
        scoreText.textContent = `You answered ${correctAnswers} out of ${mathQuestions.length} questions correctly.`;
        Object.assign(scoreText.style, { fontSize: '18px', marginBottom: '15px' });
        resultsContainer.appendChild(scoreText);
        const bombsEarned = document.createElement('p');
        bombsEarned.innerHTML = `<span style="color: #00ffff; font-size: 24px; font-weight: bold;">${earnedSmokeBombs}</span> smoke bombs earned!`;
        Object.assign(bombsEarned.style, { fontSize: '18px', marginBottom: '20px' });
        resultsContainer.appendChild(bombsEarned);
        const continueButton = document.createElement('button');
        continueButton.textContent = 'Continue Game';
        Object.assign(continueButton.style, { backgroundColor: 'rgba(0, 100, 150, 0.8)', border: '2px solid #00ffff', borderRadius: '5px', padding: '12px 24px', color: 'white', fontSize: '18px', cursor: 'pointer', margin: '10px auto', display: 'block', transition: 'all 0.2s' });
        continueButton.addEventListener('mouseover', () => { continueButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)'; });
        continueButton.addEventListener('mouseout', () => { continueButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)'; });
        continueButton.addEventListener('click', () => {
          document.getElementById('renderDiv').removeChild(quizContainer);
          movementLocked = false;
          hero.hasSmokeAttack = true;
          hero.smokeBombsCount = earnedSmokeBombs;
          const collectNotification = document.createElement('div');
          Object.assign(collectNotification.style, {
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '24px',
            color: '#00ffff',
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            zIndex: '100',
            opacity: '0',
            transition: 'opacity 0.3s'
          });
          collectNotification.innerHTML = `${earnedSmokeBombs} SMOKE BOMBS ACQUIRED!<br><span style="font-size: 18px">Use E or F to attack minions</span>`;
          document.getElementById('renderDiv').appendChild(collectNotification);
          setTimeout(() => { 
            collectNotification.style.opacity = '1';
            setTimeout(() => {
              collectNotification.style.opacity = '0';
              setTimeout(() => { document.getElementById('renderDiv').removeChild(collectNotification); }, 300);
            }, 2000);
          }, 10);
          if (document.getElementById('smokeBombCounter')) { updateSmokeBombCounter(); } else { createSmokeBombCounter(); }
        });
        resultsContainer.appendChild(continueButton);
        questionContainer.appendChild(resultsContainer);
      }
      showQuestion(currentQuestionIndex);
      document.getElementById('renderDiv').appendChild(quizContainer);
    }
    function spawnSmokeBombOnFirstRooftop() {
      const xPos = -5 + Math.random() * 15;
      const yPos = 1.5;
      const arrowIndicator = createSmokeArrowIndicator(xPos, yPos);
      const respawnedBomb = { group: new THREE.Group(), collected: false };
      const smokeBombMaterial = new THREE.SpriteMaterial({ map: smokeBombTexture, transparent: true, opacity: 1.0 });
      const smokeBombSprite = new THREE.Sprite(smokeBombMaterial);
      smokeBombSprite.scale.set(1.2, 1.2, 1);
      respawnedBomb.group.add(smokeBombSprite);
      const glowMaterial = new THREE.SpriteMaterial({ map: smokeBombTexture, transparent: true, color: 0x00ffff, opacity: 0.5 });
      const glowSprite = new THREE.Sprite(glowMaterial);
      glowSprite.scale.set(1.5, 1.5, 1);
      respawnedBomb.group.add(glowSprite);
      respawnedBomb.group.position.set(xPos, yPos, 0);
      scene.add(respawnedBomb.group);
      const startY = respawnedBomb.group.position.y;
      const respawnEffect = new THREE.Mesh(
        new THREE.CircleGeometry(2, 16),
        new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
      );
      respawnEffect.position.set(xPos, startY - 0.5, 0);
      respawnEffect.rotation.x = -Math.PI / 2;
      scene.add(respawnEffect);
      const startTime = Date.now();
      (function expandRespawnEffect() {
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
          respawnEffect.scale.set(1 + elapsed / 200, 1 + elapsed / 200, 1);
          respawnEffect.material.opacity = 0.7 * (1 - elapsed / 800);
          requestAnimationFrame(expandRespawnEffect);
        } else {
          scene.remove(respawnEffect);
        }
      })();
      const respawnNotification = document.createElement('div');
      Object.assign(respawnNotification.style, {
        position: 'absolute',
        top: '10%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '22px',
        color: '#00ffff',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
        zIndex: '100',
        opacity: '0',
        transition: 'opacity 0.3s',
        backgroundColor: 'rgba(0, 10, 20, 0.7)',
        padding: '10px 20px',
        borderRadius: '5px'
      });
      respawnNotification.innerHTML = 'SMOKE BOMB RESPAWNED!<br><span style="font-size: 16px">Return to first rooftop</span>';
      document.getElementById('renderDiv').appendChild(respawnNotification);
      setTimeout(() => { 
        respawnNotification.style.opacity = '1';
        setTimeout(() => {
          respawnNotification.style.opacity = '0';
          setTimeout(() => { document.getElementById('renderDiv').removeChild(respawnNotification); }, 300);
        }, 2000);
      }, 10);
      function animateRespawnedBomb() {
        if (respawnedBomb.collected) return;
        respawnedBomb.group.position.y = startY + Math.sin(Date.now() * 0.003) * 0.5;
        glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
        smokeBombSprite.material.rotation += 0.01;
        glowSprite.material.rotation += 0.005;
        const distance = Math.sqrt(Math.pow(hero.position.x - respawnedBomb.group.position.x, 2) + Math.pow(hero.position.y - respawnedBomb.group.position.y, 2));
        if (distance < 1.5 && !respawnedBomb.collected) {
          respawnedBomb.collected = true;
          respawnedBomb.group.visible = false;
          const collectionEffect = new THREE.Mesh(
            new THREE.CircleGeometry(1, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
          );
          collectionEffect.position.copy(respawnedBomb.group.position);
          collectionEffect.rotation.x = -Math.PI / 2;
          scene.add(collectionEffect);
          const collectStartTime = Date.now();
          (function expandCollectEffect() {
            const elapsed = Date.now() - collectStartTime;
            if (elapsed < 500) {
              collectionEffect.scale.set(1 + elapsed / 100, 1 + elapsed / 100, 1);
              collectionEffect.material.opacity = 0.8 * (1 - elapsed / 500);
              requestAnimationFrame(expandCollectEffect);
            } else {
              scene.remove(collectionEffect);
            }
          })();
          movementLocked = true;
          const arrowIndicator = document.getElementById('smokeArrowIndicator');
          if (arrowIndicator) { document.getElementById('renderDiv').removeChild(arrowIndicator); }
          showMathQuiz();
          return;
        }
        requestAnimationFrame(animateRespawnedBomb);
      }
      animateRespawnedBomb();
      return { bomb: respawnedBomb, position: { x: xPos, y: yPos, z: 0 } };
    }
    function createSmokeArrowIndicator(targetX, targetY) {
      const arrowContainer = document.createElement('div');
      arrowContainer.id = 'smokeArrowIndicator';
      Object.assign(arrowContainer.style, {
        position: 'absolute',
        width: '40px',
        height: '40px',
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        border: '2px solid #00ffff',
        borderRadius: '50%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '100',
        pointerEvents: 'none',
        opacity: '0',
        transition: 'opacity 0.3s'
      });
      const arrow = document.createElement('div');
      Object.assign(arrow.style, {
        width: '0',
        height: '0',
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderBottom: '20px solid #00ffff',
        transform: 'rotate(0deg)',
        transformOrigin: 'center'
      });
      arrowContainer.appendChild(arrow);
      document.getElementById('renderDiv').appendChild(arrowContainer);
      function updateArrowIndicator() {
        if (hero.hasSmokeAttack && hero.smokeBombsCount <= 1) {
          arrowContainer.style.opacity = '1';
          const targetVector = new THREE.Vector3(targetX, targetY, 0);
          const screenPosition = worldToScreen(targetVector);
          const playerScreenPos = worldToScreen(new THREE.Vector3(hero.position.x, hero.position.y, 0));
          const dx = screenPosition.x - playerScreenPos.x;
          const dy = screenPosition.y - playerScreenPos.y;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const margin = 100;
          let arrowX, arrowY;
          const isOffScreen = screenPosition.x < margin || screenPosition.x > window.innerWidth - margin || screenPosition.y < margin || screenPosition.y > window.innerHeight - margin;
          if (isOffScreen) {
            const screenCenterX = window.innerWidth / 2;
            const screenCenterY = window.innerHeight / 2;
            const targetAngle = Math.atan2(screenPosition.y - screenCenterY, screenPosition.x - screenCenterX);
            const edgeRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - margin;
            arrowX = screenCenterX + Math.cos(targetAngle) * edgeRadius;
            arrowY = screenCenterY + Math.sin(targetAngle) * edgeRadius;
          } else {
            arrowX = screenPosition.x;
            arrowY = screenPosition.y - 60;
          }
          arrowContainer.style.left = `${arrowX - 20}px`;
          arrowContainer.style.top = `${arrowY - 20}px`;
          arrow.style.transform = `rotate(${angle - 90}deg)`;
          const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.25 + 0.5;
          arrowContainer.style.transform = `scale(${pulse})`;
        } else {
          arrowContainer.style.opacity = '0';
        }
        requestAnimationFrame(updateArrowIndicator);
      }
      updateArrowIndicator();
      return { element: arrowContainer, update: updateArrowIndicator, remove: function() { document.getElementById('renderDiv').removeChild(arrowContainer); } };
    }
    function worldToScreen(worldVector) {
      const vector = worldVector.clone();
      vector.project(camera);
      return { x: (vector.x * 0.5 + 0.5) * window.innerWidth, y: (-vector.y * 0.5 + 0.5) * window.innerHeight };
    }
    animate(0);
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }, 250);
    });
  }
}

initGame();