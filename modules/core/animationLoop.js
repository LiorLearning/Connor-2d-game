import * as THREE from 'three';
import { updateDodgeIndicator } from './controls.js';
import { showMathQuiz } from '../ui/mathQuiz.js';
import { createMinion } from '../entities/minion.js';
import { loadTextures } from '../utils/textureLoader.js';

function createSmokeExplosion(scene, position, smokeBombTexture) {
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
      position.x + (Math.random() - 0.5) * 1.2,
      position.y + (Math.random() - 0.5) * 1.2,
      position.z + (Math.random() - 0.5) * 0.2
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
}

function updateMinionHealthBar(minion) {
  // Define healthBarWidth for this scope
  const healthBarWidth = 1.5;
  
  // Update health bar - ensure it doesn't go below 0
  const healthPercentage = Math.max(0, minion.health) / 100;
  const healthBarOriginalWidth = healthBarWidth - 0.05;
  minion.healthBar.scale.x = healthPercentage;
  
  // Center the health bar fill as it shrinks
  minion.healthBar.position.x = -((1 - healthPercentage) * healthBarOriginalWidth) / 2;
}

function defeatedMinion(minion, scene, minionsFought, totalMinions, 
    currentLevel, levelIndicator, hero, updateHealthBar, trail, createMinion, minions, instructions) {
  
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
    
    // Progress to next level
    advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions);
  }
}

function advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions) {
  if (currentLevel === 1) {
    // Advance to Level 2
    currentLevel = 2;
    levelIndicator.textContent = 'LEVEL 2';
    levelIndicator.style.color = '#ffaa00'; // Change color for Level 2
    
    // Show level 2 notification
    createNotification(
      'LEVEL 2<br><span style="font-size: 20px">Beware! These minions shoot projectiles!<br>Jump or Dodge to evade!</span>',
      {
        color: '#ffaa00',
        fontSize: '36px',
        duration: 3000,
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }
    );
    
    // Clear any remaining level 1 minions
    minions.forEach(m => {
      if (m.group) {
        scene.remove(m.group);
      }
    });
    minions.length = 0; // Clear the array
    minionsFought = 0; // Reset counter AFTER clearing
    
    // Spawn new minions for Level 2 after a delay
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const xPos = 35 + (i - 1) * 5; // Spread them out
          const zPos = (Math.random() - 0.5) * 3;
          const newMinion = createMinion(scene, xPos, 1.5, zPos, 2); // Create Level 2 minions
          minions.push(newMinion);
          
          // Add spawn effect
          createMinionSpawnEffect(scene, xPos, 1.5, zPos, 2);
        }, i * 600); // Stagger spawns
      }
      
      // Update instructions for level 2
      instructions.innerHTML = hero.hasSmokeAttack ? 
        'LEVEL 2 MINIONS! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade projectiles!' :
        'LEVEL 2 MINIONS! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade projectiles!';
    }, 1000); // Delay before level 2 starts
  } 
  else if (currentLevel === 2) {
    // Advance to Level 3 (Placeholder)
    currentLevel = 3;
    levelIndicator.textContent = 'LEVEL 3';
    levelIndicator.style.color = '#ff3333'; // Red for Level 3
    
    // Show level 3 notification
    createNotification(
      'LEVEL 3<br><span style="font-size: 24px">Congratulations! You beat Level 2!<br>Level 3 to be designed by Connor!!</span>',
      {
        color: '#ff3333',
        fontSize: '36px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)'
      }
    );
    
    // Clear remaining level 2 minions
    minions.forEach(m => {
      if (m.group) {
        scene.remove(m.group);
      }
    });
    minions.length = 0;
    minionsFought = 0; // Reset counter
    
    // For Level 3, just show the message, no further game action yet
    instructions.innerHTML = 'You cleared Level 2! Level 3 is under construction.';
  }
}

function updateMinions(hero, minions, scene, triggerScreenShake, updateHealthBar) {
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
      processMinionRangedAttack(minion, hero, scene, triggerScreenShake);
      
      // Process melee attacks
      processMinionMeleeAttack(minion, hero, scene, triggerScreenShake, updateHealthBar);
    }
  });
}

