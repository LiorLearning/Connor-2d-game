import * as THREE from 'three';

function initGame() {
  // ------------------------------
  // Scene, Camera, Renderer, and Lights
  // ------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050510);
  scene.fog = new THREE.Fog(0x050510, 10, 30);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 3, 8);
  camera.lookAt(0, 2, 0);
  
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'mediump'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
  renderer.shadowMap.enabled = true;
  document.getElementById('renderDiv').appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0x101020);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0x9090ff, 1);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  // ------------------------------
  // Load Textures
  // ------------------------------
  // Create a single texture loader instance
  const textureLoader = new THREE.TextureLoader();
  
  // Set texture loading options for better memory management
  const textureOptions = {
    anisotropy: 1, // Lower anisotropy for better performance
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter
  };
  
  // Load all textures efficiently
  const ninjaTexture = textureLoader.load(
    'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__04_35_45_AM-removebg-preview.png?ilkK',
    undefined, // onLoad callback
    undefined, // onProgress callback
    undefined, // onError callback
    textureOptions
  );
  
  const villainTexture = textureLoader.load(
    'https://play.rosebud.ai/assets/image (19).png?4ziz',
    undefined, undefined, undefined, textureOptions
  );
  
  // Load smoke bomb texture for hero attacks
  const smokeBombTexture = textureLoader.load(
    'https://play.rosebud.ai/assets/ChatGPT_Image_Apr_10__2025__10_51_55_PM-removebg-preview.png?rK7q',
    undefined, undefined, undefined, textureOptions
  );
  
  // Reuse villain texture for minions
  const minionTexture = villainTexture.clone();
  // ------------------------------
  // Game Phase, Movement Lock, and Intro Overlay
  // ------------------------------
  let gamePhase = "intro";
  let movementLocked = false; // When true, the hero’s movement is disabled.

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
  // introOverlay.innerHTML = 
  //   "<h1 style=\"font-size: 48px; margin: 0;\">LIGHTNING BOLT</h1>" +
  //   "<p style=\"font-size: 24px; margin: 10px 0;\">Neon-lit City Ninja Showdown</p>" +
  //   "<p style=\"font-size: 20px; margin: 10px 0;\">A neon-lit city at night with glowing skyscrapers and windy rooftops.</p>" +
  //   "<p style=\"font-size: 18px; margin: 10px 0;\">Watch as our brave ninja stands tall... and a mysterious villain emerges.</p>" +
  //   "<p style=\"font-size: 20px; margin-top: 20px;\">Press Enter to Start</p>";
  // document.getElementById('renderDiv').appendChild(introOverlay);

  // ------------------------------
  // Create Hero: Lightning Bolt (Sprite + Glow)
  // ------------------------------
  const hero = {
    position: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 0, y: 0 },
    grounded: true,
    falling: false,
    group: new THREE.Group(),
    lastAttack: 0, // For attack cooldown
    health: 100,   // Add hero health
    lastHit: 0,    // For invincibility frames after being hit
    invulnerableTime: 1000, // 1 second of invulnerability after being hit
    isInvulnerable: false,
    isDodging: false,
    dodgeSpeed: 0.6, // Increased from 0.4
    dodgeDirection: 0,
    dodgeStartTime: 0,
    dodgeDuration: 250, // Decreased from 300 milliseconds for faster dodge
    dodgeCooldown: 1000, // milliseconds
    lastDodge: 0,
    hasReachedSecondRooftop: false
  };
  
  // Add smoke bomb collection state to hero
  hero.hasSmokeAttack = false;
  hero.smokeBombsCount = 0;
  hero.lastSmokeBombRespawn = 0;
  hero.smokeBombRespawnCooldown = 10000; // 10 seconds between respawns
  const heroMaterial = new THREE.SpriteMaterial({
    map: ninjaTexture,
    transparent: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  const heroSprite = new THREE.Sprite(heroMaterial);
  // Since the hero’s front (the right boundary) is the default,
  // we leave heroSprite.scale.x positive.
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
    // Create container div
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
    
    // Create health fill
    const healthFill = document.createElement('div');
    healthFill.id = 'heroHealthFill';
    Object.assign(healthFill.style, {
      width: '100%',
      height: '100%',
      backgroundColor: '#00ffff',
      transition: 'width 0.3s ease-out'
    });
    
    // Create label
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
    
    // Assemble health bar
    healthContainer.appendChild(healthFill);
    healthContainer.appendChild(healthLabel);
    document.getElementById('renderDiv').appendChild(healthContainer);
    
    // Return update function
    return function updateHealthBar(health) {
      const percentage = Math.max(0, Math.min(100, health));
      healthFill.style.width = `${percentage}%`;
      healthLabel.textContent = `HP: ${Math.round(percentage)}/100`;
      
      // Change color based on health level
      if (percentage > 60) {
        healthFill.style.backgroundColor = '#00ffff'; // Cyan for high health
      } else if (percentage > 30) {
        healthFill.style.backgroundColor = '#ffff00'; // Yellow for medium health
      } else {
        healthFill.style.backgroundColor = '#ff3333'; // Red for low health
      }
    };
  };
  
  // Create and save update function
  const updateHealthBar = createHealthBar();

  // ------------------------------
  // Create Villain: Smoke (Sprite + Red Glow)
  // ------------------------------
  
  // Game state variables
  let minionsFought = 0;
  const totalMinions = 20;
  let minionsSpawned = false;
  
  const villain = {
    group: new THREE.Group()
  };

  const villainMaterial = new THREE.SpriteMaterial({
    map: villainTexture,
    transparent: true,
    alphaTest: 0.1,
    color: 0xffffff
  });
  const villainSprite = new THREE.Sprite(villainMaterial);
  villainSprite.scale.set(3.0, 3.0, 1);
  // Tag the villain’s left boundary as "back" and right as "front".
  // Since the front is on the right by design, to show the villain’s front on the left side,
  // we flip it horizontally by setting a negative scale.x.
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

  // Position the villain on the right for visibility.
  villain.group.position.set(3, 1.5, 0);
  scene.add(villain.group);

  // ------------------------------
  // Speech Bubble for Villain
  // ------------------------------
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

  // ------------------------------
  // Rooftop and Decorative Elements
  // ------------------------------
  // Setup rooftops array to store multiple rooftops
  const rooftops = [];
  
  // Create initial rooftop
  const groundGeometry = new THREE.BoxGeometry(30, 1, 10);
  const groundMaterial = new THREE.MeshPhongMaterial({
    color: 0x005566,
    emissive: 0x003344,
    emissiveIntensity: 0.5,
    shininess: 50
  });
  const initialRooftop = new THREE.Mesh(groundGeometry, groundMaterial);
  initialRooftop.position.set(0, -0.5, 0);
  initialRooftop.userData = {
    id: 0,
    xMin: -15,
    xMax: 15
  };
  scene.add(initialRooftop);
  rooftops.push(initialRooftop);
  
  // Create next rooftop with some gap
  const nextRooftop = new THREE.Mesh(
    new THREE.BoxGeometry(25, 1, 10),
    new THREE.MeshPhongMaterial({
      color: 0x006677,
      emissive: 0x004455,
      emissiveIntensity: 0.6,
      shininess: 60
    })
  );
  // Position the next rooftop with a gap of 5 units
  nextRooftop.position.set(35, -0.5, 0);
  nextRooftop.userData = {
    id: 1,
    xMin: 22.5, // 35 - 12.5
    xMax: 47.5  // 35 + 12.5
  };
  scene.add(nextRooftop);
  rooftops.push(nextRooftop);
  
  // Create minions array to track all minions
  const minions = [];
  
  // Function to create a minion
  function createMinion(x, y, z) {
    const minion = {
      position: { x, y, z },
      health: 100,
      active: true,
      group: new THREE.Group(),
      lastHit: 0,
      hitCooldown: 500 // milliseconds between hits
    };
    
    // Create minion sprite with purple tint to distinguish from main villain
    const minionMaterial = new THREE.SpriteMaterial({
      map: minionTexture,
      transparent: true,
      alphaTest: 0.1,
      color: 0xbbbbff // Slightly different color than main villain
    });
    
    const minionSprite = new THREE.Sprite(minionMaterial);
    minionSprite.scale.set(2.0, 2.0, 1); // Smaller than the main villain
    minionSprite.scale.x = -Math.abs(minionSprite.scale.x); // Face left initially
    minion.group.add(minionSprite);
    
    // Add purple glow
    const minionGlowMaterial = new THREE.SpriteMaterial({
      map: minionTexture,
      transparent: true,
      color: 0x8833ff, // Purple glow to distinguish from red villain glow
      opacity: 0.3
    });
    
    const minionGlowSprite = new THREE.Sprite(minionGlowMaterial);
    minionGlowSprite.scale.set(2.2, 2.2, 1);
    minionGlowSprite.scale.x = -Math.abs(minionGlowSprite.scale.x);
    minion.group.add(minionGlowSprite);
    
    // Position minion
    minion.group.position.set(x, y, z);
    scene.add(minion.group);
    
    // Add health bar
    const healthBarWidth = 1.5;
    const healthBarHeight = 0.15;
    
    // Health bar background (black)
    const healthBarBackground = new THREE.Mesh(
      new THREE.PlaneGeometry(healthBarWidth, healthBarHeight),
      new THREE.MeshBasicMaterial({ color: 0x222222 })
    );
    healthBarBackground.position.set(0, 2.0, 0);
    minion.group.add(healthBarBackground);
    
    // Health bar fill (purple)
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
  jumpBoostIndicator.rotation.x = -Math.PI / 2; // Rotate to lay flat on rooftop
  jumpBoostIndicator.position.set(11, -0.49, 0); // Position at the right edge of first rooftop
  scene.add(jumpBoostIndicator);
  
  // Add pulsing animation to the jump boost indicator
  function animateJumpBoost() {
    requestAnimationFrame(animateJumpBoost);
    jumpBoostMaterial.opacity = 0.1 + Math.abs(Math.sin(Date.now() * 0.002)) * 0.2;
  }
  animateJumpBoost();

  // Create glowing edges for rooftops
  const edgeHeight = 0.3, edgeWidth = 0.3;
  const edgeMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ddff,
    emissive: 0x00aaff,
    emissiveIntensity: 0.6,
    shininess: 30
  });
  
  // Function to add edges to a rooftop
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
  
  // Add edges to each rooftop
  const rooftopEdges = rooftops.map(rooftop => addEdgesToRooftop(rooftop));
  
  // Create smoke bomb collectible
  function createSmokeBombCollectible() {
    const collectibleGroup = new THREE.Group();
    
    // Create smoke bomb sprite
    const smokeBombMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      opacity: 1.0
    });
    
    const smokeBombSprite = new THREE.Sprite(smokeBombMaterial);
    smokeBombSprite.scale.set(1.2, 1.2, 1);
    collectibleGroup.add(smokeBombSprite);
    
    // Add glow effect
    const glowMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      color: 0x00ffff,
      opacity: 0.5
    });
    
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(1.5, 1.5, 1);
    collectibleGroup.add(glowSprite);
    
    // Position in the gap between rooftops, slightly higher to be in jump path
    collectibleGroup.position.set(22.5, 2.0, 0);
    scene.add(collectibleGroup);
    
    // Add floating animation
    const startY = collectibleGroup.position.y;
    
    function animateCollectible() {
      collectibleGroup.position.y = startY + Math.sin(Date.now() * 0.003) * 0.5;
      glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      
      // Rotate slightly
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
        
        // Distance check for collection
        const distance = Math.sqrt(
          Math.pow(playerPos.x - this.group.position.x, 2) + 
          Math.pow(playerPos.y - this.group.position.y, 2)
        );
        
        if (distance < 1.5) {
          return true;
        }
        return false;
      },
      collect: function() {
        this.collected = true;
        this.group.visible = false;
      }
    };
  }
  
  // Create the collectible
  const smokeBombCollectible = createSmokeBombCollectible();

  // Skyline creation with instanced mesh for better performance
  const skyline = (function createNeonSkyline() {
    const skylineGroup = new THREE.Group();
    const buildingCount = 40;
    const buildingWidth = 2;
    const spacing = 2.5;
    
    // Use geometry instancing for similar buildings
    const buildingGeometries = [
      new THREE.BoxGeometry(buildingWidth, 4, 1.5),
      new THREE.BoxGeometry(buildingWidth, 6, 1.5),
      new THREE.BoxGeometry(buildingWidth, 8, 1.5)
    ];
    
    // Create reusable materials to reduce draw calls
    const buildingMaterials = [
      new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: new THREE.Color(0.05, 0.05, 0.2),
        shininess: 30
      }),
      new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: new THREE.Color(0.05, 0.2, 0.05),
        shininess: 30
      }),
      new THREE.MeshPhongMaterial({
        color: 0x000000,
        emissive: new THREE.Color(0.2, 0.05, 0.05),
        shininess: 30
      })
    ];
    
    // Reuse geometries and materials to create buildings
    for (let i = 0; i < buildingCount; i++) {
      const geometryIndex = Math.floor(Math.random() * buildingGeometries.length);
      const materialIndex = Math.floor(Math.random() * buildingMaterials.length);
      
      const building = new THREE.Mesh(
        buildingGeometries[geometryIndex],
        buildingMaterials[materialIndex]
      );
      
      const height = buildingGeometries[geometryIndex].parameters.height;
      building.position.set(
        (i - buildingCount / 2) * spacing, 
        height / 2 - 0.5, 
        -10 - (Math.random() * 10)
      );
      
      skylineGroup.add(building);
    }
    
    scene.add(skylineGroup);
    return skylineGroup;
  })();

  // ------------------------------
  // Gameplay Instructions Overlay
  // ------------------------------
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
  styleSheet.textContent = 
    `@keyframes pulseBombCount {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }`
  ;
  document.head.appendChild(styleSheet);

  // ------------------------------
  // Trail and Particle Effects System
  // ------------------------------
  const trail = {
    particles: [],
    // Update particle system (villain vanish particles only)
    update: function () {
      // Update all villain vanish particles
      for (let i = 0; i < this.particles.length; i++) {
        const particle = this.particles[i];
        particle.userData.life -= particle.userData.decay;
        
        // Handle particles with velocity (villain vanish particles)
        if (particle.userData.velocity) {
          particle.position.add(particle.userData.velocity);
          // Add gravity effect to villain particles
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
    
    // Create villain vanish particles (called from vanish effect)
    createVillainParticle: function(position, color, velocity) {
      const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.copy(position);
      
      particle.userData = { 
        type: 'villainVanish',
        life: 1.0, 
        decay: 0.03 + Math.random() * 0.02,
        velocity: velocity
      };
      
      scene.add(particle);
      this.particles.push(particle);
      
      return particle;
    }
  };

  // ------------------------------
  // Keyboard Controls
  // ------------------------------
  const keys = { left: false, right: false, jump: false, attack: false, dodge: false };
  
  // Add dodge mechanic UI indicator
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
  
  // Update dodge cooldown indicator
  function updateDodgeIndicator() {
    const now = Date.now();
    const elapsed = now - hero.lastDodge;
    
    if (elapsed < hero.dodgeCooldown) {
      // Still on cooldown
      const percentage = (elapsed / hero.dodgeCooldown) * 100;
      dodgeFill.style.width = `${percentage}%`;
      
      // Change color based on availability
      if (percentage < 50) {
        dodgeFill.style.backgroundColor = '#ff3333';
      } else if (percentage < 100) {
        dodgeFill.style.backgroundColor = '#ffaa00';
      }
    } else {
      // Dodge is available
      dodgeFill.style.width = '100%';
      dodgeFill.style.backgroundColor = '#00ffff';
    }
  }
  document.addEventListener('keydown', (event) => {
    if (gamePhase === "intro" && event.key === 'Enter') {
      // Start gameplay and lock hero movement while villain is visible.
      gamePhase = "gameplay";
      movementLocked = true;
      // document.getElementById('renderDiv').removeChild(introOverlay);
      instructions.innerHTML = 'Use ARROW KEYS or WASD to move and jump';

      // Show villain speech bubble for 3 seconds.
      speechBubble.style.opacity = '1';
      speechBubble.style.left = '60%';
      speechBubble.style.top = '30%';
      setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);

      // After 5 seconds, create a vanishing effect for the villain and unlock hero movement.
      setTimeout(() => {
        // Define hero pulse effect function before using it
        function createHeroPulseEffect() {
          const pulseCount = 3;
          const pulseDuration = 300; // milliseconds per pulse
          let currentPulse = 0;
          
          // Save original colors
          const originalHeroColor = heroSprite.material.color.clone();
          const originalGlowColor = heroGlowSprite.material.color.clone();
          const originalGlowOpacity = heroGlowSprite.material.opacity;
          
          function doPulse() {
            if (currentPulse >= pulseCount * 2) {
              // Reset to original state when complete
              heroSprite.material.color.copy(originalHeroColor);
              heroGlowSprite.material.color.copy(originalGlowColor);
              heroGlowSprite.material.opacity = originalGlowOpacity;
              return;
            }
            
            // Toggle between enhanced and normal states
            if (currentPulse % 2 === 0) {
              // Enhanced state - bright white with strong cyan glow
              heroSprite.material.color.set(0xffffff);
              heroGlowSprite.material.color.set(0x00ffff);
              heroGlowSprite.material.opacity = 0.8;
              
              // Create radial particles
              for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const distance = 2;
                const particlePos = new THREE.Vector3(
                  hero.position.x + Math.cos(angle) * distance,
                  hero.position.y + Math.sin(angle) * distance,
                  hero.position.z
                );
                
                const velocity = new THREE.Vector3(
                  Math.cos(angle) * 0.06,
                  Math.sin(angle) * 0.06,
                  0
                );
                
                const particleColor = new THREE.Color(0x00ffff);
                trail.createVillainParticle(particlePos, particleColor, velocity);
              }
            } else {
              // Normal state
              heroSprite.material.color.copy(originalHeroColor);
              heroGlowSprite.material.color.copy(originalGlowColor);
              heroGlowSprite.material.opacity = originalGlowOpacity;
            }
            
            currentPulse++;
            setTimeout(doPulse, pulseDuration);
          }
          
          // Add text notification for player
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
          
          // Start the pulse effect
          doPulse();
        }
        
        // Create vanishing effect for villain
        const startOpacity = 1.0;
        const duration = 1500; // 1.5 seconds
        const startTime = Date.now();
        
        function fadeVillain() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1.0);
          
          // Fade out the villain sprites
          villainSprite.material.opacity = startOpacity * (1 - progress);
          villainGlowSprite.material.opacity = 0.3 * (1 - progress);
          
          // Add particle effect as villain vanishes
          if (progress < 1.0 && Math.random() > 0.7) {
            const particleColor = new THREE.Color(0xff0000);
            particleColor.lerp(new THREE.Color(0x000000), Math.random() * 0.5);
            
            // Create a position vector for the particle
            const particlePosition = new THREE.Vector3(
              villain.group.position.x + (Math.random() - 0.5) * 1.5,
              villain.group.position.y + (Math.random() - 0.5) * 3,
              villain.group.position.z + (Math.random() - 0.5) * 0.5
            );
            
            // Create a velocity vector for the particle
            const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 0.05,
              (Math.random() * 0.1) - 0.05,
              (Math.random() - 0.5) * 0.05
            );
            
            // Use the trail system to create and manage the villain particle
            trail.createVillainParticle(particlePosition, particleColor, velocity);
            // Use the trail system to create and manage the villain particle
            trail.createVillainParticle(particlePosition, particleColor, velocity);
          }
          
          if (progress < 1.0) {
            requestAnimationFrame(fadeVillain);
          } else {
            villain.group.visible = false;
            movementLocked = false;
            
            // Add pulse effect to hero when movement unlocks
            createHeroPulseEffect();
          }
        }
        
        fadeVillain();
      }, 5000);
    } else if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a': keys.left = true; break;
        case 'ArrowRight':
        case 'd': keys.right = true; break;
        case 'ArrowUp':
        case 'w':
        case ' ': keys.jump = true; break;
        case 'f':
        case 'e': keys.attack = true; break;
        case 'Shift': keys.dodge = true; break;
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a': keys.left = false; break;
        case 'ArrowRight':
        case 'd': keys.right = false; break;
        case 'ArrowUp':
        case 'w':
        case ' ': keys.jump = false; break;
        case 'f':
        case 'e': keys.attack = false; break;
        case 'Shift': keys.dodge = false; break;
      }
    }
  });

  // ------------------------------
  // Animation Loop and Performance Optimization
  // ------------------------------
  // Track time for frame-rate independent animations
  const clock = new THREE.Clock();
  let lastTime = 0;
  
  function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for consistent animation speed regardless of frame rate
    const deltaTime = clock.getDelta();
    const elapsed = currentTime - lastTime;
    lastTime = currentTime;
    
    // Skip frames if running too slow (below 30fps)
    if (elapsed > 33.33) { // 1000ms/30fps ≈ 33.33ms
      return;
    }

    if (gamePhase === "gameplay") {
      // Update hero movement only if not locked.
      if (!movementLocked) {
        // Update dodge indicator
        updateDodgeIndicator();
        
        // Check if player collected the smoke bomb
        if (!smokeBombCollectible.collected && smokeBombCollectible.checkCollision(hero.position)) {
          smokeBombCollectible.collect();
          
          // Pause game by locking movement
          movementLocked = true;
          
          // Show math quiz dialog
          showMathQuiz();
        }
        
        // Handle dodge mechanic
        if (keys.dodge && !hero.isDodging) {
          const now = Date.now();
            // Check if dodge is off cooldown
            if (now - hero.lastDodge > hero.dodgeCooldown) {
              // Start dodge
              hero.isDodging = true;
              hero.dodgeStartTime = now;
              hero.lastDodge = now;
            
            // Set dodge direction based on current movement or facing direction
            if (keys.left) {
              hero.dodgeDirection = -1;
            } else if (keys.right) {
              hero.dodgeDirection = 1;
            } else {
              // If not moving, dodge in the direction the hero is facing
              hero.dodgeDirection = (heroSprite.scale.x > 0) ? 1 : -1;
            }
            
            // Create dodge effect trail
            createDodgeEffect();
            
            // Make hero briefly invulnerable during dodge
            hero.isInvulnerable = true;
            hero.lastHit = now;
            hero.invulnerableTime = hero.dodgeDuration + 100; // Small buffer after dodge ends
            
            // Show dodge notification
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
        
        // Check if currently dodging
        if (hero.isDodging) {
          const now = Date.now();
          const dodgeElapsed = now - hero.dodgeStartTime;
          
          if (dodgeElapsed < hero.dodgeDuration) {
            // Apply dodge movement
            hero.velocity.x = hero.dodgeDirection * hero.dodgeSpeed;
            
            // Create afterimage effect during dodge
            if (dodgeElapsed % 50 === 0) { // Every 50ms
              createAfterimage();
            }
          } else {
            // End dodge
            hero.isDodging = false;
            hero.velocity.x *= 0.5; // Reduce momentum at end of dodge
          }
        } else {
          // Normal movement when not dodging
          if (keys.left) {
            hero.velocity.x = -0.3; // Increased from -0.1
          } else if (keys.right) {
            hero.velocity.x = 0.3; // Increased from 0.1
          } else {
            hero.velocity.x *= 0.85; // Changed from 0.9 for smoother deceleration
          }
        }
        // Regular jump
        if (keys.jump && hero.grounded) {
          // Check current rooftop before using it
          let isNearFirstRooftopEdge = false;
          let onFirstRooftop = false;
          
          // Check which rooftop the hero is on
          for (const rooftop of rooftops) {
            if (hero.position.x >= rooftop.userData.xMin && 
                hero.position.x <= rooftop.userData.xMax && 
                Math.abs(hero.position.z) <= rooftop.geometry.parameters.depth/2) {
              
              // First, check if hero is on the first rooftop at all
              if (rooftop.userData.id === 0) {
                onFirstRooftop = true;
                
                // Then, check if in the jump boost zone (right side)
                if (hero.position.x > 7) {
                  isNearFirstRooftopEdge = true;
                }
              }
              break;
            }
          }
          
          // Apply appropriate jump based on position
          if (isNearFirstRooftopEdge) {
            hero.velocity.y = 0.35; // Higher jump
            hero.velocity.x = 0.4; // Increased forward momentum
            
            // Highlight the jump boost indicator briefly to signal activation
            const originalOpacity = jumpBoostMaterial.opacity;
            jumpBoostMaterial.opacity = 0.8;
            setTimeout(() => {
              jumpBoostMaterial.opacity = originalOpacity;
            }, 300);
          } else {
            hero.velocity.y = 0.25; // Increased from 0.2 for higher normal jump
          }
          hero.grounded = false;
          // Jump flash effect
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
        hero.velocity.y -= 0.015; // Increased from 0.01 for faster falling
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
    
    // Check if hero is on any rooftop
    let onAnyRooftop = false;
    let currentRooftop = null;
    
    // Define the hero's sprite width for collision purposes
    const heroHalfWidth = 1.0; // Half the width of the hero for collision detection
    
    for (const rooftop of rooftops) {
      // Check if any part of the hero is on the rooftop (more lenient collision)
      if (hero.position.x + heroHalfWidth >= rooftop.userData.xMin && 
          hero.position.x - heroHalfWidth <= rooftop.userData.xMax && 
          Math.abs(hero.position.z) <= rooftop.geometry.parameters.depth/2) {
        onAnyRooftop = true;
        currentRooftop = rooftop;
        
        // Mark hero as having reached second rooftop when they land on it
        if (rooftop.userData.id === 1 && !hero.hasReachedSecondRooftop) {
          hero.hasReachedSecondRooftop = true;
        }
        
        break;
      }
    }
    
    // Check if hero is dead
    if (hero.health <= 0 && !hero.falling) {
      // Create death effect
      hero.falling = true; // Use falling state to prevent repeated death triggers
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
            
            // Reset hero
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
            
            // Update health bar
            updateHealthBar(hero.health);
          }, 500);
        }, 2000);
      }, 10);
    }
    
    // Rooftop boundaries and falling effect
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
      
      // Full game restart
      setTimeout(() => {
        // Reset hero position and parameters to initial state
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
        
        // Reset villain position and make it visible again
        villain.group.position.set(3, 1.5, 0);
        villain.group.visible = true;
        villainSprite.material.opacity = 1.0;
        villainGlowSprite.material.opacity = 0.3;
        
        // Reset minions by removing them from the scene
        minions.forEach(minion => {
          if (minion.group) {
            scene.remove(minion.group);
          }
        });
        minions.length = 0; // Clear the minions array
        
        // Reset game state variables
        minionsSpawned = false;
        minionsFought = 0;
        gamePhase = "gameplay";
        movementLocked = true;
        
        // Reset dodge cooldown
        hero.lastDodge = 0;
        updateDodgeIndicator();
        
        // Update health bar
        updateHealthBar(hero.health);
        
        // Hide falling message
        fallEffect.style.opacity = '0';
        setTimeout(() => { 
          document.getElementById('renderDiv').removeChild(fallEffect);
          
          // Show restart notification
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
          
          // Show villain speech bubble for 3 seconds
          speechBubble.style.opacity = '1';
          speechBubble.style.left = '60%';
          speechBubble.style.top = '30%';
          setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);
          
          // Define hero pulse effect function before using it in fadeVillain
          function createHeroPulseEffect() {
            const pulseCount = 3;
            const pulseDuration = 300; // milliseconds per pulse
            let currentPulse = 0;
            
            // Save original colors
            const originalHeroColor = heroSprite.material.color.clone();
            const originalGlowColor = heroGlowSprite.material.color.clone();
            const originalGlowOpacity = heroGlowSprite.material.opacity;
            
            function doPulse() {
              if (currentPulse >= pulseCount * 2) {
                // Reset to original state when complete
                heroSprite.material.color.copy(originalHeroColor);
                heroGlowSprite.material.color.copy(originalGlowColor);
                heroGlowSprite.material.opacity = originalGlowOpacity;
                return;
              }
              
              // Toggle between enhanced and normal states
              if (currentPulse % 2 === 0) {
                // Enhanced state - bright white with strong cyan glow
                heroSprite.material.color.set(0xffffff);
                heroGlowSprite.material.color.set(0x00ffff);
                heroGlowSprite.material.opacity = 0.8;
                
                // Create radial particles
                for (let i = 0; i < 12; i++) {
                  const angle = (i / 12) * Math.PI * 2;
                  const distance = 2;
                  const particlePos = new THREE.Vector3(
                    hero.position.x + Math.cos(angle) * distance,
                    hero.position.y + Math.sin(angle) * distance,
                    hero.position.z
                  );
                  
                  const velocity = new THREE.Vector3(
                    Math.cos(angle) * 0.06,
                    Math.sin(angle) * 0.06,
                    0
                  );
                  
                  const particleColor = new THREE.Color(0x00ffff);
                  trail.createVillainParticle(particlePos, particleColor, velocity);
                }
              } else {
                // Normal state
                heroSprite.material.color.copy(originalHeroColor);
                heroGlowSprite.material.color.copy(originalGlowColor);
                heroGlowSprite.material.opacity = originalGlowOpacity;
              }
              
              currentPulse++;
              setTimeout(doPulse, pulseDuration);
            }
            
            // Add text notification for player
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
            
            // Start the pulse effect
            doPulse();
          }
          
          // After 5 seconds, create vanishing effect for villain and unlock hero movement
          setTimeout(() => {
            // Villain vanishing effect - reuse the existing fadeVillain function
            const startOpacity = 1.0;
            const duration = 1500; // 1.5 seconds
            const startTime = Date.now();
            
            fadeVillain();
            
            function fadeVillain() {
              const elapsed = Date.now() - startTime;
              const progress = Math.min(elapsed / duration, 1.0);
              
              // Fade out the villain sprites
              villainSprite.material.opacity = startOpacity * (1 - progress);
              villainGlowSprite.material.opacity = 0.3 * (1 - progress);
              
              // Add particle effect as villain vanishes
              if (progress < 1.0 && Math.random() > 0.7) {
                const particleColor = new THREE.Color(0xff0000);
                particleColor.lerp(new THREE.Color(0x000000), Math.random() * 0.5);
                
                // Create a position vector for the particle
                const particlePosition = new THREE.Vector3(
                  villain.group.position.x + (Math.random() - 0.5) * 1.5,
                  villain.group.position.y + (Math.random() - 0.5) * 3,
                  villain.group.position.z + (Math.random() - 0.5) * 0.5
                );
                
                // Create a velocity vector for the particle
                const velocity = new THREE.Vector3(
                  (Math.random() - 0.5) * 0.05,
                  (Math.random() * 0.1) - 0.05,
                  (Math.random() - 0.5) * 0.05
                );
                
                // Use the trail system to create and manage the villain particle
                trail.createVillainParticle(particlePosition, particleColor, velocity);
              }
              
              if (progress < 1.0) {
                requestAnimationFrame(fadeVillain);
              } else {
                villain.group.visible = false;
                movementLocked = false;
                
                // Add pulse effect to hero when movement unlocks
                createHeroPulseEffect();
              }
            }
          }, 5000);
        }, 500);
      }, 2000);
    }

    if (hero.position.y < 1.5 && !hero.falling) {
      hero.position.y = 1.5;
      hero.velocity.y = 0;
      hero.grounded = true;
    }

    hero.group.position.set(hero.position.x, hero.position.y, 0);

    // Sprite Orientation:
    // Tagging the left boundary as "back" and the right boundary as "front"
    // At the initial position (hero on left, villain on right), the hero should show its front (right) and the villain its front (left).
    if (hero.position.x < villain.group.position.x) {
      // Hero on left (its front is on right => positive scale.x)
      heroSprite.scale.x = Math.abs(heroSprite.scale.x);
      // Villain on right: flip it so that its front (right) appears on the left side.
      villainSprite.scale.x = -Math.abs(villainSprite.scale.x);
      villainGlowSprite.scale.x = -Math.abs(villainGlowSprite.scale.x);
    } else {
      // In the reverse scenario, hero faces left and villain faces right.
      heroSprite.scale.x = -Math.abs(heroSprite.scale.x);
      villainSprite.scale.x = Math.abs(villainSprite.scale.x);
      villainGlowSprite.scale.x = Math.abs(villainGlowSprite.scale.x);
    }

    // Subtle hover animation for hero sprite and update glow opacity.
    heroSprite.position.y = Math.sin(Date.now() * 0.003) * 0.1;
    heroGlowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.1;

    // Update villain particles only (hero trail removed)
    trail.update();

    // Update camera and skyline parallax.
    camera.position.x = hero.position.x;
    skyline.position.x = hero.position.x * 0.4;
    
    // Check if hero has reached the second rooftop and spawn minions if needed
    if (currentRooftop && currentRooftop.userData.id === 1 && !minionsSpawned) {
      minionsSpawned = true;
      
      // Create minion spawn animation and notification
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
      spawnNotification.innerHTML = 'SMOKE\'S MINIONS APPEAR!<br><span style="font-size: 20px">Defeat 3 of 20 minions</span>';
      document.getElementById('renderDiv').appendChild(spawnNotification);
      
      // Fade in notification
      setTimeout(() => { 
        spawnNotification.style.opacity = '1';
        setTimeout(() => {
          spawnNotification.style.opacity = '0';
          setTimeout(() => {
            document.getElementById('renderDiv').removeChild(spawnNotification);
          }, 500);
        }, 2000);
      }, 10);
      
      // Spawn 3 minions with a slight delay between each
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          // Position minions across the second rooftop with random offsets
          const xPos = 35 + (i - 1) * 5;
          const zPos = (Math.random() - 0.5) * 3;
          const minion = createMinion(xPos, 1.5, zPos);
          minions.push(minion);
          
          // Add spawn effect
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
          
          // Animate spawn effect
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
        }, i * 600); // Stagger spawn timing
      }
      
      // Update instructions
      instructions.innerHTML = hero.hasSmokeAttack ? 
        'SMOKE\'S MINIONS BLOCK YOUR PATH! Press E or F to attack!' :
        'SMOKE\'S MINIONS BLOCK YOUR PATH! Find smoke bombs to attack!';
    }
    
    // Check for enemies in attack range and show indicator
    const attackRange = 3.0; // Same range used in attack logic
    let enemyInRange = false;
    
    minions.forEach(minion => {
      if (minion.active) {
        // Calculate distance to minion
        const distance = Math.abs(hero.position.x - minion.group.position.x);
        
        // If minion is in attack range
        if (distance < attackRange) {
          enemyInRange = true;
          
          // Add indicator to the minion if not already present
          if (!minion.indicator) {
            const indicatorGeometry = new THREE.RingGeometry(1.2, 1.3, 32);
            const indicatorMaterial = new THREE.MeshBasicMaterial({ 
              color: 0xff3333,
              transparent: true,
              opacity: 0.7,
              side: THREE.DoubleSide
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.rotation.x = -Math.PI / 2; // Lay flat on ground
            indicator.position.y = -1.45; // Position at minion's feet
            
            minion.indicator = indicator;
            minion.group.add(indicator);
          } else {
            // Update existing indicator visibility
            minion.indicator.visible = true;
            
            // Pulse the indicator
            const pulseScale = 1 + Math.sin(Date.now() * 0.008) * 0.2;
            minion.indicator.scale.set(pulseScale, pulseScale, 1);
          }
        } else if (minion.indicator) {
          // Hide indicator if enemy not in range
          minion.indicator.visible = false;
        }
      }
    });
    
    // Update attack prompt based on enemies in range
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
      attackPrompt.innerHTML = hero.hasSmokeAttack ? 
        `ENEMY IN RANGE! Press E or F to attack (${hero.smokeBombsCount} bombs left)` :
        'ENEMY IN RANGE! Find smoke bombs to attack';
      document.getElementById('renderDiv').appendChild(attackPrompt);
    } else if (!enemyInRange && document.getElementById('attackPrompt')) {
      const attackPrompt = document.getElementById('attackPrompt');
      document.getElementById('renderDiv').removeChild(attackPrompt);
    }
    
    // Combat system - handle attacks
    if (gamePhase === "gameplay" && keys.attack && !movementLocked) {
      // Get current time for attack cooldown
      const now = Date.now();
      
      // Check if hero is in attack range of any minion
      const attackRange = 3.0; // How close hero needs to be to hit minion
      let hasAttacked = false;
      
      // Only process attack if not on cooldown and hero has smoke bombs
      if (now - hero.lastAttack > 500 && hero.hasSmokeAttack && hero.smokeBombsCount > 0) {
        minions.forEach(minion => {
          if (minion.active) {
            // Calculate distance to minion
            const distance = Math.abs(hero.position.x - minion.group.position.x);
            
            // If within range, attack
            if (distance < attackRange) {
              hasAttacked = true;
              
              // Set attack cooldown
              hero.lastAttack = now;
              
              // Determine direction for projectile
              const attackDirection = hero.position.x < minion.group.position.x ? 1 : -1;
              
              // Create lightning bolt projectile
              // Create smoke bomb sprite instead of mesh geometry
              const projectileMaterial = new THREE.SpriteMaterial({
                map: smokeBombTexture,
                transparent: true,
                opacity: 1.0
              });
              const projectile = new THREE.Sprite(projectileMaterial);
              
              // Size the smoke bomb appropriately
              projectile.scale.set(0.8, 0.8, 1);
              
              // Position projectile at hero's position
              projectile.position.set(
                hero.position.x + (attackDirection * 0.8), 
                hero.position.y, 
                0
              );
              
              // No rotation needed for sprite
              
              scene.add(projectile);
              
              // Create smoke trail particles
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
              
              // Animate projectile
              const projectileStartTime = Date.now();
              const projectileDuration = 200;
              const startX = projectile.position.x;
              const targetX = minion.group.position.x;
              const totalDistance = targetX - startX;
              
              (function animateProjectile() {
                const elapsed = Date.now() - projectileStartTime;
                if (elapsed < projectileDuration) {
                  const progress = elapsed / projectileDuration;
                  
                  // Move projectile toward target with slight arc
                  projectile.position.x = startX + (progress * totalDistance);
                  projectile.position.y = hero.position.y + Math.sin(progress * Math.PI) * 0.5;
                  
                  // Spin the smoke bomb as it flies
                  projectile.material.rotation += 0.1;
                  
                  // Update smoke trail particles
                  for (let i = 0; i < particles.length; i++) {
                    const particle = particles[i];
                    // Position particles along the path with different offsets
                    const particleProgress = Math.max(0, progress - (i * 0.05));
                    if (particleProgress > 0) {
                      particle.position.x = startX + (particleProgress * totalDistance);
                      particle.position.y = hero.position.y + Math.sin(particleProgress * Math.PI) * 0.5;
                      
                      // Fade out particles based on their position in the trail
                      particle.material.opacity = 0.4 * (1 - particleProgress);
                      // Gradually reduce scale of trailing particles
                      const scale = 0.3 * (1 - particleProgress * 0.7);
                      particle.scale.set(scale, scale, 1);
                    }
                  }
                  
                  requestAnimationFrame(animateProjectile);
                } else {
                  // Create smoke explosion at impact
                  const smokeParticleCount = 20;
                  const smokeParticles = [];
                  
                  // Create a more elaborate smoke cloud effect
                  for (let i = 0; i < smokeParticleCount; i++) {
                    const smokeMaterial = new THREE.SpriteMaterial({
                      map: smokeBombTexture,
                      transparent: true,
                      opacity: 0.8,
                      color: new THREE.Color(0xaaffff) // Light cyan tint
                    });
                    
                    const smokeParticle = new THREE.Sprite(smokeMaterial);
                    // Random size for various smoke puffs
                    const size = 0.3 + Math.random() * 0.7;
                    smokeParticle.scale.set(size, size, 1);
                    
                    // Position around impact point with some randomness
                    smokeParticle.position.set(
                      minion.group.position.x + (Math.random() - 0.5) * 1.2,
                      minion.group.position.y + (Math.random() - 0.5) * 1.2,
                      minion.group.position.z + (Math.random() - 0.5) * 0.2
                    );
                    
                    // Store velocity for animation
                    smokeParticle.userData = {
                      velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 0.03,
                        (Math.random() - 0.5) * 0.03,
                        0
                      ),
                      rotation: Math.random() * 0.1 - 0.05
                    };
                    
                    scene.add(smokeParticle);
                    smokeParticles.push(smokeParticle);
                  }
                  
                  // Animate smoke explosion
                  const smokeStartTime = Date.now();
                  const smokeDuration = 800; // Longer smoke effect
                  
                  (function animateSmoke() {
                    const smokeElapsed = Date.now() - smokeStartTime;
                    if (smokeElapsed < smokeDuration) {
                      const smokeProgress = smokeElapsed / smokeDuration;
                      
                      smokeParticles.forEach(particle => {
                        // Move according to velocity
                        particle.position.add(particle.userData.velocity);
                        
                        // Add some upward drift to simulate rising smoke
                        particle.position.y += 0.005;
                        
                        // Rotate the smoke texture
                        particle.material.rotation += particle.userData.rotation;
                        
                        // Expand slightly as it dissipates
                        const expansion = 1 + smokeProgress * 0.5;
                        particle.scale.x = particle.scale.x * expansion;
                        particle.scale.y = particle.scale.y * expansion;
                        
                        // Fade out gradually
                        particle.material.opacity = 0.8 * (1 - Math.pow(smokeProgress, 2));
                      });
                      
                      requestAnimationFrame(animateSmoke);
                    } else {
                      // Remove all smoke particles
                      smokeParticles.forEach(particle => scene.remove(particle));
                    }
                  })();
                  
                  // Remove projectile and particles
                  scene.remove(projectile);
                  particles.forEach(particle => scene.remove(particle));
                }
              })();
            
              // Damage minion
              minion.health -= 25; // 4 hits to defeat
              
              // Define healthBarWidth for this scope
              const healthBarWidth = 1.5;
              
              // Update health bar - ensure it doesn't go below 0
              const healthPercentage = Math.max(0, minion.health) / 100;
              const healthBarOriginalWidth = healthBarWidth - 0.05;
              minion.healthBar.scale.x = healthPercentage;
              
              // Center the health bar fill as it shrinks
              minion.healthBar.position.x = -((1 - healthPercentage) * healthBarOriginalWidth) / 2;
            
            // Minion hit effect - flash and knockback
            minion.group.children[0].material.color.set(0xffffff);
            setTimeout(() => {
              if (minion.active) {
                minion.group.children[0].material.color.set(0xbbbbff);
              }
            }, 100);
            
            // Check if minion is defeated
            if (minion.health <= 0) {
              minion.active = false;
              
              // Create defeat effect
              const defeatEffect = new THREE.Mesh(
                new THREE.CircleGeometry(1.5, 16),
                new THREE.MeshBasicMaterial({
                  color: 0x8833ff,
                  transparent: true,
                  opacity: 0.8,
                  side: THREE.DoubleSide
                })
              );
              defeatEffect.position.copy(minion.group.position);
              defeatEffect.rotation.x = -Math.PI / 2;
              scene.add(defeatEffect);
              
              // Animate defeat effect
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
              
              // Hide minion
              minion.group.visible = false;
              
              // Increment defeated count
              minionsFought++;
              
              // Show defeat notification
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
              
              // Check if all 3 minions on the second rooftop are defeated
              if (minionsFought === 3) {
                // Restore full health
                hero.health = 100;
                updateHealthBar(hero.health);
                
                // Create health restoration effect
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
                
                // Create healing visual effect around hero
                for (let i = 0; i < 20; i++) {
                  const angle = (i / 20) * Math.PI * 2;
                  const distance = 1.5;
                  
                  const particlePos = new THREE.Vector3(
                    hero.position.x + Math.cos(angle) * distance,
                    hero.position.y + Math.sin(angle) * distance,
                    hero.position.z
                  );
                  
                  const velocity = new THREE.Vector3(
                    Math.cos(angle) * 0.03,
                    Math.sin(angle) * 0.03,
                    0
                  );
                  
                  const particleColor = new THREE.Color(0x00ff88);
                  trail.createVillainParticle(particlePos, particleColor, velocity);
                }
                
                // Fade in and out the healing notification
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
          }
        });
        
        // Set attack cooldown if any minion was attacked
        if (hasAttacked) {
          hero.lastAttack = now;
          
          // Decrease smoke bomb count
          hero.smokeBombsCount--;
          
          // Update smoke bomb counter
          updateSmokeBombCounter();
          
          // Check if ran out of smoke bombs
          if (hero.smokeBombsCount <= 0) {
            // Show out of bombs notification
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
            
            // Check if it's time to respawn a smoke bomb on the first rooftop
            const now = Date.now();
            if (now - hero.lastSmokeBombRespawn > hero.smokeBombRespawnCooldown) {
              // Respawn if the player has zero bombs (regardless of current rooftop)
              spawnSmokeBombOnFirstRooftop();
              hero.lastSmokeBombRespawn = now;
            }
          }
        }
      }
      
      // If hero attacked, show attack animation
      if (hasAttacked) {
        // Pulse hero sprite to indicate attack
        const originalColor = heroSprite.material.color.clone();
        const originalGlowColor = heroGlowSprite.material.color.clone();
        const originalGlowOpacity = heroGlowSprite.material.opacity;
        
        // Enhance colors for attack
        heroSprite.material.color.set(0xffffff);
        heroGlowSprite.material.color.set(0x00ffff);
        heroGlowSprite.material.opacity = 0.6;
        
        // Reset after short delay
        setTimeout(() => {
          heroSprite.material.color.copy(originalColor);
          heroGlowSprite.material.color.copy(originalGlowColor);
          heroGlowSprite.material.opacity = originalGlowOpacity;
        }, 150);
      }
    }
    
    // Update minions if they exist
    // Update hero health bar
    updateHealthBar(hero.health);
    
    // Handle hero invulnerability after hit
    if (hero.isInvulnerable) {
      // Flash hero to show invulnerability
      const flashRate = 150; // ms
      const now = Date.now();
      const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
      
      // Toggle visibility based on flash phase
      heroSprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
      
      // Check if invulnerability period is over
      if (now - hero.lastHit > hero.invulnerableTime) {
        hero.isInvulnerable = false;
        heroSprite.material.opacity = 1.0; // Restore normal opacity
      }
    }
    
    minions.forEach(minion => {
      if (minion.active) {
        // Make sprite hover slightly
        const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;
        minion.group.children[0].position.y = hoverAmount;
        minion.group.children[1].position.y = hoverAmount;
        minion.healthBar.position.y = 2.0 + hoverAmount;
        minion.group.children[2].position.y = 2.0 + hoverAmount; // Update health bar background position
        
        // Make minion face the hero
        const minionSprite = minion.group.children[0];
        const minionGlow = minion.group.children[1];
        
        if (minion.group.position.x > hero.position.x) {
          minionSprite.scale.x = -Math.abs(minionSprite.scale.x);
          minionGlow.scale.x = -Math.abs(minionGlow.scale.x);
        } else {
          minionSprite.scale.x = Math.abs(minionSprite.scale.x);
          minionGlow.scale.x = Math.abs(minionGlow.scale.x);
        }
        
        // Counter attack logic
        const now = Date.now();
        const attackDistance = 2.5; // Slightly less than hero's attack range
        const distance = Math.abs(hero.position.x - minion.group.position.x);
        
        // If hero is close and minion is not on cooldown
        if (distance < attackDistance && now - minion.lastHit > minion.hitCooldown) {
          minion.lastHit = now;
          
          // Only damage hero if not invulnerable
          if (!hero.isInvulnerable) {
            // Damage hero
            hero.health -= 10;
            hero.lastHit = now;
            hero.isInvulnerable = true;
            
            // Update health bar
            updateHealthBar(hero.health);
            
            // Determine direction for projectile
            const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;
            
            // Create dark energy projectile
            const projectileGeometry = new THREE.PlaneGeometry(1.0, 0.4);
            const projectileMaterial = new THREE.MeshBasicMaterial({
              color: 0xff3333,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide
            });
            const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
            
            // Position projectile at minion's position
            projectile.position.set(
              minion.group.position.x + (attackDirection * 0.7), 
              minion.group.position.y, 
              0
            );
            
            // Rotate based on attack direction
            projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 : Math.PI / 6;
            
            scene.add(projectile);
            
            // Create trail effect for projectile
            const trail = new THREE.Mesh(
              new THREE.PlaneGeometry(0.6, 0.3),
              new THREE.MeshBasicMaterial({
                color: 0x880000,
                transparent: true,
                opacity: 0.5
              })
            );
            trail.position.copy(projectile.position);
            trail.position.x -= attackDirection * 0.5;
            trail.rotation.z = projectile.rotation.z;
            scene.add(trail);
            
            // Animate projectile
            const projectileStartTime = Date.now();
            const projectileDuration = 300; // Slower than hero projectile
            const startX = projectile.position.x;
            const targetX = hero.position.x;
            const totalDistance = targetX - startX;
            
            (function animateProjectile() {
              const elapsed = Date.now() - projectileStartTime;
              if (elapsed < projectileDuration) {
                const progress = elapsed / projectileDuration;
                
                // Move projectile toward target
                projectile.position.x = startX + (progress * totalDistance);
                
                // Update trail position
                trail.position.x = projectile.position.x - (attackDirection * 0.5);
                
                // Add some wobble effect
                if (elapsed % 40 < 20) {
                  projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 - 0.1 : Math.PI / 6 + 0.1;
                  projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
                } else {
                  projectile.rotation.z = attackDirection > 0 ? -Math.PI / 6 + 0.1 : Math.PI / 6 - 0.1;
                  projectile.position.y = minion.group.position.y + Math.sin(elapsed * 0.1) * 0.1;
                }
                
                // Fade out trail
                trail.material.opacity = 0.5 * (1 - progress);
                
                requestAnimationFrame(animateProjectile);
              } else {
                // Create impact effect at hero position
                const impactEffect = new THREE.Mesh(
                  new THREE.CircleGeometry(0.8, 16),
                  new THREE.MeshBasicMaterial({
                    color: 0xff3333,
                    transparent: true,
                    opacity: 0.8
                  })
                );
                impactEffect.position.set(hero.position.x, hero.position.y, 0);
                scene.add(impactEffect);
                
                // Animate impact effect
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
                
                // Remove projectile and trail
                scene.remove(projectile);
                scene.remove(trail);
              }
            })();
            
            // Create hit notification
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
      }
    });
    
    // Add directional indicator for the next rooftop if the hero is near the edge
    if (currentRooftop && currentRooftop.userData.id === 0) {
      // If on first rooftop and near the right edge, show a jump prompt
      // Only show jump prompt if there are no active minions nearby
      const minionsNearby = minions.some(minion => 
        minion.active && Math.abs(hero.position.x - minion.group.position.x) < 5
      );
      
      if (hero.position.x > 10 && !document.getElementById('jumpPrompt') && !minionsNearby) {
        const jumpPrompt = document.createElement('div');
        jumpPrompt.id = 'jumpPrompt';
        Object.assign(jumpPrompt.style, {
          position: 'absolute',
          top: '70%',
          left: '10%',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '20px',
          color: '#00ffff',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
          zIndex: '100',
          opacity: '0.8',
          transition: 'opacity 0.5s',
          pointerEvents: 'none'
        });
        
        // Customize text based on whether smoke bomb has been collected
        let promptText = '→ JUMP! →';
        
        // Only show super jump instructions if player hasn't jumped to second rooftop yet
        if (!hero.hasReachedSecondRooftop) {
          promptText += '<br>Press SPACE for a super jump!';
        }
        
        // Only show smoke bomb collection instructions if not collected yet
        if (!smokeBombCollectible.collected) {
          promptText += '<br><span style="color: #00ffaa; font-size: 16px;">Collect the smoke bomb!</span>';
        }
        
        jumpPrompt.innerHTML = promptText;
        document.getElementById('renderDiv').appendChild(jumpPrompt);
      } else if ((hero.position.x <= 10 || minionsNearby) && document.getElementById('jumpPrompt')) {
        const jumpPrompt = document.getElementById('jumpPrompt');
        document.getElementById('renderDiv').removeChild(jumpPrompt);
      }
    }
    renderer.render(scene, camera);
  }

  // Function to create dodge visual effect
  function createDodgeEffect() {
    const dodgeEffect = new THREE.Mesh(
      new THREE.CircleGeometry(1, 16),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
    );
    
    dodgeEffect.position.set(hero.position.x, hero.position.y - 0.5, hero.position.z);
    dodgeEffect.rotation.x = -Math.PI / 2;
    scene.add(dodgeEffect);
    
    // Animate dodge effect
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
  
  // Create smoke bomb counter UI
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
    
    // Add smoke bomb icon
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
    
    // Add counter text
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
  
  // Update smoke bomb counter
  function updateSmokeBombCounter() {
    const bombCount = document.getElementById('smokeBombCount');
    if (bombCount) {
      bombCount.textContent = `x${hero.smokeBombsCount}`;
      
      // Change color when low on bombs
      if (hero.smokeBombsCount <= 1) {
        bombCount.style.color = '#ff3333';
        bombCount.style.textShadow = '0 0 5px rgba(255, 51, 51, 0.8)';
      } else {
        // Reset color when not low on bombs
        bombCount.style.color = '#00ffff';
        bombCount.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.8)';
      }
      
      // Add pulse animation when count changes
      bombCount.style.animation = 'none';
      void bombCount.offsetWidth; // Trigger reflow to restart animation
      bombCount.style.animation = 'pulseBombCount 0.5s ease-in-out';
    }
  }
  
  // Function to create afterimage during dodge
  function createAfterimage() {
    // Create a clone of the hero sprite with faded appearance
    const afterimageSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: ninjaTexture,
        transparent: true,
        opacity: 0.3,
        color: 0x00ffff
      })
    );
    
    // Match the hero's current size and orientation
    afterimageSprite.scale.copy(heroSprite.scale);
    afterimageSprite.position.set(hero.position.x, hero.position.y, hero.position.z);
    
    scene.add(afterimageSprite);
    
    // Fade out the afterimage
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
  
  // Function to show the math quiz dialog
  function showMathQuiz() {
    // Create an array of math questions and answers
    const mathQuestions = [
      {
        question: "What is 8 × 7?",
        options: ["54", "56", "64", "72"],
        correctAnswer: "56"
      },
      {
        question: "Solve: 15 + 26 - 13",
        options: ["18", "28", "38", "48"],
        correctAnswer: "28"
      },
      {
        question: "What is 125 ÷ 5?",
        options: ["20", "25", "35", "45"],
        correctAnswer: "25"
      }
    ];
    
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    
    // Create the dialog container
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
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Ninja Math Challenge';
    Object.assign(title.style, {
      color: '#00ffff',
      marginTop: '0',
      fontSize: '24px',
      textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
    });
    quizContainer.appendChild(title);
    
    // Add subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Answer correctly to earn smoke bombs!';
    Object.assign(subtitle.style, {
      color: '#aaffff',
      fontSize: '16px',
      marginBottom: '20px'
    });
    quizContainer.appendChild(subtitle);
    
    // Create question container
    const questionContainer = document.createElement('div');
    questionContainer.id = 'questionContainer';
    quizContainer.appendChild(questionContainer);
    
    // Function to show the current question
    function showQuestion(index) {
      // Clear previous content
      questionContainer.innerHTML = '';
      
      // Create progress indicator
      const progress = document.createElement('div');
      progress.textContent = `Question ${index + 1} of ${mathQuestions.length}`;
      Object.assign(progress.style, {
        color: '#aaffff',
        fontSize: '14px',
        marginBottom: '15px'
      });
      questionContainer.appendChild(progress);
      
      // Create question text
      const questionText = document.createElement('div');
      questionText.textContent = mathQuestions[index].question;
      Object.assign(questionText.style, {
        fontSize: '22px',
        marginBottom: '20px',
        fontWeight: 'bold'
      });
      questionContainer.appendChild(questionText);
      
      // Create options container
      const optionsContainer = document.createElement('div');
      Object.assign(optionsContainer.style, {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        marginBottom: '20px'
      });
      
      // Add options
      mathQuestions[index].options.forEach(option => {
        const optionButton = document.createElement('button');
        optionButton.textContent = option;
        Object.assign(optionButton.style, {
          backgroundColor: 'rgba(0, 50, 80, 0.8)',
          border: '2px solid #0088aa',
          borderRadius: '5px',
          padding: '10px',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        });
        
        // Hover effect
        optionButton.addEventListener('mouseover', () => {
          optionButton.style.backgroundColor = 'rgba(0, 70, 100, 0.8)';
          optionButton.style.borderColor = '#00ffff';
        });
        
        optionButton.addEventListener('mouseout', () => {
          optionButton.style.backgroundColor = 'rgba(0, 50, 80, 0.8)';
          optionButton.style.borderColor = '#0088aa';
        });
        
        // Click handler
        optionButton.addEventListener('click', () => {
          // Check if the answer is correct
          const isCorrect = option === mathQuestions[index].correctAnswer;
          
          // Disable all buttons
          const allButtons = optionsContainer.querySelectorAll('button');
          allButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'default';
            btn.style.opacity = '0.7';
          });
          
          // Highlight the selected button
          if (isCorrect) {
            optionButton.style.backgroundColor = 'rgba(0, 150, 50, 0.8)';
            optionButton.style.borderColor = '#00ff00';
            correctAnswers++;
          } else {
            optionButton.style.backgroundColor = 'rgba(150, 0, 0, 0.8)';
            optionButton.style.borderColor = '#ff0000';
            
            // Highlight the correct answer
            allButtons.forEach(btn => {
              if (btn.textContent === mathQuestions[index].correctAnswer) {
                btn.style.backgroundColor = 'rgba(0, 150, 50, 0.8)';
                btn.style.borderColor = '#00ff00';
              }
            });
          }
          
          // Show feedback
          const feedback = document.createElement('div');
          feedback.textContent = isCorrect ? 'Correct! +2 Smoke Bombs' : 'Incorrect!';
          Object.assign(feedback.style, {
            color: isCorrect ? '#00ff00' : '#ff3333',
            fontSize: '18px',
            fontWeight: 'bold',
            marginTop: '10px',
            marginBottom: '10px'
          });
          questionContainer.appendChild(feedback);
          
          // Add next button or finish button
          const nextButton = document.createElement('button');
          nextButton.textContent = currentQuestionIndex < mathQuestions.length - 1 ? 'Next Question' : 'Finish';
          Object.assign(nextButton.style, {
            backgroundColor: 'rgba(0, 100, 150, 0.8)',
            border: '2px solid #00ffff',
            borderRadius: '5px',
            padding: '10px 20px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            margin: '10px auto',
            display: 'block',
            transition: 'all 0.2s'
          });
          
          nextButton.addEventListener('mouseover', () => {
            nextButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)';
          });
          
          nextButton.addEventListener('mouseout', () => {
            nextButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)';
          });
          
          nextButton.addEventListener('click', () => {
            if (currentQuestionIndex < mathQuestions.length - 1) {
              currentQuestionIndex++;
              showQuestion(currentQuestionIndex);
            } else {
              // Quiz is finished, show results
              finishQuiz();
            }
          });
          
          questionContainer.appendChild(nextButton);
        });
        
        optionsContainer.appendChild(optionButton);
      });
      
      questionContainer.appendChild(optionsContainer);
    }
    
    // Function to finish the quiz and show results
    function finishQuiz() {
      // Clear question container
      questionContainer.innerHTML = '';
      
      // Calculate earned smoke bombs (2 per correct answer)
      const earnedSmokeBombs = correctAnswers * 2;
      
      // Create results container
      const resultsContainer = document.createElement('div');
      Object.assign(resultsContainer.style, {
        textAlign: 'center',
        padding: '20px'
      });
      
      // Add results title
      const resultsTitle = document.createElement('h3');
      resultsTitle.textContent = 'Quiz Complete!';
      Object.assign(resultsTitle.style, {
        color: '#00ffff',
        fontSize: '22px',
        marginBottom: '10px'
      });
      resultsContainer.appendChild(resultsTitle);
      
      // Add score
      const scoreText = document.createElement('p');
      scoreText.textContent = `You answered ${correctAnswers} out of ${mathQuestions.length} questions correctly.`;
      Object.assign(scoreText.style, {
        fontSize: '18px',
        marginBottom: '15px'
      });
      resultsContainer.appendChild(scoreText);
      
      // Add smoke bombs earned
      const bombsEarned = document.createElement('p');
      bombsEarned.innerHTML = `<span style="color: #00ffff; font-size: 24px; font-weight: bold;">${earnedSmokeBombs}</span> smoke bombs earned!`;
      Object.assign(bombsEarned.style, {
        fontSize: '18px',
        marginBottom: '20px'
      });
      resultsContainer.appendChild(bombsEarned);
      
      // Create continue button
      const continueButton = document.createElement('button');
      continueButton.textContent = 'Continue Game';
      Object.assign(continueButton.style, {
        backgroundColor: 'rgba(0, 100, 150, 0.8)',
        border: '2px solid #00ffff',
        borderRadius: '5px',
        padding: '12px 24px',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        margin: '10px auto',
        display: 'block',
        transition: 'all 0.2s'
      });
      
      continueButton.addEventListener('mouseover', () => {
        continueButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)';
      });
      
      continueButton.addEventListener('mouseout', () => {
        continueButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)';
      });
      
      continueButton.addEventListener('click', () => {
        // Remove quiz container
        document.getElementById('renderDiv').removeChild(quizContainer);
        
        // Enable hero movement
        movementLocked = false;
        
        // Set hero's smoke bomb properties
        hero.hasSmokeAttack = true;
        hero.smokeBombsCount = earnedSmokeBombs;
        
        // Show collection notification
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
            setTimeout(() => {
              document.getElementById('renderDiv').removeChild(collectNotification);
            }, 300);
          }, 2000);
        }, 10);
        
        // Create or update smoke bomb counter UI
        if (document.getElementById('smokeBombCounter')) {
          updateSmokeBombCounter();
        } else {
          createSmokeBombCounter();
        }
      });
      
      resultsContainer.appendChild(continueButton);
      questionContainer.appendChild(resultsContainer);
    }
    
    // Start with the first question
    showQuestion(currentQuestionIndex);
    
    // Add quiz container to the DOM
    document.getElementById('renderDiv').appendChild(quizContainer);
  }
  
  // Function to spawn a smoke bomb on the first rooftop
  function spawnSmokeBombOnFirstRooftop() {
    // Create a new smoke bomb collectible at a random position on the first rooftop
    const xPos = -5 + Math.random() * 15; // Random position between -5 and 10 on first rooftop
    const yPos = 1.5; // Slightly above the rooftop
    
    // Create a directional arrow indicator for the smoke bomb
    const arrowIndicator = createSmokeArrowIndicator(xPos, yPos);
    
    // Create a smoke bomb with the same design as the original collectible
    const respawnedBomb = {
      group: new THREE.Group(),
      collected: false
    };
    
    // Create smoke bomb sprite
    const smokeBombMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      opacity: 1.0
    });
    
    const smokeBombSprite = new THREE.Sprite(smokeBombMaterial);
    smokeBombSprite.scale.set(1.2, 1.2, 1);
    respawnedBomb.group.add(smokeBombSprite);
    
    // Add glow effect
    const glowMaterial = new THREE.SpriteMaterial({
      map: smokeBombTexture,
      transparent: true,
      color: 0x00ffff,
      opacity: 0.5
    });
    
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(1.5, 1.5, 1);
    respawnedBomb.group.add(glowSprite);
    
    // Position the smoke bomb
    respawnedBomb.group.position.set(xPos, yPos, 0);
    scene.add(respawnedBomb.group);
    
    // Add floating animation
    const startY = respawnedBomb.group.position.y;
    
    // Add respawn effect
    const respawnEffect = new THREE.Mesh(
      new THREE.CircleGeometry(2, 16),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      })
    );
    respawnEffect.position.set(xPos, startY - 0.5, 0);
    respawnEffect.rotation.x = -Math.PI / 2;
    scene.add(respawnEffect);
    
    // Animate respawn effect
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
    
    // Show notification
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
        setTimeout(() => {
          document.getElementById('renderDiv').removeChild(respawnNotification);
        }, 300);
      }, 2000);
    }, 10);
    
    // Add smoke bomb collection logic
    function animateRespawnedBomb() {
      if (respawnedBomb.collected) return;
      
      // Floating animation
      respawnedBomb.group.position.y = startY + Math.sin(Date.now() * 0.003) * 0.5;
      glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
      
      // Rotate slightly
      smokeBombSprite.material.rotation += 0.01;
      glowSprite.material.rotation += 0.005;
      
      // Check for collision with hero
      const distance = Math.sqrt(
        Math.pow(hero.position.x - respawnedBomb.group.position.x, 2) + 
        Math.pow(hero.position.y - respawnedBomb.group.position.y, 2)
      );
      
      if (distance < 1.5 && !respawnedBomb.collected) {
        // Mark as collected
        respawnedBomb.collected = true;
        respawnedBomb.group.visible = false;
        
        // Create collection effect
        const collectionEffect = new THREE.Mesh(
          new THREE.CircleGeometry(1, 16),
          new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
          })
        );
        collectionEffect.position.copy(respawnedBomb.group.position);
        collectionEffect.rotation.x = -Math.PI / 2;
        scene.add(collectionEffect);
        
        // Animate collection effect
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
        
        // Pause game by locking movement
        movementLocked = true;
        
        // Show math quiz dialog - reuse the same quiz function as the initial bomb
        // Remove the arrow indicator if it exists
        const arrowIndicator = document.getElementById('smokeArrowIndicator');
        if (arrowIndicator) {
          document.getElementById('renderDiv').removeChild(arrowIndicator);
        }
        
        showMathQuiz();
        
        return;
      }
      
      requestAnimationFrame(animateRespawnedBomb);
    }
    
    animateRespawnedBomb();
    
    // Return the respawned bomb and its position for the arrow indicator
    return {
      bomb: respawnedBomb,
      position: { x: xPos, y: yPos, z: 0 }
    };
  }
  
  // Create a directional arrow indicator that points to the smoke bomb
  function createSmokeArrowIndicator(targetX, targetY) {
    // Create a container for the arrow
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
    
    // Create the arrow itself
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
    
    // Update the arrow position and rotation in the animation loop
    function updateArrowIndicator() {
      // Only show the arrow when the player is low on smoke bombs (0 or 1 remaining)
      if (hero.hasSmokeAttack && hero.smokeBombsCount <= 1) {
        // Make the arrow visible
        arrowContainer.style.opacity = '1';
        
        // Convert 3D world position to screen space
        const targetVector = new THREE.Vector3(targetX, targetY, 0);
        const screenPosition = worldToScreen(targetVector);
        
        // Calculate direction from player to bomb
        const playerScreenPos = worldToScreen(new THREE.Vector3(hero.position.x, hero.position.y, 0));
        
        // Calculate angle for arrow to point toward smoke bomb
        const dx = screenPosition.x - playerScreenPos.x;
        const dy = screenPosition.y - playerScreenPos.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // Position the arrow at the edge of the screen if the target is off-screen
        const margin = 100; // Margin from screen edge
        let arrowX, arrowY;
        
        // Check if target is off-screen
        const isOffScreen = 
          screenPosition.x < margin || 
          screenPosition.x > window.innerWidth - margin || 
          screenPosition.y < margin || 
          screenPosition.y > window.innerHeight - margin;
        
        if (isOffScreen) {
          // Calculate position at screen edge
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          
          // Calculate angle from screen center to target
          const targetAngle = Math.atan2(screenPosition.y - screenCenterY, screenPosition.x - screenCenterX);
          
          // Calculate position on screen edge
          const edgeRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - margin;
          arrowX = screenCenterX + Math.cos(targetAngle) * edgeRadius;
          arrowY = screenCenterY + Math.sin(targetAngle) * edgeRadius;
        } else {
          // If on screen, position near the target
          arrowX = screenPosition.x;
          arrowY = screenPosition.y - 60; // Position slightly above the target
        }
        
        // Update the arrow's position and rotation
        arrowContainer.style.left = `${arrowX - 20}px`; // Center the arrow
        arrowContainer.style.top = `${arrowY - 20}px`;
        arrow.style.transform = `rotate(${angle - 90}deg)`; // -90 to adjust for the arrow pointing up by default
        
        // Pulse effect
        const pulse = (Math.sin(Date.now() * 0.005) + 1) * 0.25 + 0.5;
        arrowContainer.style.transform = `scale(${pulse})`;
      } else {
        // Hide the arrow when not needed
        arrowContainer.style.opacity = '0';
      }
      
      requestAnimationFrame(updateArrowIndicator);
    }
    
    updateArrowIndicator();
    
    return {
      element: arrowContainer,
      update: updateArrowIndicator,
      remove: function() {
        document.getElementById('renderDiv').removeChild(arrowContainer);
      }
    };
  }
  
  // Helper function to convert 3D world coordinates to 2D screen coordinates
  function worldToScreen(worldVector) {
    const vector = worldVector.clone();
    // Project vector to screen space
    vector.project(camera);
    
    // Convert to screen coordinates
    return {
      x: (vector.x * 0.5 + 0.5) * window.innerWidth,
      y: (-vector.y * 0.5 + 0.5) * window.innerHeight
    };
  }
  
  // Start animation with time parameter
  animate(0);
  
  // ------------------------------
  // Handle Window Resize with Debounce
  // ------------------------------
  let resizeTimeout;
  window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250);
  });
}

// Start the game immediately
initGame();

