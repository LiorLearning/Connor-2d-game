import * as THREE from 'three';
import { createNotification } from '../ui/interface.js';
import { createMinionHitEffect, createMinionSpawnEffect, createMinion } from './minion.js';
import { advanceToNextLevel } from '../gameplay/levelManager.js';
import { showMathQuiz } from '../ui/mathQuiz.js';

// Export minion update functions
export function updateMinions(hero, minions, scene, triggerScreenShake, updateHealthBar) {
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
      
      // Level 2+ minions can shoot projectiles
      processMinionRangedAttack(minion, hero, scene, triggerScreenShake, updateHealthBar);
      
      // Process melee attacks
      processMinionMeleeAttack(minion, hero, scene, triggerScreenShake, updateHealthBar);
    }
  });
}

export function updateMinionHealthBar(minion) {
  // Define healthBarWidth for this scope
  const healthBarWidth = 1.5;
  
  // Update health bar - ensure it doesn't go below 0
  const healthPercentage = Math.max(0, minion.health) / 100;
  const healthBarOriginalWidth = healthBarWidth - 0.05;
  minion.healthBar.scale.x = healthPercentage;
  
  // Center the health bar fill as it shrinks
  minion.healthBar.position.x = -((1 - healthPercentage) * healthBarOriginalWidth) / 2;
  
  // If health is at 0, mark the minion as defeated
  if (minion.health <= 0 && minion.active) {
    minion.defeated = true;
  }
}

export function spawnMinions(scene, currentRooftop, minions, currentLevel, hero, instructions) {
  // Create minion spawn animation and notification
  createNotification(
    'BOLT\'S GUN MINIONS APPEAR!<br><span style="font-size: 20px">Defeat 4 Gun Minions</span>',
    { color: '#ffaa00', fontSize: '28px', duration: 2000 }
  );
  
  // Spawn 4 minions with a slight delay between each (changed from 3)
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      // Position minions across the second rooftop with random offsets
      const xPos = 35 + (i - 1.5) * 4; // Adjusted spacing for 4 minions
      const zPos = (Math.random() - 0.5) * 3;
      
      // Create gun-man minion and add to array (regardless of level)
      const minion = createMinion(scene, xPos, 1.5, zPos, currentLevel, 'gun-man');
      minions.push(minion);
      
      // Create spawn effect
      createMinionSpawnEffect(scene, xPos, 1.5, zPos, currentLevel);
    }, i * 500); // Slightly faster spawn timing
  }
  
  // Update instructions
  instructions.innerHTML = hero.hasBoltAttack ? 
    'BOLT\'S GUN MINIONS BLOCK YOUR PATH! Press E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!' :
    'BOLT\'S GUN MINIONS BLOCK YOUR PATH! Find bolts to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!';
}

