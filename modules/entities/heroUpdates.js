import { createNotification } from '../ui/interface.js';

export function updateSpriteOrientation(hero, villain) {
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

export function handleHeroFalling(hero, camera, villain, minions, scene, gameState, updateHealthBar, speechBubble, trail) {
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

export function handleHeroInvulnerability(hero) {
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