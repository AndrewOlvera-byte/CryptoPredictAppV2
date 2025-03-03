document.addEventListener('DOMContentLoaded', () => {
    const registrationForm = document.getElementById('registrationForm');
    const errorMessage = document.getElementById('errorMessage');
    const registerBtn = document.getElementById('registerBtn');
    const inputs = document.querySelectorAll('input');
    const passwordInput = document.getElementById('passwordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
  
    // Add floating label animations for inputs
    inputs.forEach(input => {
      // Create floating label effect
      const wrapper = input.parentElement;
      const label = wrapper.previousElementSibling;
      
      if (input.value.length > 0) {
        wrapper.classList.add('focused');
      }
      
      input.addEventListener('focus', () => {
        wrapper.classList.add('focused');
        label.classList.add('active');
      });
      
      input.addEventListener('blur', () => {
        if (input.value.length === 0) {
          wrapper.classList.remove('focused');
          label.classList.remove('active');
        }
      });
      
      // Add subtle animation when typing
      input.addEventListener('input', () => {
        if (input.value.length > 0 && !wrapper.classList.contains('has-text')) {
          wrapper.classList.add('has-text');
          wrapper.style.transform = 'translateY(-2px)';
          setTimeout(() => {
            wrapper.style.transform = 'translateY(0)';
          }, 200);
        } else if (input.value.length === 0) {
          wrapper.classList.remove('has-text');
        }
      });
    });
  
    // Add password strength meter
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength';
    
    const strengthLabel = document.createElement('span');
    strengthLabel.className = 'strength-label';
    strengthLabel.textContent = 'Password strength: ';
    
    const strengthValue = document.createElement('span');
    strengthValue.className = 'strength-value';
    strengthValue.textContent = 'Type a password';
    
    const strengthBars = document.createElement('div');
    strengthBars.className = 'strength-bars';
    
    for (let i = 0; i < 4; i++) {
      const bar = document.createElement('div');
      bar.className = 'strength-bar';
      strengthBars.appendChild(bar);
    }
    
    strengthMeter.appendChild(strengthLabel);
    strengthMeter.appendChild(strengthValue);
    strengthMeter.appendChild(strengthBars);
    
    passwordInput.parentElement.after(strengthMeter);
  
    // Add password match indicator
    const matchIndicator = document.createElement('div');
    matchIndicator.className = 'password-match-indicator';
    confirmPasswordInput.parentElement.after(matchIndicator);
  
    // Password strength checker
    passwordInput.addEventListener('input', () => {
      const password = passwordInput.value;
      let strength = 0;
      let status = '';
      
      if (password.length >= 8) strength++;
      if (password.match(/[a-z]+/)) strength++;
      if (password.match(/[A-Z]+/)) strength++;
      if (password.match(/[0-9]+/)) strength++;
      if (password.match(/[$@#&!]+/)) strength++;
      
      const bars = strengthBars.querySelectorAll('.strength-bar');
      
      bars.forEach((bar, i) => {
        bar.className = 'strength-bar';
        if (i < strength) {
          if (strength <= 2) {
            bar.classList.add('weak');
          } else if (strength <= 4) {
            bar.classList.add('medium');
          } else {
            bar.classList.add('strong');
          }
        }
      });
      
      if (password.length === 0) {
        status = 'Type a password';
        strengthValue.className = 'strength-value';
      } else if (strength <= 2) {
        status = 'Weak';
        strengthValue.className = 'strength-value weak';
      } else if (strength <= 4) {
        status = 'Medium';
        strengthValue.className = 'strength-value medium';
      } else {
        status = 'Strong';
        strengthValue.className = 'strength-value strong';
      }
      
      strengthValue.textContent = status;
      
      // Update password match indicator if confirm password has value
      if (confirmPasswordInput.value.length > 0) {
        updatePasswordMatch();
      }
    });
    
    // Password match checker
    function updatePasswordMatch() {
      if (confirmPasswordInput.value.length > 0) {
        if (confirmPasswordInput.value === passwordInput.value) {
          matchIndicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg><span>Passwords match</span>';
          matchIndicator.className = 'password-match-indicator match';
        } else {
          matchIndicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg><span>Passwords do not match</span>';
          matchIndicator.className = 'password-match-indicator not-match';
        }
      } else {
        matchIndicator.innerHTML = '';
      }
    }
  
    confirmPasswordInput.addEventListener('input', updatePasswordMatch);
  
    // Particle background animation
    addParticleBackground();
  
    // Handle form submission
    registrationForm.addEventListener('submit', (event) => {
      event.preventDefault();
      
      // Validate form
      let isValid = true;
      let firstInvalidInput = null;
      
      // Validate all inputs
      inputs.forEach(input => {
        if (input.required && input.value.trim() === '') {
          isValid = false;
          input.parentElement.classList.add('error');
          if (!firstInvalidInput) firstInvalidInput = input;
        } else {
          input.parentElement.classList.remove('error');
        }
      });
      
      // Validate password match
      if (passwordInput.value !== confirmPasswordInput.value) {
        isValid = false;
        confirmPasswordInput.parentElement.classList.add('error');
        if (!firstInvalidInput) firstInvalidInput = confirmPasswordInput;
      }
      
      // Focus first invalid input
      if (firstInvalidInput) {
        firstInvalidInput.focus();
        return;
      }
      
      // If validation passes, submit form
      if (isValid) {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span>Creating account...</span>';
        errorMessage.classList.remove('show');
        
        // Form data for submission
        const formData = new FormData(registrationForm);
        
        // Form submission - this needs to match your backend
        fetch('/register', {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => { throw err; });
          }
          return response.json();
        })
        .then(data => {
          // Success handling
          registerBtn.innerHTML = '<span>Success!</span>';
          registerBtn.classList.add('success');
          
          // Redirect to login or dashboard
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        })
        .catch(errData => {
          // Reset button state
          registerBtn.disabled = false;
          registerBtn.innerHTML = '<span>Create Account</span>';
          
          // Show the error message
          errorMessage.querySelector('span').textContent = errData.error || 'An unknown error occurred.';
          errorMessage.classList.add('show');
          
          // Shake animation for the form to indicate error
          registrationForm.classList.add('shake');
          setTimeout(() => {
            registrationForm.classList.remove('shake');
          }, 500);
        });
      }
    });
  
    // Function to add particle background
    function addParticleBackground() {
      const designArea = document.querySelector('.design-area');
      if (!designArea) return;
      
      const canvas = document.createElement('canvas');
      canvas.className = 'particles-canvas';
      designArea.appendChild(canvas);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .particles-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        
        .design-area {
          position: relative;
        }
        
        .design-area .branding {
          position: relative;
          z-index: 2;
        }
        
        .design-area .shapes {
          position: relative;
          z-index: 1;
        }
        
        .password-match-indicator {
          font-size: 14px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .password-match-indicator svg {
          width: 16px;
          height: 16px;
        }
        
        .password-match-indicator.match {
          color: #34c759;
        }
        
        .password-match-indicator.match svg {
          fill: #34c759;
        }
        
        .password-match-indicator.not-match {
          color: #ff3b30;
        }
        
        .password-match-indicator.not-match svg {
          fill: #ff3b30;
        }
        
        .password-strength {
          margin-top: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        
        .strength-value {
          font-weight: 500;
        }
        
        .strength-value.weak {
          color: #ff3b30;
        }
        
        .strength-value.medium {
          color: #ff9500;
        }
        
        .strength-value.strong {
          color: #34c759;
        }
        
        .strength-bars {
          display: flex;
          gap: 4px;
          margin-top: 6px;
        }
        
        .strength-bar {
          height: 4px;
          width: 50px;
          background-color: #e0e0e0;
          border-radius: 2px;
        }
        
        .strength-bar.weak {
          background-color: #ff3b30;
        }
        
        .strength-bar.medium {
          background-color: #ff9500;
        }
        
        .strength-bar.strong {
          background-color: #34c759;
        }
        
        .input-wrapper.error {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          box-shadow: 0 0 0 2px rgba(255, 59, 48, 0.3);
        }
      `;
      document.head.appendChild(style);
      
      // Initialize particles
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const particles = [];
        const particleCount = 30;
        
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 1,
            color: 'rgba(255, 255, 255, ' + (Math.random() * 0.3 + 0.1) + ')',
            speedX: Math.random() * 0.5 - 0.25,
            speedY: Math.random() * 0.5 - 0.25
          });
        }
        
        function drawParticles() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          particles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            if (particle.x < 0 || particle.x > canvas.width) {
              particle.speedX = -particle.speedX;
            }
            
            if (particle.y < 0 || particle.y > canvas.height) {
              particle.speedY = -particle.speedY;
            }
          });
          
          requestAnimationFrame(drawParticles);
        }
        
        drawParticles();
      }
    }
  });
  