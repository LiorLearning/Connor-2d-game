import * as THREE from 'three';
import { updateDodgeIndicator } from './controls.js';
import { showMathQuiz } from '../ui/mathQuiz.js';
import { createMinion } from '../entities/minion.js';
import { triggerScreenShake } from './scene.js';
import { createJumpFlashEffect } from '../environment/jumpBoost.js';
import { createNotification } from '../ui/interface.js';
import { createBoltCounter, updateBoltCounter, spawnBoltOnFirstRooftop, createBoltProjectile } from '../collectibles/bolt.js';

// Import new modular components
import { updateSpriteOrientation, handleHeroFalling, handleHeroInvulnerability } from '../entities/heroUpdates.js';
import { updateMinions, updateMinionHealthBar, spawnMinions, checkLevelThreeStageTransition } from '../entities/minionUpdates.js';
import { handleEnemyIndicators, processHeroAttack } from '../ui/combatUI.js';
import { advanceToNextLevel, handleJumpPrompt } from '../gameplay/levelManager.js';
import { createSmokeExplosion } from '../effects/smokeEffects.js';

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
  boltCollectible,
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
        
        // Check if player collected the bolt
        if (!boltCollectible.collected && boltCollectible.checkCollision(hero.position)) {
          boltCollectible.collect();
          
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
        
        // Apply gravity
        hero.velocity.y -= 0.015; // Increased from 0.01 for faster falling
        
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
    const heroHalfWidth = 1.0;
    
    for (const rooftop of rooftops) {
      // Check if any part of the hero is on the rooftop (more lenient collision)
      if (hero.position.x + heroHalfWidth >= rooftop.userData.xMin && 
          hero.position.x - heroHalfWidth <= rooftop.userData.xMax && 
          Math.abs(hero.position.z) <= rooftop.geometry.parameters.depth/2) {
            
        // Check if hero is at the right height to be on this rooftop
        const rooftopHeight = rooftop.position.y + (rooftop.geometry.parameters.height / 2);
        const heroBottom = hero.position.y - 1; // Approximate hero's feet position
        
        // If hero is at or slightly above the rooftop, and not jumping upward
        if (heroBottom <= rooftopHeight + 0.5 && hero.velocity.y <= 0) {
          onAnyRooftop = true;
          currentRooftop = rooftop;
          
          // Mark hero as having reached second rooftop when they land on it
          if (rooftop.userData.id === 1 && !hero.hasReachedSecondRooftop) {
            hero.hasReachedSecondRooftop = true;
          }
          
          break;
        }
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
    
    // Update shield visualization
    if (hero.updateShield) {
      hero.updateShield();
    }

    // Update villain particles only (hero trail removed)
    trail.update();

    // Update camera and skyline parallax.
    camera.position.x = hero.position.x;
    
    // Elevate camera when on stairs in Level 3
    if (gameState.currentLevel === 3 && hero.position.x >= 50 && hero.position.x <= 60 && hero.position.y >= 3.5) {
      camera.position.y = 8; // Raise camera to see rifle men on the elevated platform
    } else {
      camera.position.y = 4; // Default camera height
    }
    
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
    handleJumpPrompt(hero, currentRooftop, minions, boltCollectible);

    // After the part where we check if hero is on any rooftop, add code to check for stairs in Level 3

    if (onAnyRooftop && currentRooftop) {
      // Check if we were falling and now landed on a rooftop
      if (!hero.grounded || hero.velocity.y < 0) {
        hero.grounded = true;
        hero.velocity.y = 0;
        // Ensure hero is exactly at the rooftop level
        hero.position.y = currentRooftop.position.y + (currentRooftop.geometry.parameters.height / 2) + 1;
      }
      
      // Add handling for Level 3 stairs platform
      if (gameState.currentLevel === 3 && hero.hasDefeatedStage1 && 
          hero.position.x >= 50 && hero.position.x <= 60 && 
          hero.position.y >= 3.5) {
        
        // Check if this is the first time reaching the platform
        if (hero.gameState && hero.gameState.currentStage === 1) {
          // Advance to stage 2 of Level 3
          advanceToNextLevel(gameState.currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions);
        }
      }
    } 
    else if (hero.velocity.y < 0) {
      // Not on any rooftop and moving downward
      hero.grounded = false;
    }

    // After all the updates and before rendering
    
    // Check if the player has reached the next stage in Level 3
    // if (gameState.gamePhase === "gameplay") {
    //   checkLevelThreeStageTransition(hero, scene, minions, gameState.currentLevel, levelIndicator, createMinion, instructions);
    // }
    
    // Render scene
    renderer.render(scene, camera);
  }

  // Start animation with time parameter
  animate(0);
}