export function defeatedMinion(minion, scene, minionsFought, totalMinions, 
    currentLevel, levelIndicator, hero, updateHealthBar, trail, minions, instructions, createMinion) {
  
  minion.active = false;
  
  // Create defeat effect
  createMinionHitEffect(scene, minion.group.position);
  
  // Hide minion
  minion.group.visible = false;
  
  // Show defeat notification for gun minions
  const defeatMessage = `GUN MINION DEFEATED!<br><span style="font-size: 18px">${minionsFought + 1} of 3</span>`;
  
  // Choose color for gun-man
  let defeatColor = '#ffaa00';
  
  createNotification(
    defeatMessage,
    { color: defeatColor, duration: 1500 }
  );
  
  // Check level-specific completion conditions
  if (currentLevel === 1 || currentLevel === 2) {
    // Check if all 3 minions on the current level are defeated
    if (minionsFought + 1 === 3) {
      // Restore full health
      hero.health = 100;
      updateHealthBar(hero.health);
      
      // Create health restoration effect
      createNotification(
        'HEALTH FULLY RESTORED!',
        { color: '#00ff88', duration: 2000 }
      );
      
      // Create healing visual effect around hero
      trail.createHealingParticles(hero.position);
      
      // Progress to next level
      advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions);
    }
  } 
  else if (currentLevel === 3) {
    // For Level 3, check which stage we're in
    if (hero.gameState && hero.gameState.currentStage === 1) {
      // Stage 1: Gun minions - need to defeat 4 (changed from 3)
      if (minionsFought + 1 === 4) {
        // Restore full health
        hero.health = 100;
        updateHealthBar(hero.health);
        
        // Create health restoration effect
        createNotification(
          'HEALTH FULLY RESTORED!',
          { color: '#00ff88', duration: 2000 }
        );
        
        // Create healing visual effect around hero
        trail.createHealingParticles(hero.position);
        
        // Create effects for stairs appearing
        createStairsAppearEffect(scene, 45, 1.5, 0);
        
        // Show notification about stairs
        createNotification(
          'STAIRS APPEARED!<br><span style="font-size: 18px">Climb up to face more gun minions!</span>',
          { color: '#00ffff', duration: 3000 }
        );
        
        // Add instruction to climb stairs
        instructions.innerHTML = 'Climb the stairs to reach the next stage!';
        
        // Create gameState property for tracking progression
        hero.hasDefeatedStage1 = true;
      }
    } 
    else if (hero.gameState && hero.gameState.currentStage === 2) {
      // Stage 2: Gun minions - need to defeat 3
      if (minionsFought + 1 === 3) {
        // Restore full health
        hero.health = 100;
        updateHealthBar(hero.health);
        
        // Create health restoration effect
        createNotification(
          'HEALTH FULLY RESTORED!',
          { color: '#00ff88', duration: 2000 }
        );
        
        // Create healing visual effect around hero
        trail.createHealingParticles(hero.position);
        
        // Create effects for new stairs appearing for Stage 3
        createStairsAppearEffect(scene, 65, 4.5, 0);
        
        // Show notification about stairs
        createNotification(
          'NEW STAIRS APPEARED!<br><span style="font-size: 18px">Climb up to face rifle minions!</span>',
          { color: '#ff5500', duration: 3000 }
        );
        
        // Add instruction to climb stairs
        instructions.innerHTML = 'Climb the new stairs to reach the final stage!';
        
        // Update game state for Stage 3
        hero.hasDefeatedStage2 = true;
        hero.gameState.currentStage = 3;
      }
    }
    else if (hero.gameState && hero.gameState.currentStage === 3) {
      // Stage 3: Rifle minions - need to defeat 2
      if (minionsFought + 1 === 2) {
        // Restore full health
        hero.health = 100;
        updateHealthBar(hero.health);
        
        // Create health restoration effect
        createNotification(
          'HEALTH FULLY RESTORED!',
          { color: '#00ff88', duration: 2000 }
        );
        
        // Create healing visual effect around hero
        trail.createHealingParticles(hero.position);
        
        // Progress to completion
        advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions);
      }
    }
  }
}

// Create a visual effect for stairs appearing
function createStairsAppearEffect(scene, x, y, z) {
  // Create a glowing effect where stairs will appear
  const stairsEffect = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3, 2),
    new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      transparent: true, 
      opacity: 0.3,
      wireframe: true
    })
  );
  stairsEffect.position.set(x, y + 1.5, z);
  scene.add(stairsEffect);
  
  // Animate the effect
  const startTime = Date.now();
  const duration = 2000;
  (function animateStairsEffect() {
    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const progress = elapsed / duration;
      stairsEffect.scale.set(1 + progress * 0.5, 1 + progress * 0.5, 1 + progress * 0.5);
      stairsEffect.rotation.y += 0.02;
      stairsEffect.material.opacity = 0.3 * (1 - progress);
      requestAnimationFrame(animateStairsEffect);
    } else {
      scene.remove(stairsEffect);
      
      // Create actual stairs after effect completes
      createStairs(scene, x, y, z);
    }
  })();
}

