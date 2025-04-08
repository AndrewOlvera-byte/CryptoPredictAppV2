document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const loginBtn = document.getElementById('loginBtn');
  const inputs = document.querySelectorAll('input');
  
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

  // Particle background animation
  addParticleBackground();

  // Handle form submission
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault(); // Prevents default form submission
    
    // Add loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span>Signing in...</span>';
    errorMessage.classList.remove('show');

    // Collect form data
    const formData = new FormData(loginForm);

    fetch('/login', {
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
      loginBtn.innerHTML = '<span>Success!</span>';
      loginBtn.classList.add('success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    })
    .catch(errData => {
      // Reset button state
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>Sign In</span>';
      
      // Show the error message
      errorMessage.querySelector('span').textContent = errData.error || 'An unknown error occurred.';
      errorMessage.classList.add('show');
      
      // Shake animation for the form to indicate error
      loginForm.classList.add('shake');
      setTimeout(() => {
        loginForm.classList.remove('shake');
      }, 500);
    });
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
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      .shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
      }
      
      .input-wrapper.focused {
        box-shadow: 0 0 0 2px rgba(233, 44, 108, 0.3);
        background-color: #2c2c30;
      }
      
      .label-row label {
        transition: all 0.3s ease;
      }
      
      .label-row label.active {
        color: #e92c6c;
        font-weight: 500;
      }
      
      label.active {
        color: #e92c6c;
        font-weight: 500;
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
