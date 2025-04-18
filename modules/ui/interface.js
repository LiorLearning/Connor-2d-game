export function initUI() {
  // Add Google Font Link
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@500&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
  
  // Add CSS animation for bomb counter
  const styleSheet = document.createElement('style');
  styleSheet.textContent = 
    `@keyframes pulseBombCount {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }`
  ;
  document.head.appendChild(styleSheet);
  
  // Create intro overlay
  const introOverlay = createIntroOverlay();
  
  // Create speech bubble
  const speechBubble = createSpeechBubble();
  
  // Create instructions
  const instructions = createInstructions();
  
  // Create level indicator
  const levelIndicator = createLevelIndicator();
  
  // Create dodge indicator
  createDodgeIndicator();
  
  // Create health bar
  const updateHealthBar = createHealthBar();
  
  return {
    introOverlay,
    speechBubble,
    instructions,
    levelIndicator,
    updateHealthBar
  };
}

// Create intro overlay
function createIntroOverlay() {
  const introOverlay = document.createElement('div');
  introOverlay.id = "introOverlay";
  Object.assign(introOverlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
    zIndex: '10'
  });
  
  // Create intro box container
  const introBox = document.createElement('div');
  Object.assign(introBox.style, {
    background: 'rgba(0, 20, 40, 0.8)',
    border: '2px solid #00ffff',
    borderRadius: '10px',
    padding: '30px',
    maxWidth: '80%',
    textAlign: 'center',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
  });
  
  introBox.innerHTML = `
    <h1 style="font-size: 48px; margin: 0; text-shadow: 0 0 10px #00ffff;">LIGHTNING BOLT</h1>
    <p style="font-size: 24px; margin: 10px 0; color: #ff3333;">VS <span style="font-style: italic;">SMOKE</span></p>
    <img src="./assets/minions.png" style="max-width: 200px; margin: 15px 0;" alt="Minions" />
    <p style="font-size: 22px; margin: 15px 0; color: #ff9933;">"Let's see if you can beat my team of 20 minions"</p>
    <p style="font-size: 20px; margin-top: 20px;">Press Enter to Start</p>
  `;
  
  introOverlay.appendChild(introBox);
  document.getElementById('renderDiv').appendChild(introOverlay);
  
  return introOverlay;
}

// Create speech bubble
function createSpeechBubble() {
  const speechBubble = document.createElement('div');
  speechBubble.id = "villainSpeechBubble";
  Object.assign(speechBubble.style, {
    position: 'absolute',
    background: '#fff',
    border: '2px solid #ff3333',
    borderRadius: '10px',
    padding: '8px 12px',
    color: '#ff3333',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '16px',
    zIndex: '20',
    opacity: '0'
  });
  speechBubble.innerHTML = "Let's see if you can beat my team of 20 minions!";
  document.getElementById('renderDiv').appendChild(speechBubble);
  
  return speechBubble;
}

// Create instructions
function createInstructions() {
  const instructions = document.createElement('div');
  Object.assign(instructions.style, {
    position: 'absolute',
    bottom: '20px',
    left: '0',
    width: '100%',
    textAlign: 'center',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '16px',
    color: '#0099ff',
    zIndex: '10'
  });
  instructions.innerHTML = '';
  document.getElementById('renderDiv').appendChild(instructions);
  
  return instructions;
}

// Create level indicator
function createLevelIndicator() {
  const levelIndicator = document.createElement('div');
  Object.assign(levelIndicator.style, {
    position: 'absolute',
    top: '20px',
    right: '20px',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '24px',
    color: '#ff3333', // Color for Level 3 (red)
    textShadow: '0 0 10px rgba(255, 51, 51, 0.8)',
    zIndex: '100',
    padding: '5px 10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '5px',
    border: '1px solid #ff3333'
  });
  levelIndicator.textContent = 'LEVEL 3';
  document.getElementById('renderDiv').appendChild(levelIndicator);
  
  return levelIndicator;
}

