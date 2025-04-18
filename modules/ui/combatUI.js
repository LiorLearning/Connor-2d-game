import { createBoltProjectile } from '../collectibles/bolt.js';
import { updateBoltCounter } from '../collectibles/bolt.js';
import { spawnBoltOnFirstRooftop } from '../collectibles/bolt.js';
import { updateMinionHealthBar } from '../entities/minionUpdates.js';
import { defeatedMinion } from '../entities/minionUpdates.js';
import { showMathQuiz } from './mathQuiz.js';

export function handleEnemyIndicators(hero, minions) {
  const attackPrompt = document.getElementById('attackPrompt');
  
  // Create attack prompt if it doesn't exist yet
  if (!attackPrompt) {
    createAttackPrompt(hero);
    return; // Return and let the next animation frame handle the rest
  }
  
  const attackPromptText = document.getElementById('attackPromptText');
  
  if (!attackPrompt || !attackPromptText) return;
  
  let anyMinionInRange = false;
  
  minions.forEach(minion => {
    if (minion.active && !minion.defeated) {
      const distance = Math.abs(hero.position.x - minion.group.position.x);
      
      // If minion is within attack range
      if (distance < 5) {
        anyMinionInRange = true;
      }
    }
  });
  
  if (anyMinionInRange) {
    // Display attack prompt when minions are in range
    attackPrompt.style.display = 'block';
    attackPromptText.textContent = 
      hero.hasBoltAttack ? 
      `ENEMY IN RANGE! Press E or F to attack (${hero.boltCount} bolts left)` :
      'ENEMY IN RANGE! Get lightning bolts to attack';
  } else {
    attackPrompt.style.display = 'none';
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
    pointerEvents: 'none',
    display: 'none' // Start hidden
  });
  
  // Create the text element inside the prompt
  const attackPromptText = document.createElement('span');
  attackPromptText.id = 'attackPromptText';
  attackPromptText.textContent = hero.hasBoltAttack ? 
    `ENEMY IN RANGE! Press E or F to attack (${hero.boltCount} bolts left)` :
    'ENEMY IN RANGE! Get lightning bolts to attack';
    
  attackPrompt.appendChild(attackPromptText);
  document.getElementById('renderDiv').appendChild(attackPrompt);
  
  return attackPrompt;
}

export function processHeroAttack(hero, minions, scene, minionsFought, totalMinions, 
  currentLevel, levelIndicator, updateHealthBar, trail, createMinion, instructions, gameState) {
  
  const now = Date.now();
  
  // Check for minions in range
  let nearestMinion = null;
  let nearestDistance = Infinity;
  
  minions.forEach(minion => {
    if (!minion.defeated) {
      const distance = Math.abs(minion.group.position.x - hero.position.x);
      if (distance < 5 && distance < nearestDistance) {
        nearestMinion = minion;
        nearestDistance = distance;
      }
    }
  });
  
  if (nearestMinion) {
    // Determine attack direction
    const attackDirection = nearestMinion.group.position.x > hero.position.x ? 1 : -1;
    
    // If hero has bolt attack and cooldown has elapsed
    if (now - hero.lastAttack > 500 && hero.hasBoltAttack && hero.boltCount > 0) {
      // Update last attack time to prevent rapid firing
      hero.lastAttack = now;
      
      // Add attack animation effect
      hero.sprite.material.color.set(0x00ffff);
      setTimeout(() => {
        hero.sprite.material.color.set(0xffffff);
      }, 100);
      
      // Create bolt projectile
      createBoltProjectile(scene, hero, nearestMinion, attackDirection);
      
      // Apply damage to minion
      nearestMinion.health -= 50;
      
      // Update minion health bar
      updateMinionHealthBar(nearestMinion);
      
      // Decrease bolt count
      hero.boltCount--;
      
      // Update bolt counter UI
      updateBoltCounter(hero);
      
      // Check if minion is defeated
      if (nearestMinion.health <= 0) {
        // Increment minions fought count in gameState
        gameState.minionsFought++;
        
        defeatedMinion(nearestMinion, scene, gameState.minionsFought, totalMinions, 
          currentLevel, levelIndicator, hero, updateHealthBar, trail, minions, instructions, createMinion);
      }
      
      // Hide attack prompt if out of bolts
      if (hero.boltCount <= 0) {
        hero.hasBoltAttack = false;
        document.getElementById('attackPromptText').textContent = 'ENEMY IN RANGE! Get more lightning bolts';
      }
      
      // Check if enough time has passed to respawn a collectible
      if (now - hero.lastBoltRespawn > hero.boltRespawnCooldown) {
        // Respawn a collectible on the first rooftop
        spawnBoltOnFirstRooftop(scene, hero, gameState, showMathQuiz);
        hero.lastBoltRespawn = now;
      }
    }
  }
} 