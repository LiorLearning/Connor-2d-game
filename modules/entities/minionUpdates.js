import * as THREE from 'three';
import { createNotification } from '../ui/interface.js';
import { createMinionHitEffect, createMinionSpawnEffect, createMinion } from './minion.js';
import { advanceToNextLevel } from '../gameplay/levelManager.js';

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
}

export function spawnMinions(scene, currentRooftop, minions, currentLevel, hero, instructions) {
  // Create minion spawn animation and notification
  createNotification(
    'BOLT\'S MINIONS APPEAR!<br><span style="font-size: 20px">Defeat 3 of 20 minions</span>',
    { color: '#ff33ff', fontSize: '28px', duration: 2000 }
  );
  
  // Spawn 3 minions with a slight delay between each
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      // Position minions across the second rooftop with random offsets
      const xPos = 35 + (i - 1) * 5;
      const zPos = (Math.random() - 0.5) * 3;
      
      // Create minion and add to array
      const minion = createMinion(scene, xPos, 1.5, zPos, currentLevel);
      minions.push(minion);
      
      // Create spawn effect
      createMinionSpawnEffect(scene, xPos, 1.5, zPos, currentLevel);
    }, i * 600); // Stagger spawn timing
  }
  
  // Update instructions
  instructions.innerHTML = hero.hasBoltAttack ? 
    'BOLT\'S MINIONS BLOCK YOUR PATH! Press E or F to attack!' :
    'BOLT\'S MINIONS BLOCK YOUR PATH! Find bolts to attack!';
}

export function defeatedMinion(minion, scene, minionsFought, totalMinions, 
    currentLevel, levelIndicator, hero, updateHealthBar, trail, minions, instructions, createMinion) {
  
  minion.active = false;
  
  // Create defeat effect
  createMinionHitEffect(scene, minion.group.position);
  
  // Hide minion
  minion.group.visible = false;
  
  // Show defeat notification
  createNotification(
    `MINION DEFEATED!<br><span style="font-size: 18px">${minionsFought + 1} of ${totalMinions}</span>`,
    { color: '#8833ff', duration: 1500 }
  );
  
  // Check if all 3 minions on the second rooftop are defeated
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
    
    // Progress to next level - use the imported createMinion function
    advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions);
  }
}

function processMinionRangedAttack(minion, hero, scene, triggerScreenShake, updateHealthBar) {
  if (minion.canShoot) { // Check if minion can shoot based on level
    const now = Date.now();
    const rangedAttackDistance = 15; // Range for shooting
    const distanceToHero = Math.abs(hero.position.x - minion.group.position.x);
    
    // Calculate hover amount here for use in projectile positioning
    const hoverAmount = Math.sin(Date.now() * 0.003 + minion.position.x) * 0.1;

    // If hero is in range and minion can shoot (cooldown check)
    if (distanceToHero < rangedAttackDistance && now - minion.lastProjectile > minion.projectileCooldown) {
      minion.lastProjectile = now;

      // Determine direction for projectile
      const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;

      // Create dark energy projectile (plane geometry)
      const projectileGeometry = new THREE.PlaneGeometry(0.2, 0.1); // Reduced height from 0.2 to 0.1
      const projectileMaterial = new THREE.MeshBasicMaterial({
        color: 0xff3333, // Red projectile for minions
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
            hero.health -= 15; // Level 2 minions do more damage
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
        const screenEdgeMargin = 0; // Reduced margin for later removal
        // Need to reference camera which may not be available here
        // Use a simpler check for boundaries based on distance traveled
        const distanceTraveled = Math.abs(projectile.position.x - startX);
        
        if (distanceTraveled > 30) { // Remove after traveling a certain distance
          // Remove projectile and trail if too far
          scene.remove(projectile);
          if (scene.children.includes(trail)) { // Remove trail only if it exists
              scene.remove(trail);
          }
          return; // Stop the animation loop
        } else if (trail.material.opacity <= 0 && scene.children.includes(trail)) {
           // If trail faded completely, remove it, but let the projectile continue
           scene.remove(trail);
        }

        // Continue animation
        requestAnimationFrame(animateMinionProjectile);
      })();
    }
  }
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
      // Damage hero
      hero.health -= 10;
      hero.lastHit = now;
      hero.isInvulnerable = true;

      // Update health bar
      updateHealthBar(hero.health);

      // Determine direction for projectile
      const attackDirection = minion.group.position.x < hero.position.x ? 1 : -1;

      // Create and animate melee projectile effect
      createMinionMeleeProjectile(scene, minion, hero, attackDirection);

      // Create hit notification
      createNotification('-10 HP', { 
        color: '#ff3333', 
        duration: 500,
        fontSize: '28px'
      });
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