// Create the actual stairs geometry
function createStairs(scene, x, y, z) {
  // Create a staircase with 5 steps
  const steps = 5;
  const stepWidth = 5;
  const stepHeight = 0.5;
  const stepDepth = 2;
  
  for (let i = 0; i < steps; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth),
      new THREE.MeshPhongMaterial({
        color: 0x00aadd,
        emissive: 0x006699,
        emissiveIntensity: 0.6,
        shininess: 60
      })
    );
    
    // Position each step higher and slightly forward
    step.position.set(
      x + (i * 0.8),
      y + (i * stepHeight) + stepHeight/2,
      z
    );
    
    scene.add(step);
    
    // Add glow effect to steps
    const stepEdge = new THREE.Mesh(
      new THREE.BoxGeometry(stepWidth, 0.1, stepDepth + 0.2),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
      })
    );
    stepEdge.position.set(
      x + (i * 0.8),
      y + (i * stepHeight) + stepHeight,
      z
    );
    scene.add(stepEdge);
  }
  
  // Create a platform at the top where rifle minions will be
  const platform = new THREE.Mesh(
    new THREE.BoxGeometry(10, stepHeight, 5),
    new THREE.MeshPhongMaterial({
      color: 0x00aadd,
      emissive: 0x006699,
      emissiveIntensity: 0.6,
      shininess: 60
    })
  );
  
  platform.position.set(
    x + 8, // Position platform at end of stairs
    y + (steps * stepHeight) + stepHeight/2,
    z
  );
  
  scene.add(platform);
  
  // Add platform edge glow
  const platformEdge = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.1, 5.2),
    new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.6
    })
  );
  platformEdge.position.set(
    x + 8,
    y + (steps * stepHeight) + stepHeight,
    z
  );
  scene.add(platformEdge);
}

function processMinionRangedAttack(minion, hero, scene, triggerScreenShake, updateHealthBar) {
  if (minion.canShoot) { // Check if minion can shoot based on level
    const now = Date.now();
    const rangedAttackDistance = 5; // Range for shooting - reduced from 15 to 5 for closer range
    const distanceToHero = Math.abs(hero.position.x - minion.group.position.x);
    
    // Calculate hover amount here for use in projectile positioning
    const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;

    // If hero is in range and minion can shoot (cooldown check) and game is not paused/solving math
    if (distanceToHero < rangedAttackDistance && now - minion.lastProjectile > minion.projectileCooldown 
        && !(window.gameState && window.gameState.movementLocked)) {
      minion.lastProjectile = now;

      // Determine direction for projectile
      const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;

      // Create projectile based on minion type
      if (minion.type === 'gun-man') {
        createGunBulletProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar);
      } else if (minion.type === 'rifle-man') {
        createRifleBulletProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar);
      } else {
        // Default projectile for Level 2 minions
        createDefaultProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar);
      }
    }
  }
}

