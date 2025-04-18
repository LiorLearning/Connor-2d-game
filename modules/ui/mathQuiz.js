import { createSmokeBombCounter, updateSmokeBombCounter } from '../collectibles/smokeBomb.js';
import { createNotification } from './interface.js';

export function showMathQuiz(hero, gameState) {
  // Create an array of math questions and answers
  // Generate random single-digit multiplication questions
  const mathQuestions = [];
  
  for (let i = 0; i < 3; i++) {
    // Generate two random single digits (1-9)
    const num1 = Math.floor(Math.random() * 7) + 3;
    const num2 = Math.floor(Math.random() * 7) + 3;
    
    // Calculate correct answer
    const correctAnswer = (num1 * num2).toString();
    
    // Generate wrong options that are close to the correct answer
    let options = [correctAnswer];
    while (options.length < 4) {
      // Create plausible wrong answers by adding/subtracting small numbers
      const wrongAnswer = (num1 * num2 + Math.floor(Math.random() * 10) - 5).toString();
      if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
        options.push(wrongAnswer);
      }
    }
    
    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);
    
    mathQuestions.push({
      question: `What is ${num1} × ${num2}?`,
      options: options,
      correctAnswer: correctAnswer
    });
  }
  
  let currentQuestionIndex = 0;
  let correctAnswers = 0;
  
  // Create the dialog container
  const quizContainer = document.createElement('div');
  quizContainer.id = 'mathQuizContainer';
  Object.assign(quizContainer.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: '500px',
    backgroundColor: 'rgba(0, 10, 20, 0.95)',
    borderRadius: '10px',
    border: '2px solid #00ffff',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
    padding: '20px',
    zIndex: '1000',
    fontFamily: "'Orbitron', sans-serif",
    color: '#ffffff',
    textAlign: 'center'
  });
  
  // Add title
  const title = document.createElement('h2');
  title.textContent = 'Ninja Math Challenge';
  Object.assign(title.style, {
    color: '#00ffff',
    marginTop: '0',
    fontSize: '24px',
    textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
  });
  quizContainer.appendChild(title);
  
  // Add subtitle
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Answer correctly to earn smoke bombs!';
  Object.assign(subtitle.style, {
    color: '#aaffff',
    fontSize: '16px',
    marginBottom: '20px'
  });
  quizContainer.appendChild(subtitle);
  
  // Create question container
  const questionContainer = document.createElement('div');
  questionContainer.id = 'questionContainer';
  quizContainer.appendChild(questionContainer);
  
  // Function to show the current question
  function showQuestion(index) {
    // Clear previous content
    questionContainer.innerHTML = '';
    
    // Create progress indicator
    const progress = document.createElement('div');
    progress.textContent = `Question ${index + 1} of ${mathQuestions.length}`;
    Object.assign(progress.style, {
      color: '#aaffff',
      fontSize: '14px',
      marginBottom: '15px'
    });
    questionContainer.appendChild(progress);
    
    // Create question text
    const questionText = document.createElement('div');
    questionText.textContent = mathQuestions[index].question;
    Object.assign(questionText.style, {
      fontSize: '22px',
      marginBottom: '20px',
      fontWeight: 'bold'
    });
    questionContainer.appendChild(questionText);
    
    // Create options container
    const optionsContainer = document.createElement('div');
    Object.assign(optionsContainer.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '10px',
      marginBottom: '20px'
    });
    
    // Add options
    mathQuestions[index].options.forEach(option => {
      const optionButton = document.createElement('button');
      optionButton.textContent = option;
      Object.assign(optionButton.style, {
        backgroundColor: 'rgba(0, 50, 80, 0.8)',
        border: '2px solid #0088aa',
        borderRadius: '5px',
        padding: '10px',
        color: 'white',
        fontSize: '18px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      });
      
      // Hover effect
      optionButton.addEventListener('mouseover', () => {
        optionButton.style.backgroundColor = 'rgba(0, 70, 100, 0.8)';
        optionButton.style.borderColor = '#00ffff';
      });
      
      optionButton.addEventListener('mouseout', () => {
        optionButton.style.backgroundColor = 'rgba(0, 50, 80, 0.8)';
        optionButton.style.borderColor = '#0088aa';
      });
      
      // Click handler
      optionButton.addEventListener('click', () => {
        // Check if the answer is correct
        const isCorrect = option === mathQuestions[index].correctAnswer;
        
        // Disable all buttons
        const allButtons = optionsContainer.querySelectorAll('button');
        allButtons.forEach(btn => {
          btn.disabled = true;
          btn.style.cursor = 'default';
          btn.style.opacity = '0.7';
        });
        
        // Highlight the selected button
        if (isCorrect) {
          optionButton.style.backgroundColor = 'rgba(0, 150, 50, 0.8)';
          optionButton.style.borderColor = '#00ff00';
          correctAnswers++;
        } else {
          optionButton.style.backgroundColor = 'rgba(150, 0, 0, 0.8)';
          optionButton.style.borderColor = '#ff0000';
          
          // Highlight the correct answer
          allButtons.forEach(btn => {
            if (btn.textContent === mathQuestions[index].correctAnswer) {
              btn.style.backgroundColor = 'rgba(0, 150, 50, 0.8)';
              btn.style.borderColor = '#00ff00';
            }
          });
        }
        
        // Show feedback
        const feedback = document.createElement('div');
        feedback.textContent = isCorrect ? 'Correct! +2 Smoke Bombs' : 'Incorrect!';
        Object.assign(feedback.style, {
          color: isCorrect ? '#00ff00' : '#ff3333',
          fontSize: '18px',
          fontWeight: 'bold',
          marginTop: '10px',
          marginBottom: '10px'
        });
        questionContainer.appendChild(feedback);
        
        // Add next button or finish button
        const nextButton = document.createElement('button');
        nextButton.textContent = currentQuestionIndex < mathQuestions.length - 1 ? 'Next Question' : 'Finish';
        Object.assign(nextButton.style, {
          backgroundColor: 'rgba(0, 100, 150, 0.8)',
          border: '2px solid #00ffff',
          borderRadius: '5px',
          padding: '10px 20px',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          margin: '10px auto',
          display: 'block',
          transition: 'all 0.2s'
        });
        
        nextButton.addEventListener('mouseover', () => {
          nextButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)';
        });
        
        nextButton.addEventListener('mouseout', () => {
          nextButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)';
        });
        
        nextButton.addEventListener('click', () => {
          if (currentQuestionIndex < mathQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
          } else {
            // Quiz is finished, show results
            finishQuiz();
          }
        });
        
        questionContainer.appendChild(nextButton);
      });
      
      optionsContainer.appendChild(optionButton);
    });
    
    questionContainer.appendChild(optionsContainer);
  }
  
  // Function to finish the quiz and show results
  function finishQuiz() {
    // Clear question container
    questionContainer.innerHTML = '';
    
    // Calculate earned smoke bombs (2 per correct answer)
    const earnedSmokeBombs = correctAnswers * 2;
    
    // Create results container
    const resultsContainer = document.createElement('div');
    Object.assign(resultsContainer.style, {
      textAlign: 'center',
      padding: '20px'
    });
    
    // Add results title
    const resultsTitle = document.createElement('h3');
    resultsTitle.textContent = 'Quiz Complete!';
    Object.assign(resultsTitle.style, {
      color: '#00ffff',
      fontSize: '22px',
      marginBottom: '10px'
    });
    resultsContainer.appendChild(resultsTitle);
    
    // Add score
    const scoreText = document.createElement('p');
    scoreText.textContent = `You answered ${correctAnswers} out of ${mathQuestions.length} questions correctly.`;
    Object.assign(scoreText.style, {
      fontSize: '18px',
      marginBottom: '15px'
    });
    resultsContainer.appendChild(scoreText);
    
    // Add smoke bombs earned
    const bombsEarned = document.createElement('p');
    bombsEarned.innerHTML = `<span style="color: #00ffff; font-size: 24px; font-weight: bold;">${earnedSmokeBombs}</span> smoke bombs earned!`;
    Object.assign(bombsEarned.style, {
      fontSize: '18px',
      marginBottom: '20px'
    });
    resultsContainer.appendChild(bombsEarned);
    
    // Create continue button
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continue Game';
    Object.assign(continueButton.style, {
      backgroundColor: 'rgba(0, 100, 150, 0.8)',
      border: '2px solid #00ffff',
      borderRadius: '5px',
      padding: '12px 24px',
      color: 'white',
      fontSize: '18px',
      cursor: 'pointer',
      margin: '10px auto',
      display: 'block',
      transition: 'all 0.2s'
    });
    
    continueButton.addEventListener('mouseover', () => {
      continueButton.style.backgroundColor = 'rgba(0, 130, 180, 0.8)';
    });
    
    continueButton.addEventListener('mouseout', () => {
      continueButton.style.backgroundColor = 'rgba(0, 100, 150, 0.8)';
    });
    
    continueButton.addEventListener('click', () => {
      // Remove quiz container
      document.getElementById('renderDiv').removeChild(quizContainer);
      
      // Enable hero movement
      if (gameState && typeof gameState === 'object') {
        gameState.movementLocked = false;
      } else if (gameState === true) {
        // Handle case where gameState is a boolean value
        console.log("gameState is a boolean, cannot set movementLocked property");
      }
      
      // Set hero's smoke bomb properties
      if (hero) {
        hero.hasSmokeAttack = true;
        hero.smokeBombsCount = earnedSmokeBombs;
        
        // Show collection notification
        createNotification(
          `${earnedSmokeBombs} SMOKE BOMBS ACQUIRED!<br><span style="font-size: 18px">Use E or F to attack minions</span>`,
          { duration: 2000 }
        );
        
        // Create or update smoke bomb counter UI
        if (document.getElementById('smokeBombCounter')) {
          updateSmokeBombCounter(hero);
        } else {
          createSmokeBombCounter(hero);
        }
      }
    });
    
    resultsContainer.appendChild(continueButton);
    questionContainer.appendChild(resultsContainer);
  }
  
  // Start with the first question
  showQuestion(currentQuestionIndex);
  
  // Add quiz container to the DOM
  document.getElementById('renderDiv').appendChild(quizContainer);
}