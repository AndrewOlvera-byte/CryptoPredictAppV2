// Wait until the DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
    const header = document.querySelector('.top-sliver');
    const footer = document.querySelector('.footer');
    
    // Use IntersectionObserver to check if footer is in view
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // If footer is visible, fade out header; otherwise, show header
        if (entry.isIntersecting) {
          header.style.opacity = "0";
        } else {
          header.style.opacity = "1";
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(footer);
  });
  
document.addEventListener('DOMContentLoaded', function() {
  // Add interactive 3D effect to chart mockup
  const chartMockup = document.querySelector('.chart-mockup');
  
  if (chartMockup) {
    document.addEventListener('mousemove', function(e) {
      if (window.innerWidth > 768) { // Only on larger screens
        const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
        const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
        chartMockup.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateY(-10px)`;
      }
    });
    
    // Reset transform when mouse leaves
    document.addEventListener('mouseleave', function() {
      chartMockup.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
  }
  
  // Add smooth scrolling for anchor links
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      
      // Create mobile menu if it doesn't exist
      let mobileMenu = document.querySelector('.mobile-menu');
      if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        
        const nav = document.querySelector('.main-nav').cloneNode(true);
        const actionButtons = document.querySelector('.action-buttons').cloneNode(true);
        
        mobileMenu.appendChild(nav);
        mobileMenu.appendChild(actionButtons);
        document.body.appendChild(mobileMenu);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .mobile-menu {
            position: fixed;
            top: 70px;
            left: 0;
            width: 100%;
            background: white;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            z-index: 999;
            padding: 20px;
            transform: translateY(-100%);
            opacity: 0;
            transition: all 0.3s ease;
          }
          
          .mobile-menu.active {
            transform: translateY(0);
            opacity: 1;
          }
          
          .mobile-menu .main-nav ul {
            flex-direction: column;
            gap: 20px;
          }
          
          .mobile-menu .action-buttons {
            margin-top: 20px;
            flex-direction: column;
            align-items: center;
          }
          
          .mobile-menu .action-buttons a {
            width: 100%;
            text-align: center;
            margin-bottom: 10px;
          }
          
          .menu-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
          }
          
          .menu-toggle.active span:nth-child(2) {
            opacity: 0;
          }
          
          .menu-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(6px, -6px);
          }
        `;
        document.head.appendChild(style);
      }
      
      mobileMenu.classList.toggle('active');
    });
  }
  
  // Animate elements when they come into view
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.feature-card, .pricing-card, .about-content, .about-image');
    
    elements.forEach(element => {
      const elementPosition = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      
      if (elementPosition < windowHeight - 50) {
        if (!element.classList.contains('animated')) {
          element.classList.add('animated');
          element.style.opacity = '1';
          element.style.transform = 'translateY(0)';
        }
      }
    });
  };
  
  // Set initial state for animated elements
  const setInitialState = function() {
    const elements = document.querySelectorAll('.feature-card, .pricing-card, .about-content, .about-image');
    
    elements.forEach(element => {
      // Make elements visible by default, then handle animation with CSS
      element.style.opacity = '1';
      // Still prepare for animation with transform
      element.style.transform = 'translateY(30px)';
      element.style.transition = 'all 0.8s ease';
      
      // Add animated class to trigger immediate transition
      setTimeout(() => {
        element.classList.add('animated');
        element.style.transform = 'translateY(0)';
      }, 100);
    });
    
    // Call animate once to check initial viewable elements
    animateOnScroll();
  };
  
  // Call setInitialState when the page loads
  setInitialState();
  
  // Also trigger animations when scrolling
  window.addEventListener('scroll', animateOnScroll);
});
  