function processMinionRangedAttack(minion, hero, scene, triggerScreenShake) {
  if (minion.canShoot) { // Check if minion can shoot based on level
    const now = Date.now();
    const rangedAttackDistance = 15; // Range for shooting
    const distanceToHero = Math.abs(hero.position.x - minion.group.position.x);

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
        // Calculate screen edges based on camera view frustum
        const halfWidth = (window.innerWidth / window.innerHeight) * (camera.position.z - projectile.position.z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        const leftEdge = camera.position.x - halfWidth - screenEdgeMargin;
        const rightEdge = camera.position.x + halfWidth + screenEdgeMargin;

        if (projectile.position.x < leftEdge || projectile.position.x > rightEdge) {
          // Remove projectile and trail if off-screen
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

function handleJumpPrompt(hero, currentRooftop, minions, smokeBombCollectible) {
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
}

import { createJumpFlashEffect } from '../environment/jumpBoost.js';
import { createMinionSpawnEffect, createMinionHitEffect } from '../entities/minion.js';
import { createNotification } from '../ui/interface.js';
import { createSmokeBombCounter, updateSmokeBombCounter, spawnSmokeBombOnFirstRooftop } from '../collectibles/smokeBomb.js';
import { triggerScreenShake } from './scene.js';

// Track time for frame-rate independent animations
const clock = new THREE.Clock();
let lastTime = 0;

export function animationLoop(
  scene, 
  camera, 
  renderer, 
  hero, 
  villain, 
  rooftops, 
  skyline, 
  trail, 
  keys, 
  gameState, 
  minions, 
  jumpBoostIndicator, 
  smokeBombCollectible,
  updateHealthBar,
  createMinion,
  speechBubble,
  instructions,
  levelIndicator
) {
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

    if (gameState.gamePhase === "gameplay") {
      // Update hero movement only if not locked.
      if (!gameState.movementLocked) {
        // Update dodge indicator
        updateDodgeIndicator(hero);
        
        // Check if player collected the smoke bomb
        if (!smokeBombCollectible.collected && smokeBombCollectible.checkCollision(hero.position)) {
          smokeBombCollectible.collect();
          
          // Pause game by locking movement
          gameState.movementLocked = true;
          
          // Show math quiz dialog
          showMathQuiz(hero, gameState);
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
              hero.dodgeDirection = (hero.sprite.scale.x > 0) ? 1 : -1;
            }
            
            // Create dodge effect trail
            hero.createDodgeEffect();
            
            // Make hero briefly invulnerable during dodge
            hero.isInvulnerable = true;
            hero.lastHit = now;
            hero.invulnerableTime = hero.dodgeDuration + 100; // Small buffer after dodge ends
            
            // Show dodge notification
            createNotification('DODGE!', { duration: 500 });
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
              hero.createAfterimage();
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
            
            // Highlight the jump boost indicator
            jumpBoostIndicator.highlight();
          } else {
            hero.velocity.y = 0.25; // Increased from 0.2 for higher normal jump
          }
          hero.grounded = false;
          
          // Create jump flash effect
          createJumpFlashEffect(scene, hero.position);
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
      
      createNotification('DEFEATED!', { 
        color: '#ff0000', 
        fontSize: '64px',
        duration: 2000
      });
      
      // Reset hero after delay
      setTimeout(() => {
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
      }, 2500);
    }
    
    // Rooftop boundaries and falling effect
    if (!onAnyRooftop && !hero.falling && hero.position.y <= 1.5) {
      handleHeroFalling(hero, camera, villain, minions, scene, gameState, updateHealthBar, speechBubble, trail);
    }

    if (hero.position.y < 1.5 && !hero.falling) {
      hero.position.y = 1.5;
      hero.velocity.y = 0;
      hero.grounded = true;
    }

    hero.group.position.set(hero.position.x, hero.position.y, 0);

    // Sprite Orientation:
    updateSpriteOrientation(hero, villain);

    // Subtle hover animation for hero sprite and update glow opacity.
    hero.sprite.position.y = Math.sin(Date.now() * 0.003) * 0.1;
    hero.glowSprite.material.opacity = 0.3 + Math.sin(Date.now() * 0.004) * 0.1;

    // Update villain particles only (hero trail removed)
    trail.update();

    // Update camera and skyline parallax.
    camera.position.x = hero.position.x;
    skyline.position.x = hero.position.x * 0.4;
    
    // Check if hero has reached the second rooftop and spawn minions if needed
    if (currentRooftop && currentRooftop.userData.id === 1 && !gameState.minionsSpawned) {
      spawnMinions(scene, currentRooftop, minions, gameState.currentLevel, hero, instructions);
      gameState.minionsSpawned = true;
    }
    
    // Check for enemies in attack range and show indicator
    handleEnemyIndicators(hero, minions);
    
    // Combat system - handle attacks
    if (gameState.gamePhase === "gameplay" && keys.attack && !gameState.movementLocked) {
      processHeroAttack(hero, minions, scene, gameState.minionsFought, gameState.totalMinions, 
        gameState.currentLevel, levelIndicator, updateHealthBar, trail, createMinion, instructions, gameState);
    }
    
    // Update minions
    updateMinions(hero, minions, scene, triggerScreenShake, updateHealthBar);
    
    // Update hero health bar
    updateHealthBar(hero.health);
    
    // Handle hero invulnerability after hit
    handleHeroInvulnerability(hero);
    
    // Add directional indicator for the next rooftop if the hero is near the edge
    handleJumpPrompt(hero, currentRooftop, minions, smokeBombCollectible);

    renderer.render(scene, camera);
  }

  // Start animation with time parameter
  animate(0);
}

// Helper functions for animation loop

function updateSpriteOrientation(hero, villain) {
  // Tagging the left boundary as "back" and the right boundary as "front"
  // At the initial position (hero on left, villain on right), the hero should show its front (right) and the villain its front (left).
  if (hero.position.x < villain.group.position.x) {
    // Hero on left (its front is on right => positive scale.x)
    hero.sprite.scale.x = Math.abs(hero.sprite.scale.x);
    // Villain on right: flip it so that its front (right) appears on the left side.
    villain.sprite.scale.x = -Math.abs(villain.sprite.scale.x);
    villain.glowSprite.scale.x = -Math.abs(villain.glowSprite.scale.x);
  } else {
    // In the reverse scenario, hero faces left and villain faces right.
    hero.sprite.scale.x = -Math.abs(hero.sprite.scale.x);
    villain.sprite.scale.x = Math.abs(villain.sprite.scale.x);
    villain.glowSprite.scale.x = Math.abs(villain.glowSprite.scale.x);
  }
}

function handleHeroFalling(hero, camera, villain, minions, scene, gameState, updateHealthBar, speechBubble, trail) {
  hero.falling = true;
  hero.grounded = false;
  
  // Show falling notification
  createNotification('GAME RESTART', { 
    color: '#ff3333', 
    fontSize: '48px',
    duration: 2000
  });
  
  // Add screen shake effect
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
    villain.sprite.material.opacity = 1.0;
    villain.glowSprite.material.opacity = 0.3;
    
    // Reset minions by removing them from the scene
    minions.forEach(minion => {
      if (minion.group) {
        scene.remove(minion.group);
      }
    });
    minions.length = 0; // Clear the minions array
    
    // Reset game state variables
    gameState.minionsSpawned = false;
    gameState.minionsFought = 0;
    gameState.gamePhase = "gameplay";
    gameState.movementLocked = true;
    
    // Update health bar
    updateHealthBar(hero.health);
    
    // Show restart notification
    createNotification('GAME RESTARTED', { duration: 2000 });
    
    // Show villain speech bubble for 3 seconds
    speechBubble.style.opacity = '1';
    speechBubble.style.left = '60%';
    speechBubble.style.top = '30%';
    setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);
    
    // After 2 seconds, create vanishing effect for villain and unlock hero movement
    setTimeout(() => {
      villain.fadeOut(() => {
        gameState.movementLocked = false;
        hero.createPulseEffect(trail);
      });
    }, 2000);
  }, 2000);
}

