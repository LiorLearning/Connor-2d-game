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
  
  // Reload the game after delay
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

export function handleHeroInvulnerability(hero) {
  if (hero.isInvulnerable) {
    // Check if this is math-based invincibility (has purple glow)
    const isMathInvincibility = hero.glowSprite.material.color.r > 0.9 && 
                                hero.glowSprite.material.color.b > 0.9;
    
    if (!isMathInvincibility) {
      // Regular damage-based invincibility - use the flashing effect
      const flashRate = 150; // ms
      const now = Date.now();
      const flashPhase = Math.floor((now - hero.lastHit) / flashRate) % 2;
      
      // Toggle visibility based on flash phase
      hero.sprite.material.opacity = flashPhase === 0 ? 1.0 : 0.3;
    }
    
    // Check if invulnerability period is over (for both types)
    const now = Date.now();
    if (now - hero.lastHit > hero.invulnerableTime) {
      hero.isInvulnerable = false;
      
      // Reset appearance to normal
      hero.sprite.material.opacity = 1.0;
      hero.sprite.material.color.set(0xffffff);
      hero.glowSprite.material.color.set(0x00ffff);
      hero.glowSprite.material.opacity = 0.3;
    }
  }
} 