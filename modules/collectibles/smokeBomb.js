import * as THREE from 'three';
import { loadTextures } from '../utils/textureLoader.js';
import { worldToScreen } from '../core/scene.js';

export function createSmokeBombCollectible(scene, hero, gameState, showMathQuiz) {
  // Load textures
  const { smokeBombTexture } = loadTextures();
  
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
  
  // Create collectible object
  const smokeBombCollectible = {
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
  
  return smokeBombCollectible;
}

// Function to create a smoke bomb counter UI
export function createSmokeBombCounter(hero) {
  // Load textures
  const { smokeBombTexture } = loadTextures();
  
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
  
  return counterContainer;
}

// Update smoke bomb counter
export function updateSmokeBombCounter(hero) {
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

// Function to spawn a smoke bomb on the first rooftop
export function spawnSmokeBombOnFirstRooftop(scene, hero, gameState, showMathQuiz) {
  // Load textures
  const { smokeBombTexture } = loadTextures();
  
  // Create a new smoke bomb collectible at a random position on the first rooftop
  const xPos = -5 + Math.random() * 15; // Random position between -5 and 10 on first rooftop
  const yPos = 1.5; // Slightly above the rooftop
  
  // Create a directional arrow indicator for the smoke bomb
  const arrowIndicator = createSmokeArrowIndicator(xPos, yPos, hero);
  
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
      if (typeof gameState === 'object') {
        gameState.movementLocked = true;
      } else {
        // Create a proper gameState object if it doesn't exist
        gameState = { movementLocked: true };
      }
      
      // Show math quiz dialog - reuse the same quiz function as the initial bomb
      // Remove the arrow indicator if it exists
      const arrowIndicator = document.getElementById('smokeArrowIndicator');
      if (arrowIndicator) {
        document.getElementById('renderDiv').removeChild(arrowIndicator);
      }
      
      showMathQuiz(hero, gameState);
      
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
function createSmokeArrowIndicator(targetX, targetY, hero) {
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