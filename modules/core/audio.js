export function setupAudio() {
  // Create audio element for background music
  const backgroundMusic = new Audio();
  backgroundMusic.src = 'https://mathkraft-games.s3.us-east-1.amazonaws.com/Loren/battle-march-action-loop-6935.mp3';
  backgroundMusic.loop = true;
  backgroundMusic.volume = 0.2; // Set to 50% volume
  backgroundMusic.id = 'background-music'; // Add ID for easier access
  
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

// Function to change background music with fade effect
export function changeBackgroundMusic(newMusicSrc, fadeOutDuration = 1000, fadeInDuration = 1000) {
  console.log('changeBackgroundMusic called with source:', newMusicSrc);
  
  const currentMusic = document.getElementById('background-music') || document.querySelector('audio');
  
  if (!currentMusic) {
    console.log('No existing music found, creating new audio element');
    // If no existing music is found, create a new one
    const newMusic = new Audio(newMusicSrc);
    newMusic.id = 'background-music';
    newMusic.loop = true;
    newMusic.volume = 0.2;
    document.body.appendChild(newMusic); // Add to DOM to ensure it's tracked
    newMusic.play().catch(error => console.warn('Audio playback failed:', error));
    return;
  }
  
  console.log('Existing music found, beginning transition');
  
  // Store original volume
  const originalVolume = currentMusic.volume || 0.2;
  console.log('Original volume:', originalVolume);
  
  // Fade out current music
  let fadeOutStep = originalVolume / (fadeOutDuration / 50);
  fadeOutStep = Math.max(fadeOutStep, 0.01); // Ensure step is not too small
  
  console.log('Fade out step:', fadeOutStep);
  
  const fadeOut = setInterval(() => {
    if (currentMusic.volume > fadeOutStep) {
      currentMusic.volume -= fadeOutStep;
      console.log('Fading out, new volume:', currentMusic.volume);
    } else {
      clearInterval(fadeOut);
      currentMusic.pause();
      console.log('Fade out complete, music paused');
      
      // Change source and start new music
      currentMusic.src = newMusicSrc;
      currentMusic.currentTime = 0;
      currentMusic.volume = 0;
      
      currentMusic.play().then(() => {
        console.log('New music started playing');
        // Fade in new music
        let volume = 0;
        let fadeInStep = originalVolume / (fadeInDuration / 50);
        fadeInStep = Math.max(fadeInStep, 0.01); // Ensure step is not too small
        
        console.log('Fade in step:', fadeInStep);
        
        const fadeIn = setInterval(() => {
          if (volume < originalVolume) {
            volume = Math.min(volume + fadeInStep, originalVolume);
            currentMusic.volume = volume;
            console.log('Fading in, new volume:', volume);
          } else {
            clearInterval(fadeIn);
            console.log('Fade in complete, final volume:', currentMusic.volume);
          }
        }, 50);
      }).catch(error => {
        console.warn('Audio playback failed:', error);
        // Try creating a new audio element as fallback
        try {
          const newMusic = new Audio(newMusicSrc);
          newMusic.id = 'background-music-fallback';
          newMusic.loop = true;
          newMusic.volume = originalVolume;
          document.body.appendChild(newMusic);
          newMusic.play().catch(e => console.error('Fallback audio failed too:', e));
        } catch (e) {
          console.error('Complete audio failure:', e);
        }
      });
    }
  }, 50);
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