// Default projectile for Level 2 minions (original implementation)
function createDefaultProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar) {
  // Create dark energy projectile (plane geometry)
  const projectileGeometry = new THREE.PlaneGeometry(0.2, 0.1); // Reduced height from 0.2 to 0.1
  const projectileMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2222, // Red projectile for minions
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

  // Position projectile at minion's position
  projectile.position.set(
    minion.group.position.x + (attackDirection * 0.7), // Start slightly in front
    minion.group.position.y + hoverAmount, // Match hover height
    0
  );

  // Rotate based on attack direction (slight angle)
  projectile.rotation.z = attackDirection > 0 ? -Math.PI / 12 : Math.PI / 12;

  scene.add(projectile);

  // Create trail effect for projectile
  const trail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.6, 0.2), // Smaller trail
    new THREE.MeshBasicMaterial({
      color: 0x880000, // Darker red trail
      transparent: true,
      opacity: 0.5
    })
  );
  trail.position.copy(projectile.position);
  trail.position.x -= attackDirection * 0.5; // Trail starts behind
  trail.rotation.z = projectile.rotation.z;
  scene.add(trail);

  // Set up variables for projectile animation
  const projectileSpeed = 0.1; // Adjust speed as needed
  const startX = projectile.position.x;
  const startY = projectile.position.y; 

  // Animate the projectile
  (function animateMinionProjectile() {
    // Calculate movement based on speed and direction
    const moveX = attackDirection * projectileSpeed;
    projectile.position.x += moveX;
    // Keep projectile at the same Y level it started at
    projectile.position.y = startY;

    // Update trail position
    trail.position.x = projectile.position.x - (attackDirection * 0.3);
    trail.position.y = projectile.position.y;
    // Fade trail slightly over time
    trail.material.opacity = Math.max(0, trail.material.opacity - 0.005);

    // Check collision with hero during projectile flight
    if (!hero.isInvulnerable && !hero.isDodging) { // Don't hit if dodging
      const projectileToHeroDistance = Math.sqrt(
        Math.pow(hero.position.x - projectile.position.x, 2) +
        Math.pow(hero.position.y - projectile.position.y, 2)
      );

      // Use smaller collision radius for projectile
      if (projectileToHeroDistance < 0.8) { 
        // Hero was hit by projectile
        hero.health -= 15; // Damage amount
        hero.lastHit = Date.now();
        hero.isInvulnerable = true; // Grant invulnerability frames

        // Update health bar
        updateHealthBar(hero.health);

        // Trigger screen shake on hit
        triggerScreenShake(0.1, 150);

        // Create impact effect (smaller red circle)
        const impactEffect = new THREE.Mesh(
          new THREE.CircleGeometry(0.6, 16),
          new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.8
          })
        );
        impactEffect.position.set(hero.position.x, hero.position.y, 0);
        impactEffect.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(impactEffect);

        // Animate impact effect (quick flash)
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

        // End projectile animation early by removing meshes
        scene.remove(projectile);
        if (scene.children.includes(trail)) { // Remove trail only if it exists
           scene.remove(trail);
        }
        return; // Stop the animation loop for this projectile
      }
    }

    // Check if projectile is off-screen
    const distanceTraveled = Math.abs(projectile.position.x - startX);
    
    if (distanceTraveled > 30) {
      // Remove projectile and trail when they travel too far
      scene.remove(projectile);
      scene.remove(trail);
    } else {
      // Continue animation if still on screen
      requestAnimationFrame(animateMinionProjectile);
    }
  })();
}

