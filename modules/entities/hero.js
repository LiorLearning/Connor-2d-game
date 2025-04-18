import * as THREE from 'three';
import { loadTextures } from '../utils/textureLoader.js';

export function initHero(scene) {
  // Load textures
  const { ninjaTexture } = loadTextures();
  
  // Create hero object
  const hero = {
    position: { x: 0, y: 1.5, z: 0 },
    velocity: { x: 0, y: 0 },
    grounded: true,
    falling: false,
    group: new THREE.Group(),
    lastAttack: 0, // For attack cooldown
    health: 100,   // Add hero health
    lastHit: 0,    // For invulnerability frames after being hit
    invulnerableTime: 1000, // 1 second of invulnerability after being hit
    isInvulnerable: false,
    isDodging: false,
    dodgeSpeed: 0.8, // Increased from 0.4
    dodgeDirection: 0,
    dodgeStartTime: 0,
    dodgeDuration: 250, // Decreased from 300 milliseconds for faster dodge
    dodgeCooldown: 1000, // milliseconds
    lastDodge: 0,
    hasReachedSecondRooftop: false,
    // Bolt properties
    hasBoltAttack: false,
    boltCount: 0,
    lastBoltRespawn: 0,
    boltRespawnCooldown: 10000, // 10 seconds between respawns
    // Shield properties
    hasShield: true,
    shieldHealth: 100, // 100% shield
    shieldMesh: null,  // Will hold the shield mesh
  };

  // Create hero sprite and glow effect
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

  // Create shield visualization (spherical shield around the hero)
  const shieldGeometry = new THREE.SphereGeometry(2, 24, 24);
  const shieldMaterial = new THREE.MeshBasicMaterial({
    color: 0x8B4513, // Brown color
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
    wireframe: false
  });
  const shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
  hero.group.add(shieldMesh);
  hero.shieldMesh = shieldMesh;

  hero.group.position.set(0, hero.position.y, 0);
  scene.add(hero.group);
  
  // Add methods to hero object
  hero.createPulseEffect = function() {
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
        
        // Create radial particles - this would be handled by the trail system
        // which will be passed in from the main animation loop
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
  };
  
  // Create dodge effect
  hero.createDodgeEffect = function() {
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
  };
  
  // Create afterimage effect
  hero.createAfterimage = function() {
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
  };

  // Update shield visibility based on shield health
  hero.updateShield = function() {
    if (this.hasShield && this.shieldHealth > 0) {
      // Show shield with opacity based on health percentage
      this.shieldMesh.visible = true;
      this.shieldMesh.material.opacity = 0.2 + (this.shieldHealth / 100) * 0.3; // Opacity from 0 to 0.5 based on health
    } else {
      // Hide shield when depleted
      this.shieldMesh.visible = false;
    }
  };

  // Expose heroSprite and heroGlowSprite for other modules
  hero.sprite = heroSprite;
  hero.glowSprite = heroGlowSprite;
  
  return hero;
}