// Create dodge indicator
function createDodgeIndicator() {
  const dodgeIndicator = document.createElement('div');
  dodgeIndicator.id = 'dodgeIndicator';
  Object.assign(dodgeIndicator.style, {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    width: '150px',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid #00ffff',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: '100'
  });
  
  const dodgeFill = document.createElement('div');
  dodgeFill.id = 'dodgeFill';
  Object.assign(dodgeFill.style, {
    width: '100%',
    height: '100%',
    backgroundColor: '#ffaa00',
    transition: 'width 0.1s linear'
  });
  
  const dodgeLabel = document.createElement('div');
  dodgeLabel.textContent = 'DODGE [SHIFT]';
  Object.assign(dodgeLabel.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '12px',
    textShadow: '0 0 3px #000',
    zIndex: '101'
  });
  
  dodgeIndicator.appendChild(dodgeFill);
  dodgeIndicator.appendChild(dodgeLabel);
  document.getElementById('renderDiv').appendChild(dodgeIndicator);
  
  return dodgeIndicator;
}

// Create health bar
function createHealthBar() {
  // Create container div
  const healthContainer = document.createElement('div');
  healthContainer.id = 'heroHealthContainer';
  Object.assign(healthContainer.style, {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '200px',
    height: '30px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid #00ffff',
    borderRadius: '5px',
    overflow: 'hidden',
    zIndex: '100'
  });
  
  // Create health fill
  const healthFill = document.createElement('div');
  healthFill.id = 'heroHealthFill';
  Object.assign(healthFill.style, {
    width: '100%',
    height: '100%',
    backgroundColor: '#00ffff',
    transition: 'width 0.3s ease-out'
  });
  
  // Create label
  const healthLabel = document.createElement('div');
  healthLabel.id = 'heroHealthLabel';
  Object.assign(healthLabel.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '14px',
    textShadow: '0 0 3px #000',
    zIndex: '101'
  });
  healthLabel.textContent = 'HP: 100/100';
  
  // Assemble health bar
  healthContainer.appendChild(healthFill);
  healthContainer.appendChild(healthLabel);
  document.getElementById('renderDiv').appendChild(healthContainer);
  
  // Return update function
  return function updateHealthBar(health) {
    const percentage = Math.max(0, Math.min(100, health));
    healthFill.style.width = `${percentage}%`;
    healthLabel.textContent = `HP: ${Math.round(percentage)}/100`;
    
    // Change color based on health level
    if (percentage > 60) {
      healthFill.style.backgroundColor = '#00ffff'; // Cyan for high health
    } else if (percentage > 30) {
      healthFill.style.backgroundColor = '#ffff00'; // Yellow for medium health
    } else {
      healthFill.style.backgroundColor = '#ff3333'; // Red for low health
    }
  };
}

// Create notification function
export function createNotification(message, options = {}) {
  const defaults = {
    position: 'center', // center, top, bottom
    color: '#00ffff',
    fontSize: '24px',
    duration: 2000,
    backgroundColor: 'transparent'
  };
  
  const settings = { ...defaults, ...options };
  
  const notification = document.createElement('div');
  Object.assign(notification.style, {
    position: 'absolute',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: settings.fontSize,
    color: settings.color,
    textShadow: `0 0 10px ${settings.color}`,
    zIndex: '100',
    opacity: '0',
    transition: 'opacity 0.3s',
    textAlign: 'center',
    backgroundColor: settings.backgroundColor,
    padding: settings.backgroundColor !== 'transparent' ? '10px 20px' : '0',
    borderRadius: '5px'
  });
  
  // Set vertical position
  if (settings.position === 'top') {
    notification.style.top = '20%';
  } else if (settings.position === 'bottom') {
    notification.style.top = '80%';
  } else {
    notification.style.top = '50%';
  }
  
  notification.innerHTML = message;
  document.getElementById('renderDiv').appendChild(notification);
  
  setTimeout(() => { 
    notification.style.opacity = '1';
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.getElementById('renderDiv').removeChild(notification);
      }, 300);
    }, settings.duration);
  }, 10);
  
  return notification;
}