// Gun bullet projectile for Level 3 Stage 1 gun-man minions
function createGunBulletProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar) {
  // Create bullet projectile (circular geometry for bullet)
  const projectileGeometry = new THREE.CircleGeometry(0.4, 0.2); // Small circle for bullet
  const projectileMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2222, // Orange/gold for gun bullet
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

  // Position projectile at minion's position
  projectile.position.set(
    minion.group.position.x + (attackDirection * 0.7), // Start slightly in front
    minion.group.position.y + hoverAmount + 0.3, // Slightly higher to match gun position
    0
  );

  // Make bullet flat
  projectile.rotation.x = -Math.PI / 2;

  scene.add(projectile);

  // Create muzzle flash effect
  const muzzleFlash = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff2222, // Bright yellow
      transparent: true,
      opacity: 0.8
    })
  );
  muzzleFlash.position.set(
    minion.group.position.x + (attackDirection * 0.5),
    minion.group.position.y + hoverAmount + 0.3,
    0
  );
  muzzleFlash.rotation.x = -Math.PI / 2;
  scene.add(muzzleFlash);

  // Animate muzzle flash quickly
  setTimeout(() => {
    scene.remove(muzzleFlash);
  }, 100);

  // Set up variables for projectile animation
  const projectileSpeed = 0.2; // Faster than default projectiles
  const startX = projectile.position.x;
  const startY = projectile.position.y; 

  // Animate the projectile
  (function animateGunProjectile() {
    // Calculate movement based on speed and direction
    const moveX = attackDirection * projectileSpeed;
    projectile.position.x += moveX;
    // Keep projectile at the same Y level it started at
    projectile.position.y = startY;

    // Check collision with hero during projectile flight
    if (!hero.isInvulnerable && !hero.isDodging) { // Don't hit if dodging
      const projectileToHeroDistance = Math.sqrt(
        Math.pow(hero.position.x - projectile.position.x, 2) +
        Math.pow(hero.position.y - projectile.position.y, 2)
      );

      // Use smaller collision radius for bullet
      if (projectileToHeroDistance < 0.7) { 
        // Hero was hit by bullet
        if (hero.hasShield && hero.shieldHealth > 0) {
          // Reduce shield by 33%
          hero.shieldHealth -= 33;
          
          // Update shield visual
          hero.updateShield();
          
          // Create shield hit notification
          createNotification('-33% SHIELD!', { 
            color: '#8B4513', 
            duration: 800,
            fontSize: '24px'
          });
          
          // Check if shield is depleted
          if (hero.shieldHealth <= 0) {
            hero.hasShield = false;
            // Show math quiz to restore shield after a short delay
            setTimeout(() => {
              showShieldRestorationQuiz(hero);
            }, 1000);
          }
        } else {
          // No shield, damage health directly
          hero.health -= minion.damage; // Use minion's damage value
          
          // Update health bar
          updateHealthBar(hero.health);
        }
        
        // Set invulnerability regardless of shield
        hero.lastHit = Date.now();
        hero.isInvulnerable = true; // Grant invulnerability frames

        // Trigger screen shake on hit
        triggerScreenShake(0.1, 150);

        // Create impact effect
        const impactEffect = new THREE.Mesh(
          new THREE.CircleGeometry(0.4, 12),
          new THREE.MeshBasicMaterial({
            color: hero.hasShield && hero.shieldHealth > 0 ? 0x8B4513 : 0xffaa00, // Brown if shield absorbed, orange if not
            transparent: true,
            opacity: 0.8
          })
        );
        impactEffect.position.set(hero.position.x, hero.position.y, 0);
        impactEffect.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(impactEffect);

        // Animate impact effect (quick flash)
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

        // End projectile animation early by removing meshes
        scene.remove(projectile);
        return; // Stop the animation loop for this projectile
      }
    }

    // Check if projectile is off-screen
    const distanceTraveled = Math.abs(projectile.position.x - startX);
    
    if (distanceTraveled > 30) {
      // Remove projectile when it travels too far
      scene.remove(projectile);
    } else {
      // Continue animation if still on screen
      requestAnimationFrame(animateGunProjectile);
    }
  })();
}

