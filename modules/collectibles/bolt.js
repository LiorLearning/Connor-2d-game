import * as THREE from 'three';
import { loadTextures } from '../utils/textureLoader.js';
import { worldToScreen } from '../core/scene.js';

export function createBoltCollectible(scene, hero, gameState, showMathQuiz) {
  // Load textures
  const { boltTexture } = loadTextures();
  
  const collectibleGroup = new THREE.Group();
  
  // Create bolt sprite
  const boltMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
    transparent: true,
    opacity: 1.0
  });
  
  const boltSprite = new THREE.Sprite(boltMaterial);
  boltSprite.scale.set(1.2, 1.2, 1);
  collectibleGroup.add(boltSprite);
  
  // Add glow effect
  const glowMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
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
    boltSprite.material.rotation += 0.01;
    glowSprite.material.rotation += 0.005;
    
    requestAnimationFrame(animateCollectible);
  }
  
  animateCollectible();
  
  // Create collectible object
  const boltCollectible = {
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
  
  return boltCollectible;
}

// Function to create a bolt counter UI
export function createBoltCounter(hero) {
  // Load textures
  const { boltTexture } = loadTextures();
  
  const counterContainer = document.createElement('div');
  counterContainer.id = 'boltCounter';
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
  
  // Add bolt icon
  const boltIcon = document.createElement('div');
  boltIcon.id = 'boltIcon';
  Object.assign(boltIcon.style, {
    width: '30px',
    height: '30px',
    backgroundImage: `url(${boltTexture.source.data.src})`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    marginRight: '10px'
  });
  
  // Add counter text
  const boltCount = document.createElement('div');
  boltCount.id = 'boltCount';
  Object.assign(boltCount.style, {
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '24px',
    color: '#00ffff',
    textShadow: '0 0 5px rgba(0, 255, 255, 0.8)',
    minWidth: '40px',
    textAlign: 'center'
  });
  boltCount.textContent = `x${hero.boltCount}`;
  
  counterContainer.appendChild(boltIcon);
  counterContainer.appendChild(boltCount);
  document.getElementById('renderDiv').appendChild(counterContainer);
  
  return counterContainer;
}

// Update bolt counter  
export function updateBoltCounter(hero) {
  const boltCount = document.getElementById('boltCount');
  if (boltCount) {
    boltCount.textContent = `x${hero.boltCount}`;
    
    // Change color when low on bolts
    if (hero.boltCount <= 1) {
      boltCount.style.color = '#ff3333';
      boltCount.style.textShadow = '0 0 5px rgba(255, 51, 51, 0.8)';
    } else {
      // Reset color when not low on bolts
      boltCount.style.color = '#00ffff';
      boltCount.style.textShadow = '0 0 5px rgba(0, 255, 255, 0.8)';
    }
    
    // Add pulse animation when count changes
    boltCount.style.animation = 'none';
    void boltCount.offsetWidth; // Trigger reflow to restart animation
    boltCount.style.animation = 'pulseBoltCount 0.5s ease-in-out';
  }
}

