export function setupAudio() {
  // Create audio element for background music
  const backgroundMusic = new Audio();
  backgroundMusic.src = 'https://mathkraft-games.s3.us-east-1.amazonaws.com/Loren/battle-march-action-loop-6935.mp3';
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.2; // Set to 50% volume
  
  // Play background music (will start when user interacts with the page)
  document.addEventListener('click', () => {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch(error => {
        console.warn('Audio playback failed:', error);
      });
    }
  }, { once: true });
  
  // Create mute button
  const muteButton = createMuteButton(backgroundMusic);
  
  return backgroundMusic;
}

function createMuteButton(backgroundMusic) {
  const muteButton = document.createElement('div');
  muteButton.id = 'muteButton';
  
  // Set styles for mute button
  Object.assign(muteButton.style, {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: '2px solid #00ffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#00ffff',
    fontFamily: "'Orbitron', sans-serif",
    fontSize: '20px',
    cursor: 'pointer',
    zIndex: '100',
    transition: 'all 0.3s'
  });
  
  // Use speaker icon (Unicode)
  muteButton.innerHTML = '🔊';
  
  // Add hover effect
  muteButton.onmouseover = () => {
    muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    muteButton.style.transform = 'scale(1.1)';
  };
  muteButton.onmouseout = () => {
    muteButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    muteButton.style.transform = 'scale(1)';
  };
  
  // Add click event to toggle mute
  muteButton.addEventListener('click', () => {
    if (backgroundMusic.muted) {
      backgroundMusic.muted = false;
      muteButton.innerHTML = '🔊';
      muteButton.style.color = '#00ffff';
    } else {
      backgroundMusic.muted = true;
      muteButton.innerHTML = '🔇';
      muteButton.style.color = '#ff3333';
    }
  });
  
  // Add to render div
  document.getElementById('renderDiv').appendChild(muteButton);
  
  return muteButton;
}