// Rifle bullet projectile for Level 3 Stage 2 rifle-man minions
function createRifleBulletProjectile(scene, minion, hero, attackDirection, hoverAmount, triggerScreenShake, updateHealthBar) {
  // Create rifle bullet projectile (elongated rectangle for rifle bullet)
  const projectileGeometry = new THREE.PlaneGeometry(0.4, 0.2); // Elongated bullet
  const projectileMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2222, // Bright red for rifle bullet
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

  // Position projectile at minion's position
  projectile.position.set(
    minion.group.position.x + (attackDirection * 0.8), // Start slightly in front
    minion.group.position.y + hoverAmount + 0.35, // Slightly higher to match rifle position
    0
  );

  // Rotate based on attack direction
  projectile.rotation.z = attackDirection > 0 ? 0 : Math.PI;

  scene.add(projectile);

  // Create muzzle flash effect
  const muzzleFlash = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 8),
    new THREE.MeshBasicMaterial({
      color: 0xff5522, // Orange/red
      transparent: true,
      opacity: 0.8
    })
  );
  muzzleFlash.position.set(
    minion.group.position.x + (attackDirection * 0.6),
    minion.group.position.y + hoverAmount + 0.35,
    0
  );
  muzzleFlash.rotation.x = -Math.PI / 2;
  scene.add(muzzleFlash);

  // Animate muzzle flash quickly
  setTimeout(() => {
    scene.remove(muzzleFlash);
  }, 100);

  // Create smoke trail for rifle bullet
  const smokeTrail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.1),
    new THREE.MeshBasicMaterial({
      color: 0x888888, // Gray smoke
      transparent: true,
      opacity: 0.4
    })
  );
  smokeTrail.position.copy(projectile.position);
  smokeTrail.position.x -= attackDirection * 0.2;
  scene.add(smokeTrail);

  // Set up variables for projectile animation
  const projectileSpeed = 0.3; // Even faster than gun bullets
  const startX = projectile.position.x;
  const startY = projectile.position.y;

  // Animate the projectile
  (function animateRifleProjectile() {
    // Calculate movement based on speed and direction
    const moveX = attackDirection * projectileSpeed;
    projectile.position.x += moveX;
    // Keep projectile at the same Y level it started at
    projectile.position.y = startY;

    // Update smoke trail position - follows a bit behind
    smokeTrail.position.x = projectile.position.x - (attackDirection * 0.2);
    smokeTrail.position.y = projectile.position.y;
    // Fade trail slightly over time
    smokeTrail.material.opacity = Math.max(0, smokeTrail.material.opacity - 0.01);

    // Check collision with hero during projectile flight
    if (!hero.isInvulnerable && !hero.isDodging) { // Don't hit if dodging
      const projectileToHeroDistance = Math.sqrt(
        Math.pow(hero.position.x - projectile.position.x, 2) +
        Math.pow(hero.position.y - projectile.position.y, 2)
      );

      // Use smaller collision radius for rifle bullet
      if (projectileToHeroDistance < 0.7) { 
        // Hero was hit by rifle bullet
        if (hero.hasShield && hero.shieldHealth > 0) {
          // Completely destroy shield (100%)
          hero.shieldHealth = 0;
          hero.hasShield = false;
          
          // Update shield visual
          hero.updateShield();
          
          // Create shield destruction notification
          createNotification('SHIELD DESTROYED!', { 
            color: '#8B4513', 
            duration: 1000,
            fontSize: '24px'
          });
          
          // Show math quiz to restore shield after a short delay
          setTimeout(() => {
            showShieldRestorationQuiz(hero);
          }, 1000);
        } else {
          // No shield, damage health directly
          hero.health -= minion.damage; // Use minion's damage value (20 for rifle)
          
          // Update health bar
          updateHealthBar(hero.health);
        }
        
        // Set invulnerability regardless of shield
        hero.lastHit = Date.now();
        hero.isInvulnerable = true; // Grant invulnerability frames

        // Trigger screen shake on hit - stronger shake for rifle
        triggerScreenShake(0.15, 180);

        // Create impact effect - larger for rifle
        const impactEffect = new THREE.Mesh(
          new THREE.CircleGeometry(0.5, 12),
          new THREE.MeshBasicMaterial({
            color: hero.hasShield ? 0x8B4513 : 0xff2222, // Brown if shield absorbed, red if not
            transparent: true,
            opacity: 0.8
          })
        );
        impactEffect.position.set(hero.position.x, hero.position.y, 0);
        impactEffect.rotation.x = -Math.PI / 2; // Lay flat
        scene.add(impactEffect);

        // Animate impact effect (quick flash)
        const impactStartTime = Date.now();
        const impactDuration = 180; // Longer effect for rifle
        (function animateImpact() {
          const impactElapsed = Date.now() - impactStartTime;
          if (impactElapsed < impactDuration) {
            const impactProgress = impactElapsed / impactDuration;
            impactEffect.scale.set(1 + impactProgress * 2.5, 1 + impactProgress * 2.5, 1);
            impactEffect.material.opacity = 0.8 * (1 - impactProgress);
            requestAnimationFrame(animateImpact);
          } else {
            scene.remove(impactEffect);
          }
        })();

        // End projectile animation early by removing meshes
        scene.remove(projectile);
        scene.remove(smokeTrail);
        return; // Stop the animation loop for this projectile
      }
    }

    // Check if projectile is off-screen
    const distanceTraveled = Math.abs(projectile.position.x - startX);
    
    if (distanceTraveled > 35) { // Rifle bullets travel farther
      // Remove projectile and trail when they travel too far
      scene.remove(projectile);
      scene.remove(smokeTrail);
    } else {
      // Continue animation if still on screen
      requestAnimationFrame(animateRifleProjectile);
    }
  })();
}

