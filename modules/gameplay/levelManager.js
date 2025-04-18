import { createNotification } from '../ui/interface.js';
import { createMinionSpawnEffect } from '../entities/minion.js';

export function advanceToNextLevel(currentLevel, levelIndicator, hero, minions, scene, createMinion, instructions) {
  let minionsFought = 0; // Initialize this locally
  
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
  
  return currentLevel; // Return the updated level
}

export function handleJumpPrompt(hero, currentRooftop, minions, boltCollectible) {
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
      
      // Customize text based on whether bolt has been collected
      let promptText = '→ JUMP! →';
      
      // Only show super jump instructions if player hasn't jumped to second rooftop yet
      if (!hero.hasReachedSecondRooftop) {
        promptText += '<br>Press SPACE for a super jump!';
      }
      
      // Only show bolt collection instructions if not collected yet
      if (!boltCollectible.collected) {
        promptText += '<br><span style="color: #00ffaa; font-size: 16px;">Collect the bolt!</span>';
      }
      
      jumpPrompt.innerHTML = promptText;
      document.getElementById('renderDiv').appendChild(jumpPrompt);
    } else if ((hero.position.x <= 10 || minionsNearby) && document.getElementById('jumpPrompt')) {
      const jumpPrompt = document.getElementById('jumpPrompt');
      document.getElementById('renderDiv').removeChild(jumpPrompt);
    }
  }
} 