function handleHeroInvulnerability(hero) {
  if (hero.isInvulnerable) {
    // Flash hero to show invulnerability
    const flashRate = 150; // ms
    const now = Date.now();
    const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
    
    // Toggle visibility based on flash phase
    hero.sprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
    
    // Check if invulnerability period is over
    if (now - hero.lastHit > hero.invulnerableTime) {
      hero.isInvulnerable = false;
      hero.sprite.material.opacity = 1.0; // Restore normal opacity
    }
  }
}

function spawnMinions(scene, currentRooftop, minions, currentLevel, hero, instructions) {
  // Create minion spawn animation and notification
  createNotification(
    'SMOKE\'S MINIONS APPEAR!<br><span style="font-size: 20px">Defeat 3 of 20 minions</span>',
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
  instructions.innerHTML = hero.hasSmokeAttack ? 
    'SMOKE\'S MINIONS BLOCK YOUR PATH! Press E or F to attack!' :
    'SMOKE\'S MINIONS BLOCK YOUR PATH! Find smoke bombs to attack!';
}

function handleEnemyIndicators(hero, minions) {
  const attackRange = 5.0; // Increased from 3.0 - How close hero needs to be to hit minion
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
    createAttackPrompt(hero);
  } else if (!enemyInRange && document.getElementById('attackPrompt')) {
    const attackPrompt = document.getElementById('attackPrompt');
    document.getElementById('renderDiv').removeChild(attackPrompt);
  }
}

