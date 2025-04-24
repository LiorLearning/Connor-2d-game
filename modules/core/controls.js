export function setupControls(gameState, hero, introOverlay, speechBubble, instructions, villain, trail) {
  const keys = { left: false, right: false, jump: false, attack: false, dodge: false };
  
  // Add click event listener to start the game
  introOverlay.addEventListener('click', () => {
    if (gameState.gamePhase === "intro") {
      // Start gameplay and lock hero movement while villain is visible.
      gameState.gamePhase = "gameplay";
      gameState.movementLocked = true;
      document.getElementById('renderDiv').removeChild(introOverlay);
      instructions.innerHTML = 'Use ARROW KEYS or WASD to move and jump';

      // Dispatch custom event for game phase change
      document.dispatchEvent(new CustomEvent('gamePhaseChange', { detail: { phase: 'gameplay' } }));

      // Show villain speech bubble for 3 seconds.
      speechBubble.style.opacity = '1';
      speechBubble.style.left = '60%';
      speechBubble.style.top = '30%';
      setTimeout(() => { speechBubble.style.opacity = '0'; }, 3000);

      // After 2 seconds, create a vanishing effect for the villain and unlock hero movement.
      setTimeout(() => {
        // Villain vanishing effect
        villain.fadeOut(() => {
          gameState.movementLocked = false;
          
          // Add pulse effect to hero when movement unlocks
          hero.createPulseEffect(trail);
        });
      }, 2000);
    }
  });
  
  document.addEventListener('keydown', (event) => {
    if (gameState.gamePhase === "intro" && event.key === 'Enter') {
      // Also keep Enter key functionality
      const clickEvent = new MouseEvent('click');
      introOverlay.dispatchEvent(clickEvent);
    } else if (gameState.gamePhase === "gameplay") {
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
    if (gameState.gamePhase === "gameplay") {
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