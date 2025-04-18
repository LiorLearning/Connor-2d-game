import * as THREE from 'three';
import { initScene, camera, renderer } from './modules/core/scene.js';
import { initHero } from './modules/entities/hero.js';
import { initVillain } from './modules/entities/villain.js';
import { createRooftops } from './modules/environment/rooftops.js';
import { createSkyline } from './modules/environment/skyline.js';
import { initUI } from './modules/ui/interface.js';
import { setupControls } from './modules/core/controls.js';
import { initTrail } from './modules/effects/trail.js';
import { createJumpBoostIndicator } from './modules/environment/jumpBoost.js';
import { createBoltCollectible } from './modules/collectibles/bolt.js';
import { showMathQuiz } from './modules/ui/mathQuiz.js';
import { createMinion, createMinionSpawnEffect } from './modules/entities/minion.js';
import { animationLoop } from './modules/core/animationLoop.js';
import { createNotification } from './modules/ui/interface.js';
// import { setupAudio } from './modules/core/audio.js';

function initGame() {
  // Initialize scene, camera, renderer, and lights
  const scene = initScene();
  
  // Initialize audio
  // const backgroundMusic = setupAudio();
  
  // Create environment elements
  const rooftops = createRooftops(scene);
  const skyline = createSkyline(scene);
  const jumpBoostIndicator = createJumpBoostIndicator(scene);
  
  // Initialize game entities
  const hero = initHero(scene);
  // Add gameState to hero
  hero.gameState = {
    currentStage: 3
  };
  const villain = initVillain(scene);
  
  // Initialize UI elements
  const { 
    updateHealthBar, 
    introOverlay, 
    speechBubble, 
    instructions, 
    levelIndicator 
  } = initUI();
  
  // Setup game phases and state as a shared object (passed by reference)
  const gameState = {
    gamePhase: "intro",
    movementLocked: false,
    minionsFought: 0,
    totalMinions: 20,
    minionsSpawned: false,
    currentLevel: 3
  };
  
  // Make gameState globally available for minions to access
  window.gameState = gameState;
  
  // Create collectibles
  const boltCollectible = createBoltCollectible(scene, hero, gameState, showMathQuiz);
  
  // Initialize effects
  const trail = initTrail(scene);
  
  // Create minions array
  const minions = [];
  
  // Setup keyboard controls
  const keys = setupControls(gameState, hero, introOverlay, speechBubble, instructions, villain, trail);
  
  // Start animation loop
  animationLoop(
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
  );
  
  // Initialize Level 3 minions when game phase changes to gameplay
  const initLevel3 = () => {
    if (gameState.gamePhase === "gameplay") {
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
      
      // Spawn gun minions for Level 3 Stage 1
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            const xPos = 35 + (i - 1) * 5; // Spread them out
            const zPos = (Math.random() - 0.5) * 3;
            // Create Level 3 minions with gun-man texture
            const newMinion = createMinion(scene, xPos, 1.5, zPos, 3, 'gun-man');
            minions.push(newMinion);
            
            // Add spawn effect
            createMinionSpawnEffect(scene, xPos, 1.5, zPos, 3);
          }, i * 600); // Stagger spawns
        }
        
        // Update instructions for level 3
        instructions.innerHTML = hero.hasSmokeAttack ? 
          'LEVEL 3 GUN MINIONS! Use E or F to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!' :
          'LEVEL 3 GUN MINIONS! Find smoke bombs to attack! Dodge [SHIFT] or Jump [SPACE] to evade bullets!';
      }, 1000);
      
      // Remove the event listener after initialization
      document.removeEventListener('gamePhaseChange', initLevel3);
    }
  };
  
  // Add event listener for game phase change
  document.addEventListener('gamePhaseChange', initLevel3);
  
  // Handle window resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, 250);
  });
}

// Start the game when the window loads
window.addEventListener('load', initGame);