function processMinionMeleeAttack(minion, hero, scene, triggerScreenShake, updateHealthBar) {
  const now = Date.now();
  const attackDistance = 2.5; // Slightly less than hero's attack range
  const distance = Math.abs(hero.position.x - minion.group.position.x);

  // If hero is close and minion is not on cooldown
  if (distance < attackDistance && now - minion.lastHit > minion.hitCooldown) {
    minion.lastHit = now;

    // Only damage hero if not invulnerable
    if (!hero.isInvulnerable) {
      // Determine direction for projectile
      const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;

      // Create and animate melee projectile effect
      createMinionMeleeProjectile(scene, minion, hero, attackDirection);

      // Check if hero has shield
      if (hero.hasShield && hero.shieldHealth > 0) {
        // Reduce shield by 50% for melee attack
        hero.shieldHealth -= 50;
        
        // Update shield visual
        hero.updateShield();
        
        // Create shield hit notification
        createNotification('-50% SHIELD!', { 
          color: '#8B4513', 
          duration: 800,
          fontSize: '24px'
        });
        
        // Check if shield is depleted
        if (hero.shieldHealth <= 0) {
          hero.hasShield = false;
          // Show math quiz to restore shield after a short delay
          setTimeout(() => {
            showShieldRestorationQuiz(hero);
          }, 1000);
        }
      } else {
        // No shield, damage health directly
        hero.health -= 10;
        
        // Update health bar
        updateHealthBar(hero.health);
        
        // Create hit notification
        createNotification('-10 HP', { 
          color: '#ff3333', 
          duration: 500,
          fontSize: '28px'
        });
      }
      
      // Set invulnerability regardless of shield
      hero.lastHit = now;
      hero.isInvulnerable = true;
    }
  }
}

function createMinionMeleeProjectile(scene, minion, hero, attackDirection) {
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
}

