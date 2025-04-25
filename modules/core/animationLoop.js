import * as THREE from 'three';
import { updateDodgeIndicator } from './controls.js';
import { showMathQuiz } from '../ui/mathQuiz.js';
import { createMinion } from '../entities/minion.js';
import { triggerScreenShake } from './scene.js';
import { createJumpFlashEffect } from '../environment/jumpBoost.js';
import { createNotification } from '../ui/interface.js';
import { createBoltCounter, updateBoltCounter, spawnBoltOnFirstRooftop, createBoltProjectile } from '../collectibles/bolt.js';
import { changeBackgroundMusic } from './audio.js';

// Import new modular components
import { updateSpriteOrientation, handleHeroFalling, handleHeroInvulnerability } from '../entities/heroUpdates.js';
import { updateMinions, updateMinionHealthBar, spawnMinions } from '../entities/minionUpdates.js';
import { handleEnemyIndicators, processHeroAttack } from '../ui/combatUI.js';
import { advanceToNextLevel } from '../gameplay/levelManager.js';

// Function to transition to stage 2 with new background and music
function transitionToStage2(scene, hero) {
  // Mark the hero as having transitioned to prevent multiple transitions
  hero.stageTransitioned = true;
  
  // Set game state to stage 2
  if (hero.gameState) {
    hero.gameState.currentStage = 2;
  }
  
  // Show transition notification
  createNotification(
    'STAGE 2 UNLOCKED!<br><span style="font-size: 20px">Proceeding to the next stage...</span>',
    {
      color: '#00ffff',
      fontSize: '36px',
      duration: 4000,
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    }
  );
  
  // Fade out current screen
  const fadeOverlay = document.createElement('div');
  fadeOverlay.id = 'fadeOverlay';
  Object.assign(fadeOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    opacity: '0',
    transition: 'opacity 2s',
    zIndex: '1000',
    pointerEvents: 'none'
  });
  document.body.appendChild(fadeOverlay);
  
  // Start fade in
  setTimeout(() => {
    fadeOverlay.style.opacity = '1';
  }, 100);
  
  // Change background and music after fade completes
  setTimeout(() => {
    // Change background texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('assets/background2.png', 
      // On successful load
      (newBackgroundTexture) => {
        scene.background = newBackgroundTexture;
        
        // Pause the initial music before changing to the new background music
        const currentMusic = document.getElementById('background-music') || document.querySelector('audio');
        if (currentMusic) {
          currentMusic.pause();
        }
        
        // Change background music using our dedicated function
        changeBackgroundMusic('./assets/bg-music2.mp3', 2000, 2000);
        
        // Spawn rifle minions for Stage 2
        setTimeout(() => {
          // Import necessary functions
          import('../entities/minionUpdates.js').then(minionUpdatesModule => {
            // Reset rifle minions state
            minionUpdatesModule.resetRifleMinionsState();
            
            // Spawn initial rifle minions on the elevated platform
            for (let i = 0; i < 2; i++) {
              setTimeout(() => {
                const xPos = 80 + (i - 1) * 2;
                const zPos = (Math.random() - 0.5) * 3;
                // Create rifle minions
                import('../entities/minion.js').then(minionModule => {
                  const newMinion = minionModule.createMinion(scene, xPos, 5, zPos, 3, 'rifle-man');
                  if (window.gameState && window.gameState.minions) {
                    window.gameState.minions.push(newMinion);
                  }
                  
                  // Add spawn effect
                  minionModule.createMinionSpawnEffect(scene, xPos, 5, zPos, 3);
                });
              }, i * 300);
            }
            
            // Show notification about rifle minions
            createNotification(
              'RIFLE MINIONS AHEAD!<br><span style="font-size: 16px">Defeat them quickly - you only have 10 seconds!</span>',
              {
                color: '#ff5555',
                fontSize: '26px',
                duration: 3000,
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            );
          });
        }, 2000);
        
        // Fade out overlay
        setTimeout(() => {
          const overlay = document.getElementById('fadeOverlay');
          if (overlay) {
            overlay.style.opacity = '0';
            console.log('Fade out started');
            setTimeout(() => {
              if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                console.log('Fade overlay removed');
              }
            }, 2000);
          }
        }, 1000);
      },
      // Progress
      (progress) => {
        console.log(`Background loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
      },
      // On error loading texture
      (err) => {
        console.error('Error loading new background:', err);
        const overlay = document.getElementById('fadeOverlay');
        if (overlay) {
          overlay.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
          }, 2000);
        }
      }
    );
  }, 2000);
}

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
  levelIndicator,
  updateShieldBar
) {
  function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for consistent animation speed regardless of frame rate
    const deltaTime = clock.getDelta();
    const elapsed = currentTime - lastTime;
    lastTime = currentTime;
    
    // Don't skip frames, and use deltaTime to scale animations instead
    const timeScale = Math.min(deltaTime * 60, 2.0); // Cap at 2x to prevent huge jumps

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
          // Normal movement when not dodging - scaled by timeScale at moderate speed
          if (keys.left) {
            hero.velocity.x = -0.35 * timeScale; // Balanced speed between original and reduced
          } else if (keys.right) {
            hero.velocity.x = 0.35 * timeScale; // Balanced speed between original and reduced
          } else {
            hero.velocity.x *= 0.85; // Changed from 0.9 for smoother deceleration
          }
        }
        
        // Apply gravity - scaled by timeScale
        hero.velocity.y -= 0.015 * timeScale; // Scale by timeScale
        
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
          
          // Apply appropriate jump based on position - scaled by timeScale at moderate speed
          if (isNearFirstRooftopEdge) {
            hero.velocity.y = 0.35 * timeScale; // Keep jump height the same
            hero.velocity.x = 0.3 * timeScale; // Balanced horizontal boost
            
            // Highlight the jump boost indicator
            jumpBoostIndicator.highlight();
          } else {
            hero.velocity.y = 0.25 * timeScale; // Keep normal jump height the same
          }
          hero.grounded = false;
          
          // Create jump flash effect
          createJumpFlashEffect(scene, hero.position);
        }
      } else {
        hero.velocity.x = 0;
        hero.velocity.y = 0;
      }
      
      // Scale position updates by timeScale
      hero.position.x += hero.velocity.x;
      hero.position.y += hero.velocity.y;
    } else {
      hero.velocity.x = 0;
      hero.velocity.y = 0;
    }
    
    // Run game physics at higher framerate
    renderer.setAnimationLoop = null; // Disable Three.js animation loop
    
    // Check if hero is on any rooftop
    let onAnyRooftop = false;
    let currentRooftop = null;
    
    // Define the hero's sprite width for collision purposes
    const heroHalfWidth = 1.0;
    
    // Check for invisible wall at the stairs (around x=70) if gunmen aren't defeated
    if (gameState.currentLevel === 3 && !hero.allGunmenDefeated && 
        hero.position.x > 68 && hero.position.x < 72) {
      // Push hero back from the invisible wall
      hero.position.x = 68;
      hero.velocity.x = -0.1; // Slight push back
      
      // Debug log
      
      // Show notification about the blocked path
      if (Date.now() - (hero.lastWallNotification || 0) > 5000) { // Show message only every 5 seconds
        hero.lastWallNotification = Date.now();
        createNotification(
          'PATH BLOCKED!<br><span style="font-size: 16px">Defeat all gun minions first!</span>',
          { 
            color: '#ff3333', 
            fontSize: '24px', 
            duration: 2000,
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }
        );
      }
    }
    
    // Debug log if player is near the stairs
    if (gameState.currentLevel === 3 && hero.position.x > 67 && hero.position.x < 73) {
      // Check every second to avoid console spam
      if (Date.now() % 1000 < 20) {
      }
    }
    
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
      
      // Reload the game after delay
      setTimeout(() => {
        window.location.reload();
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

    // Subtle hover animation for hero sprite and update glow opacity (optimized)
    const now = Date.now(); // Cache this value to avoid multiple calls
    hero.sprite.position.y = Math.sin(now * 0.003) * 0.1;
    hero.glowSprite.material.opacity = 0.3 + Math.sin(now * 0.004) * 0.1;
    
    // Update shield visualization
    if (hero.updateShield) {
      hero.updateShield();
    }

    // Update villain particles only (hero trail removed)
    trail.update();

    // Update camera and skyline parallax.
    camera.position.x = hero.position.x;
    
    // Elevate camera only when near the stairs in Level 3
    if (gameState.currentLevel === 3) {
      // Check if player is near the stairs (adjusted for new positions)
      if (hero.position.x >= 65 && hero.position.x <= 85 && hero.position.y >= 2) {
        camera.position.y = 8; // Raise camera to see rifle men on the elevated platform
      } else {
        camera.position.y = 4; // Default camera height for horizontal movement on roofs
      }
    } else {
      camera.position.y = 4; // Default camera height for other levels
    }
    
    skyline.position.x = hero.position.x * 0.4;
    
    // Check if hero has reached the second rooftop and spawn minions if needed
    if (currentRooftop && currentRooftop.userData.id === 1 && !gameState.minionsSpawned) {
      spawnMinions(scene, currentRooftop, minions, gameState.currentLevel, hero, instructions);
      gameState.minionsSpawned = true;
    }
    
    // Check for enemies in attack range and show indicator
    // handleEnemyIndicators(hero, minions);
    
    // Combat system - handle attacks
    if (gameState.gamePhase === "gameplay" && keys.attack && !gameState.movementLocked) {
      processHeroAttack(hero, minions, scene, gameState.minionsFought, gameState.totalMinions, 
        gameState.currentLevel, levelIndicator, updateHealthBar, trail, createMinion, instructions, gameState);
    }
    
    // Update minions
    updateMinions(hero, minions, scene, triggerScreenShake, updateHealthBar);
    
    // Update hero health bar
    updateHealthBar(hero.health);
    
    // Update shield health bar
    updateShieldBar(hero.shieldHealth);
    
    // Handle hero invulnerability after hit
    handleHeroInvulnerability(hero);

    // After the part where we check if hero is on any rooftop, add code to check for stairs in Level 3

    if (onAnyRooftop && currentRooftop) {
      // Check if we were falling and now landed on a rooftop
      if (!hero.grounded || hero.velocity.y < 0) {
        hero.grounded = true;
        hero.velocity.y = 0;
        // Ensure hero is exactly at the rooftop level
        hero.position.y = currentRooftop.position.y + (currentRooftop.geometry.parameters.height / 2) + 1;
      }
      
      // Add handling for Level 3 stage transition - check for any position on the elevated platform
      if (gameState.currentLevel === 3 && hero.allGunmenDefeated && !hero.stageTransitioned &&
          hero.position.x >= 71 && hero.position.x <= 89 && 
          Math.abs(hero.position.y - 4.5) < 1.5) { // More flexible height check
        
        // Debug log for transition
        
        // Transition to stage 2 with new background and music
        transitionToStage2(scene, hero);
      }
      
      // Debug info to check transition conditions - use the same position check
      if (hero.position.x >= 71 && hero.position.x <= 89 && 
          Math.abs(hero.position.y - 4.5) < 1.5) {
      }

      // Legacy code for stage advancement
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
    
    // Use optimized rendering
    renderer.render(scene, camera);
  }

  // Start animation with time parameter and higher priority
  requestAnimationFrame(() => {
    animate(performance.now());
  }, { priority: 'high' });
}