// Function to spawn a bolt on the first rooftop
export function spawnBoltOnFirstRooftop(scene, hero, gameState, showMathQuiz) {
  // Load textures
  const { boltTexture } = loadTextures();
  
  // Create a new bolt collectible at a random position on the first rooftop
  const xPos = -5 + Math.random() * 15; // Random position between -5 and 10 on first rooftop
  const yPos = 1.5; // Slightly above the rooftop
  
  // Create a directional arrow indicator for the bolt
  const arrowIndicator = createBoltArrowIndicator(xPos, yPos, hero);
  
  // Create a bolt with the same design as the original collectible
  const respawnedBolt = {
    group: new THREE.Group(),
    collected: false
  };
  
  // Create bolt sprite
  const boltMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
    transparent: true,
    opacity: 1.0
  });
  
  const boltSprite = new THREE.Sprite(boltMaterial);
  boltSprite.scale.set(1.2, 1.2, 1);
  respawnedBolt.group.add(boltSprite);
  
  // Add glow effect
  const glowMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
    transparent: true,
    color: 0x00ffff,
    opacity: 0.5
  });
  
  const glowSprite = new THREE.Sprite(glowMaterial);
  glowSprite.scale.set(1.5, 1.5, 1);
  respawnedBolt.group.add(glowSprite);
  
  // Position the bolt
  respawnedBolt.group.position.set(xPos, yPos, 0);
  scene.add(respawnedBolt.group);
  
  // Add floating animation
  const startY = respawnedBolt.group.position.y;
  
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
  respawnNotification.innerHTML = 'BOLT RESPAWNED!<br><span style="font-size: 16px">Return to first rooftop</span>';
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
  
  // Add bolt collection logic
  function animateRespawnedBolt() {
    if (respawnedBolt.collected) return;
    
    // Floating animation
    respawnedBolt.group.position.y = startY + Math.sin(Date.now() * 0.003) * 0.5;
    glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.005) * 0.2;
    
    // Rotate slightly
    boltSprite.material.rotation += 0.01;
    glowSprite.material.rotation += 0.005;
    
    // Check for collision with hero
    const distance = Math.sqrt(
      Math.pow(hero.position.x - respawnedBolt.group.position.x, 2) + 
      Math.pow(hero.position.y - respawnedBolt.group.position.y, 2)
    );
    
    if (distance < 1.5 && !respawnedBolt.collected) {
      // Mark as collected
      respawnedBolt.collected = true;
      respawnedBolt.group.visible = false;
      
      // Create collection effect
      const collectionEffect = new THREE.Mesh(
        new THREE.CircleGeometry(1, 16),
        new THREE.MeshBasicMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.8
        })
      );
      collectionEffect.position.copy(respawnedBolt.group.position);
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
      if (typeof gameState === 'object') {
        gameState.movementLocked = true;
      } else {
        // Create a proper gameState object if it doesn't exist
        gameState = { movementLocked: true };
      }
      
      // Show math quiz dialog - reuse the same quiz function as the initial bolt
      // Remove the arrow indicator if it exists
      const arrowIndicator = document.getElementById('boltArrowIndicator');
      if (arrowIndicator) {
        document.getElementById('renderDiv').removeChild(arrowIndicator);
      }
      
      showMathQuiz(hero, gameState);
      
      return;
    }
    
    requestAnimationFrame(animateRespawnedBolt);
  }
  
  animateRespawnedBolt();
  
  // Return the respawned bolt and its position for the arrow indicator
  return {
    bolt: respawnedBolt,
    position: { x: xPos, y: yPos, z: 0 }
  };
}

