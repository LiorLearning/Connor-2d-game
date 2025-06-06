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
      'LEVEL 2<br><span style="font-size: 20px">Beware! Gun minions ahead!<br>Jump or Dodge to evade bullets!</span>',
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
    // setTimeout(() => {
    //   for (let i = 0; i < 1; i++) {
    //     setTimeout(() => {
    //       const xPos = 35 + (i - 1) * 5; // Spread them out
    //       const zPos = (Math.random() - 0.5) * 3;
    //       // Create gun-men minions for all levels
    //       const newMinion = createMinion(scene, xPos, 1.5, zPos, 2, 'gun-man');
    //       minions.push(newMinion);
          
    //       // Add spawn effect
    //       createMinionSpawnEffect(scene, xPos, 1.5, zPos, 2);
    //     }, i * 600); // Stagger spawns
    //   }
      
    //   // Update instructions for level 2
    //   instructions.innerHTML = hero.hasSmokeAttack ? 
    //     'LEVEL 2 GUN MINIONS! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!' :
    //     'LEVEL 2 GUN MINIONS! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!';
    // }, 1000); // Delay before level 2 starts
  }
  else if (currentLevel === 2) {
    // Advance to Level 3
    currentLevel = 3;
    levelIndicator.textContent = 'LEVEL 3';
    levelIndicator.style.color = '#ff3333'; // Red for Level 3
    
    // Show level 3 notification
    createNotification(
      'LEVEL 3<br><span style="font-size: 20px">Stage 1: Defeat the gun minions!</span>',
      {
        color: '#ff3333',
        fontSize: '36px',
        duration: 3000,
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
    
    // Set game state to first stage of level 3
    hero.gameState = { ...hero.gameState, currentStage: 1 };
    
    // Spawn new gun minions for Level 3 Stage 1 after a delay
    // setTimeout(() => {
    //   for (let i = 0; i < 1; i++) {
    //     setTimeout(() => {
    //       const xPos = 35 + (i - 1) * 5; // Spread them out
    //       const zPos = (Math.random() - 0.5) * 3;
    //       // Create Level 3 minions with gun-man texture
    //       const newMinion = createMinion(scene, xPos, 1.5, zPos, 3, 'gun-man');
    //       minions.push(newMinion);
          
    //       // Add spawn effect
    //       createMinionSpawnEffect(scene, xPos, 1.5, zPos, 3);
    //     }, i * 600); // Stagger spawns
    //   }
      
    //   // Update instructions for level 3
    //   instructions.innerHTML = hero.hasSmokeAttack ? 
    //     'LEVEL 3 GUN MINIONS! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!' :
    //     'LEVEL 3 GUN MINIONS! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!';
    // }, 1000); // Delay before level 3 starts
  }
  else if (currentLevel === 3 && hero.gameState && hero.gameState.currentStage === 1) {
    // Advance to Level 3 Stage 2
    hero.gameState.currentStage = 2;
    
    // Show level 3 stage 2 notification
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
    minionsFought = 0; // Reset counter
    
    // Spawn gun minions for Level 3 Stage 2 after a delay
    setTimeout(() => {
      for (let i = 0; i < 1; i++) {
        setTimeout(() => {
          const xPos = 50 + (i - 1) * 5; // Position them further ahead
          const zPos = (Math.random() - 0.5) * 3;
          // Create gun-men for Level 3 stage 2
          const newMinion = createMinion(scene, xPos, 1.5, zPos, 3, 'gun-man'); 
          minions.push(newMinion);
          
          // Add spawn effect
          createMinionSpawnEffect(scene, xPos, 1.5, zPos, 3);
        }, i * 600); // Stagger spawns
      }
      
      // Update instructions for level 3 stage 2
      instructions.innerHTML = hero.hasSmokeAttack ? 
        'LEVEL 3 STAGE 2! Gun minions ahead! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade!' :
        'LEVEL 3 STAGE 2! Gun minions ahead! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade!';
    }, 1000);
  }
  
  return currentLevel;
}
