import * as THREE from 'three';
import { loadTextures } from '../utils/textureLoader.js';

export function createMinion(scene, x, y, z, level = 1, type = '') {
  // Load textures based on minion type
  let minionTexture;
  
  // Load the appropriate texture based on type parameter
  const textures = loadTextures();
  if (type === 'gun-man') {
    // Use gun-man texture for Level 3 Stage 1
    minionTexture = textures.gunManTexture;
  } else if (type === 'rifle-man') {
    // Use rifle-man texture for Level 3 Stage 2
    minionTexture = textures.rifleManTexture;
  } else {
    // Use default texture for Level 1 and 2
    minionTexture = textures.minionTexture;
  }
  
  const minion = {
    position: { x, y, z },
    health: 100,
    active: true,
    group: new THREE.Group(),
    lastHit: 0,
    hitCooldown: 500, // milliseconds between hits
    level: level, // Store the level
    canShoot: level >= 2 || type === 'gun-man' || type === 'rifle-man', // Level 2+ and Level 3 minions can shoot
    projectileCooldown: type === 'rifle-man' ? 7000 : 9000, // Rifle minions shoot faster
    lastProjectile: 0, // Track last shot time
    damage: type === 'rifle-man' ? 20 : 15, // Rifle minions deal more damage
    type: type // Store the minion type
  };
  
  // Create minion sprite with color tint based on type
  let spriteColor;
  
  if (type === 'gun-man') {
    spriteColor = 0xffbb88; // Orange tint for gun-man
  } else if (type === 'rifle-man') {
    spriteColor = 0xff5555; // Red tint for rifle-man
  } else {
    spriteColor = 0xbbbbff; // Default purple tint for lower level minions
  }
  
  const minionMaterial = new THREE.SpriteMaterial({
    map: minionTexture,
    transparent: true,
    alphaTest: 0.1,
    color: spriteColor
  });
  
  const minionSprite = new THREE.Sprite(minionMaterial);
  minionSprite.scale.set(2.0, 2.0, 1); // Smaller than the main villain
  minionSprite.scale.x = -Math.abs(minionSprite.scale.x); // Face left initially
  minion.group.add(minionSprite);
  
  // Add glow with color based on type
  let glowColor;
  
  if (type === 'gun-man') {
    glowColor = 0xff8800; // Orange glow for gun-man
  } else if (type === 'rifle-man') {
    glowColor = 0xff3333; // Red glow for rifle-man
  } else {
    glowColor = 0x8833ff; // Default purple glow
  }
  
  const minionGlowMaterial = new THREE.SpriteMaterial({
    map: minionTexture,
    transparent: true,
    color: glowColor,
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
  
  // Health bar fill (color based on type)
  const healthBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(healthBarWidth - 0.05, healthBarHeight - 0.05),
    new THREE.MeshBasicMaterial({ color: glowColor })
  );
  healthBarFill.position.set(0, 2.0, 0.01);
  minion.healthBar = healthBarFill;
  minion.group.add(healthBarFill);
  
  // Add indicator property
  minion.indicator = null;
  
  return minion;
}

// Create a spawn effect at the minion's position
export function createMinionSpawnEffect(scene, x, y, z, level = 1) {
  // Different color based on level
  const color = level === 1 ? 0xff33ff : (level === 2 ? 0xffaa00 : 0xff3333);
  
  const spawnEffect = new THREE.Mesh(
    new THREE.CircleGeometry(1, 16),
    new THREE.MeshBasicMaterial({ 
      color: color, 
      transparent: true, 
      opacity: 0.8,
      side: THREE.DoubleSide
    })
  );
  spawnEffect.position.set(x, y, z);
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
  
  return spawnEffect;
}

// Create an impact effect when a minion is hit
export function createMinionHitEffect(scene, position, color = 0x8833ff) {
  const impactEffect = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 16),
    new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
  );
  impactEffect.position.copy(position);
  impactEffect.rotation.x = -Math.PI / 2;
  scene.add(impactEffect);
  
  // Animate defeat effect
  const startTime = Date.now();
  (function expandEffect() {
    const elapsed = Date.now() - startTime;
    if (elapsed < 800) {
      impactEffect.scale.set(1 + elapsed / 200, 1 + elapsed / 200, 1);
      impactEffect.material.opacity = 0.8 * (1 - elapsed / 800);
      requestAnimationFrame(expandEffect);
    } else {
      scene.remove(impactEffect);
    }
  })();
  
  return impactEffect;
}