function createAttackPrompt(hero) {
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
}

function processHeroAttack(hero, minions, scene, minionsFought, totalMinions, 
  currentLevel, levelIndicator, updateHealthBar, trail, createMinion, instructions, gameState) {
  
  // Get current time for attack cooldown
  const now = Date.now();
  
  // Check if hero is in attack range of any minion
  const attackRange = 5.0; // Increased from 3.0 - How close hero needs to be to hit minion
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
          
          // Create and animate projectile
          createSmokeBombProjectile(scene, hero, minion, attackDirection);
          
          // Damage minion
          minion.health -= 25; // 4 hits to defeat
          
          // Update minion health bar
          updateMinionHealthBar(minion);
          
          // Minion hit effect - flash and knockback
          minion.group.children[0].material.color.set(0xffffff);
          setTimeout(() => {
            if (minion.active) {
              minion.group.children[0].material.color.set(0xbbbbff);
            }
          }, 100);
          
          // Check if minion is defeated
          if (minion.health <= 0) {
            defeatedMinion(minion, scene, minionsFought, totalMinions, 
              currentLevel, levelIndicator, hero, updateHealthBar, trail, createMinion, minions, instructions);
            minionsFought++;
          }
        }
      }
    });
    
    // If any minion was attacked, process the hero's attack
    if (hasAttacked) {
      // Decrease smoke bomb count
      hero.smokeBombsCount--;
      
      // Update smoke bomb counter
      updateSmokeBombCounter(hero);
      
      // Check if ran out of smoke bombs
      if (hero.smokeBombsCount <= 0) {
        // Show out of bombs notification
        createNotification('OUT OF SMOKE BOMBS!', { 
          color: '#ff3333', 
          duration: 1500
        });
        
        // Check if it's time to respawn a smoke bomb on the first rooftop
        const now = Date.now();
        if (now - hero.lastSmokeBombRespawn > hero.smokeBombRespawnCooldown) {
          // Respawn if the player has zero bombs (regardless of current rooftop)
          spawnSmokeBombOnFirstRooftop(scene, hero, gameState, showMathQuiz);
          hero.lastSmokeBombRespawn = now;
        }
      }
      
      // Show attack animation on hero
      const originalColor = hero.sprite.material.color.clone();
      const originalGlowColor = hero.glowSprite.material.color.clone();
      const originalGlowOpacity = hero.glowSprite.material.opacity;
      
      // Enhance colors for attack
      hero.sprite.material.color.set(0xffffff);
      hero.glowSprite.material.color.set(0x00ffff);
      hero.glowSprite.material.opacity = 0.6;
      
      // Reset after short delay
      setTimeout(() => {
        hero.sprite.material.color.copy(originalColor);
        hero.glowSprite.material.color.copy(originalGlowColor);
        hero.glowSprite.material.opacity = originalGlowOpacity;
      }, 150);
    }
  }
}

function createSmokeBombProjectile(scene, hero, minion, attackDirection) {
  // Load textures
  const { smokeBombTexture } = loadTextures();
  
  // Create smoke bomb sprite
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
      createSmokeExplosion(scene, minion.group.position, smokeBombTexture);
      
      // Remove projectile and particles
      scene.remove(projectile);
      particles.forEach(particle => scene.remove(particle));
    }
  })();
}