// Add a new function to check if the player has reached the top of the stairs
export function checkLevelThreeStageTransition(hero, scene, minions, currentLevel, levelIndicator, createMinion, instructions) {
  // Only run this logic if we're in Level 3 and the hero has defeated stage 1
  if (currentLevel === 3 && hero.hasDefeatedStage1 && 
      hero.position.x >= 50 && hero.position.x <= 60 && 
      hero.position.y >= 3.5) {
    
    // Check if this is the first time reaching the platform
    if (hero.gameState && hero.gameState.currentStage === 1) {
      // Mark stage transition
      hero.gameState.currentStage = 2;
      
      // Show stage 2 notification
      createNotification(
        'LEVEL 3 - STAGE 2<br><span style="font-size: 20px">More gun minions ahead!</span>',
        {
          color: '#ff5555',
          fontSize: '36px',
          duration: 3000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }
      );
      
      // Clear any remaining stage 1 minions
      minions.forEach(m => {
        if (m.group) {
          scene.remove(m.group);
        }
      });
      minions.length = 0;
      
      // Spawn gun minions for Level 3 Stage 2
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const xPos = 55 + (i - 1) * 5; // Position them ahead
            const zPos = (Math.random() - 0.5) * 3;
            
            // Create gun-man minions for stage 2
            const newMinion = createMinion(scene, xPos, 4.5, zPos, 3, 'gun-man');
            minions.push(newMinion);
            
            // Add spawn effect
            createMinionSpawnEffect(scene, xPos, 4.5, zPos, 3);
          }, i * 600); // Stagger spawns
        }
        
        // Update instructions
        instructions.innerHTML = hero.hasSmokeAttack ? 
          'LEVEL 3 STAGE 2! Gun minions ahead! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade!' :
          'LEVEL 3 STAGE 2! Gun minions ahead! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade!';
      }, 1000);
    }
  }
  
  // Check for transition to stage 3 with rifle minions
  else if (currentLevel === 3 && !hero.hasDefeatedStage2 && 
          hero.position.x >= 70 && hero.position.x <= 80 && 
          hero.position.y >= 6.5) {
    
    // Check if this is the first time reaching the higher platform
    if (hero.gameState && hero.gameState.currentStage === 3 && !hero.reachedStage3) {
      // Mark that player has reached stage 3
      hero.reachedStage3 = true;
      
      // Show stage 3 notification
      createNotification(
        'LEVEL 3 - FINAL STAGE<br><span style="font-size: 20px">Rifle minions spotted!</span>',
        {
          color: '#ff3333',
          fontSize: '36px',
          duration: 3000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }
      );
      
      // Clear any remaining stage 2 minions
      minions.forEach(m => {
        if (m.group) {
          scene.remove(m.group);
        }
      });
      minions.length = 0;
      
      // Spawn rifle minions for Level 3 Stage 3
      setTimeout(() => {
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const xPos = 75 + (i - 0.5) * 5; // Position them ahead
            const zPos = (Math.random() - 0.5) * 3;
            
            // Create rifle-man minions for the final stage
            const newMinion = createMinion(scene, xPos, 7.5, zPos, 3, 'rifle-man');
            minions.push(newMinion);
            
            // Add spawn effect
            createMinionSpawnEffect(scene, xPos, 7.5, zPos, 3);
          }, i * 800); // Longer stagger for dramatic effect
        }
        
        // Update instructions
        instructions.innerHTML = hero.hasSmokeAttack ? 
          'FINAL STAGE! Rifle minions deal more damage! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade!' :
          'FINAL STAGE! Rifle minions deal more damage! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade!';
      }, 1000);
    }
  }
}

// Function to show a math quiz for shield restoration
function showShieldRestorationQuiz(hero) {
  // Lock movement during quiz
  if (window.gameState) {
    window.gameState.movementLocked = true;
  }
  
  // Create notification about shield restoration
  createNotification(
    'SHIELD DEPLETED!<br><span style="font-size: 18px">Answer math questions to restore it!</span>',
    { color: '#8B4513', duration: 2000 }
  );
  
  // Show the quiz with a custom callback for shield restoration
  setTimeout(() => {
    // Create a special gameState with a callback to restore shield
    const shieldRestoreState = {
      movementLocked: true,
      onQuizComplete: function(earnedPoints) {
        // Restore shield based on correct answers
        hero.hasShield = true;
        hero.shieldHealth = Math.min(100, earnedPoints * 25); // Each correct answer = 25% shield
        
        // Update shield visual
        hero.updateShield();
        
        // Show notification
        createNotification(
          `SHIELD RESTORED: ${hero.shieldHealth}%!`,
          { color: '#8B4513', duration: 2000 }
        );
        
        // Explicitly ensure movement is unlocked
        if (window.gameState) {
          window.gameState.movementLocked = false;
        }
      }
    };
    
    showMathQuiz(hero, shieldRestoreState);
  }, 2500);
} 