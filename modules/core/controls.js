export function setupControls(gamePhase, movementLocked, hero, introOverlay, speechBubble, instructions, villain, trail) {
  const keys = { left: false, right: false, jump: false, attack: false, dodge: false };
  
  document.addEventListener('keydown', (event) => {
    if (gamePhase === "intro" && event.key === 'Enter') {
      // Start gameplay and lock hero movement while villain is visible.
      gamePhase = "gameplay";
      movementLocked = true;
      document.getElementById('renderDiv').removeChild(introOverlay);
      instructions.innerHTML = 'Use ARROW KEYS or WASD to move and jump';

      // Show villain speech bubble for 3 seconds.
      speechBubble.style.opacity = '1';
      speechBubble.style.left = '60%';
      speechBubble.style.top = '30%';
      setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);

      // After 5 seconds, create a vanishing effect for the villain and unlock hero movement.
      setTimeout(() => {
        // Villain vanishing effect
        villain.fadeOut(() => {
          movementLocked = false;
          
          // Add pulse effect to hero when movement unlocks
          hero.createPulseEffect(trail);
        });
      }, 5000);
    } else if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a': keys.left = true; break;
        case 'ArrowRight':
        case 'd': keys.right = true; break;
        case 'ArrowUp':
        case 'w':
        case ' ': keys.jump = true; break;
        case 'f':
        case 'e': keys.attack = true; break;
        case 'Shift': keys.dodge = true; break;
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    if (gamePhase === "gameplay") {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a': keys.left = false; break;
        case 'ArrowRight':
        case 'd': keys.right = false; break;
        case 'ArrowUp':
        case 'w':
        case ' ': keys.jump = false; break;
        case 'f':
        case 'e': keys.attack = false; break;
        case 'Shift': keys.dodge = false; break;
      }
    }
  });
  
  return keys;
}

// Function to update dodge indicator UI
export function updateDodgeIndicator(hero) {
  const dodgeFill = document.getElementById('dodgeFill');
  if (!dodgeFill) return;
  
  const now = Date.now();
  const elapsed = now - hero.lastDodge;
  
  if (elapsed < hero.dodgeCooldown) {
    // Still on cooldown
    const percentage = (elapsed / hero.dodgeCooldown) * 100;
    dodgeFill.style.width = `${percentage}%`;
    
    // Change color based on availability
    if (percentage < 50) {
      dodgeFill.style.backgroundColor = '#ff3333';
    } else if (percentage < 100) {
      dodgeFill.style.backgroundColor = '#ffaa00';
    }
  } else {
    // Dodge is available
    dodgeFill.style.width = '100%';
    dodgeFill.style.backgroundColor = '#00ffff';
  }
}