// Create a directional arrow indicator that points to the bolt
function createBoltArrowIndicator(targetX, targetY, hero) {
  // Create a container for the arrow
  const arrowContainer = document.createElement('div');
  arrowContainer.id = 'boltArrowIndicator';
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
    // Only show the arrow when the player is low on bolts (0 or 1 remaining)
    if (hero.hasBoltAttack && hero.boltCount <= 1) {
      // Make the arrow visible
      arrowContainer.style.opacity = '1';
      
      // Convert 3D world position to screen space
      const targetVector = new THREE.Vector3(targetX, targetY, 0);
      const screenPosition = worldToScreen(targetVector);
      
      // Calculate direction from player to bolt
      const playerScreenPos = worldToScreen(new THREE.Vector3(hero.position.x, hero.position.y, 0));
      
      // Calculate angle for arrow to point toward bolt
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

// Function to create a bolt projectile when hero attacks
export function createBoltProjectile(scene, hero, minion, attackDirection) {
  // Load textures
  const { boltTexture } = loadTextures();
  
  // Create bolt sprite
  const projectileMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
    transparent: true,
    opacity: 1.0
  });
  const projectile = new THREE.Sprite(projectileMaterial);
  
  // Size the bolt appropriately
  projectile.scale.set(0.8, 0.8, 1);
  
  // Position projectile at hero's position
  projectile.position.set(
    hero.position.x + (attackDirection * 0.8), 
    hero.position.y, 
    0
  );
  
  scene.add(projectile);
  
  // Create lightning trail particles
  const particleCount = 8;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const particleMaterial = new THREE.SpriteMaterial({
      map: boltTexture,
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
  const startX = projectile.position.x;
  const targetX = minion.group.position.x;
  const totalDistance = targetX - startX;
  
  // Adjust projectile duration based on distance
  const baseDuration = 150;
  const distanceFactor = Math.min(2.5, Math.abs(totalDistance) / 5);
  const projectileDuration = baseDuration * distanceFactor;
  
  (function animateProjectile() {
    const elapsed = Date.now() - projectileStartTime;
    if (elapsed < projectileDuration) {
      const progress = elapsed / projectileDuration;
      
      // Move projectile toward target with zigzag pattern for lightning effect
      projectile.position.x = startX + (progress * totalDistance);
      // Add zigzag pattern for lightning
      projectile.position.y = hero.position.y + Math.sin(progress * Math.PI * 3) * 0.3;
      
      // Spin the bolt as it flies
      projectile.material.rotation += 0.15;
      
      // Update lightning trail particles
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        // Position particles along the path with different offsets
        const particleProgress = Math.max(0, progress - (i * 0.05));
        if (particleProgress > 0) {
          particle.position.x = startX + (particleProgress * totalDistance);
          particle.position.y = hero.position.y + Math.sin(particleProgress * Math.PI * 3) * 0.3;
          
          // Fade out particles based on their position in the trail
          particle.material.opacity = 0.4 * (1 - particleProgress);
          // Gradually reduce scale of trailing particles
          const scale = 0.3 * (1 - particleProgress * 0.7);
          particle.scale.set(scale, scale, 1);
        }
      }
      
      requestAnimationFrame(animateProjectile);
    } else {
      // Create lightning explosion at impact
      createBoltExplosion(scene, minion.group.position, boltTexture);
      
      // Remove projectile and particles
      scene.remove(projectile);
      particles.forEach(particle => scene.remove(particle));
    }
  })();
}

// Function to create a bolt explosion at the impact point
export function createBoltExplosion(scene, position, boltTexture) {
  const particleCount = 12;
  const particles = [];
  
  // Create explosion particles
  for (let i = 0; i < particleCount; i++) {
    const particleMaterial = new THREE.SpriteMaterial({
      map: boltTexture,
      transparent: true,
      opacity: 0.8,
      color: 0x00ffff
    });
    
    const particle = new THREE.Sprite(particleMaterial);
    const scale = 0.2 + Math.random() * 0.4;
    particle.scale.set(scale, scale, 1);
    
    // Position around the impact point
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 0.5;
    particle.position.set(
      position.x + Math.cos(angle) * distance,
      position.y + Math.sin(angle) * distance,
      0
    );
    
    scene.add(particle);
    particles.push({
      sprite: particle,
      direction: {
        x: Math.cos(angle) * (0.05 + Math.random() * 0.05),
        y: Math.sin(angle) * (0.05 + Math.random() * 0.05)
      },
      rotation: (Math.random() - 0.5) * 0.2
    });
  }
  
  // Add central flash
  const flashMaterial = new THREE.SpriteMaterial({
    map: boltTexture,
    transparent: true,
    opacity: 0.9,
    color: 0xffffff
  });
  
  const flash = new THREE.Sprite(flashMaterial);
  flash.scale.set(1.5, 1.5, 1);
  flash.position.copy(position);
  scene.add(flash);
  
  // Animate particles
  const startTime = Date.now();
  (function animateBoltExplosion() {
    const elapsed = Date.now() - startTime;
    if (elapsed < 400) {
      const lifeProgress = elapsed / 400;
      
      // Update flash
      flash.material.opacity = 0.9 * (1 - lifeProgress);
      flash.scale.set(1.5 * (1 + lifeProgress), 1.5 * (1 + lifeProgress), 1);
      
      // Update particles
      particles.forEach(particle => {
        // Move outward
        particle.sprite.position.x += particle.direction.x;
        particle.sprite.position.y += particle.direction.y;
        
        // Spin
        particle.sprite.material.rotation += particle.rotation;
        
        // Fade out
        particle.sprite.material.opacity = 0.8 * (1 - lifeProgress);
      });
      
      requestAnimationFrame(animateBoltExplosion);
    } else {
      // Remove all particles
      scene.remove(flash);
      particles.forEach(particle => scene.remove(particle.sprite));
    }
  })();
}