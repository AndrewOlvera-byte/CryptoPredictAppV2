document.addEventListener("DOMContentLoaded", function() {
  // Main DOM elements
  const form = document.getElementById("data-form");
  const dynamicContent = document.getElementById("dynamic-content");
  const errorMessageDiv = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading");
  const welcomeText = document.querySelector(".welcome-text");
  const inputContainer = document.getElementById("input-container");
  
  
  // History dropdown functionality
  const historyBtn = document.querySelector(".history-btn");
  const historyDropdown = document.querySelector(".history-dropdown");
  
  // Toggle history dropdown when history button is clicked
  historyBtn.addEventListener("click", function(event) {
    event.stopPropagation(); // Prevent event from bubbling up
    historyDropdown.classList.toggle("active");
  });
  
  // Close dropdown when clicking elsewhere on the page
  document.addEventListener("click", function(event) {
    if (!historyBtn.contains(event.target) && !historyDropdown.contains(event.target)) {
      historyDropdown.classList.remove("active");
    }
  });

  // Profile button functionality
  const profileBtn = document.querySelector(".profile-btn");
  profileBtn.addEventListener("click", function() {
    window.location.href = "/profile";
  });

  

  // Default state variables
  let currentChartType = 'line';
  let currentTimeFrame = '1week';
  let welcomeHidden = false;
  let hasActiveResult = false; // Track if we are showing a prediction result

  /**
   * Reset the page to its initial state
   */
  function resetPageState() {
    // Clear any existing content
    dynamicContent.innerHTML = '';
    
    // Show welcome text
    welcomeText.classList.remove("hidden");
    
    // Reset input position
    inputContainer.classList.remove("moved-up");
    
    // Remove back button if it exists
    const existingBackBtn = document.querySelector(".back-btn");
    if (existingBackBtn) {
      existingBackBtn.remove();
    }
    
    // Reset state variables
    welcomeHidden = false;
    hasActiveResult = false;
  }

  /**
   * Create and add back button
   */
  function addBackButton() {
    // Remove existing back button if it exists
    const existingBackBtn = document.querySelector(".back-btn");
    if (existingBackBtn) {
      existingBackBtn.remove();
    }
    
    // Create back button
    const backBtn = document.createElement("button");
    backBtn.className = "back-btn";
    backBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>';
    backBtn.style.transform = "translate(550px, -50%)";

    // Add event listener
    backBtn.addEventListener("click", resetPageState);
    
    // Add to content area
    document.querySelector(".content-area").appendChild(backBtn);
    
    // Position the button relative to the input field
    const inputRect = inputContainer.getBoundingClientRect();
    const contentRect = document.querySelector(".content-area").getBoundingClientRect();
    
    backBtn.style.top = (inputRect.top - contentRect.top + (inputRect.height / 2)) + "px";
  }

  /**
   * Handle form submission for prediction
   * This sends the form data to the server and updates the UI with the response
   */
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMessageDiv.classList.remove("show");
    loadingSpinner.style.display = "block";

    // Hide welcome text and move input up if not already done
    if (!welcomeHidden) {
      welcomeText.classList.add("hidden");
      inputContainer.classList.add("moved-up");
      welcomeHidden = true;
    }

    // Send form data to server via POST request
    const formData = new FormData(form);
    fetch('/dashboard', {
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
        loadingSpinner.style.display = "none";
        const responseData = Array.isArray(data.response) ? data.response : [];
        updateCards(responseData);
        
        // Add back button after results are displayed
        hasActiveResult = true;
        setTimeout(addBackButton, 100); // Small delay to ensure DOM is updated
      })
      .catch(errData => {
        loadingSpinner.style.display = "none";
        errorMessageDiv.textContent = errData.error || 'An unknown error occurred.';
        errorMessageDiv.classList.add("show");
      });
  });

  /**
   * Updates the dashboard cards with the response data from the server
   * Creates graph container and chatGPT analysis sections
   * @param {Array} responseData - The data returned from the server
   */
  function updateCards(responseData) {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'dynamic-content';

    // Graph Card 
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';

    // Create graph header
    const graphHeader = document.createElement('div');
    graphHeader.className = 'graph-header';
    graphHeader.innerHTML = `<h3>Market Analysis</h3>`;
    graphContainer.appendChild(graphHeader);

    // Create div for the chart
    const graphDiv = document.createElement('div');
    graphDiv.id = 'graph';
    graphDiv.style.width = '100%';
    graphDiv.style.height = '300px';
    graphContainer.appendChild(graphDiv);

    contentContainer.appendChild(graphContainer);
    dynamicContent.innerHTML = '';
    dynamicContent.appendChild(contentContainer);

    var layout = {
      title: 'Sample Chart',
      paper_bgcolor: 'white', // sets the overall background color of the chart
      plot_bgcolor: 'pink',  // sets the background color of the plotting area
      width: 600,  // explicitly set width
      height: 400, // explicitly set height
      margin: {
        l: 80,
        r: 20,
        b: 20,
        t: 80
      }
    };

    if (window.plotlyLoaded && typeof Plotly !== 'undefined') {
      Plotly.newPlot('graph', [{
          x: [1, 2, 3, 4, 5],
          y: [10, 15, 13, 17, 10],
          type: 'scatter'
        }], layout).then(function() {
          
        });

      
      
    } else {
          console.error("Plotly failed to load.");
      }
    
    // Create graph controls container
    const graphControls = document.createElement('div');
    graphControls.className = 'graph-controls';
    
    // Chart type toggle buttons
    const chartTypeToggle = document.createElement('div');
    chartTypeToggle.className = 'chart-type-toggle';
    
    const lineBtn = document.createElement('button');
    lineBtn.className = 'toggle-btn active';
    lineBtn.textContent = 'Line';
    lineBtn.dataset.type = 'line';
    
    const candleBtn = document.createElement('button');
    candleBtn.className = 'toggle-btn';
    candleBtn.textContent = 'Candlestick';
    candleBtn.dataset.type = 'candlestick';
    
    chartTypeToggle.appendChild(lineBtn);
    chartTypeToggle.appendChild(candleBtn);
    
    // Time frame toggle buttons
    const timeRangeToggle = document.createElement('div');
    timeRangeToggle.className = 'time-range-toggle';
    
    const timeFrames = [
      { id: '1day', label: '1 Day' },
      { id: '1week', label: '1 Week' },
      { id: '1month', label: '1 Month' },
      { id: '6months', label: '6 Months' },
      { id: '1year', label: '1 Year' }
    ];
    
    timeFrames.forEach(frame => {
      const btn = document.createElement('button');
      btn.className = 'toggle-btn' + (frame.id === currentTimeFrame ? ' active' : '');
      btn.textContent = frame.label;
      btn.dataset.timeframe = frame.id;
      timeRangeToggle.appendChild(btn);
    });
    
    graphControls.appendChild(chartTypeToggle);
    graphControls.appendChild(timeRangeToggle);
    graphContainer.appendChild(graphControls);
    
    contentContainer.appendChild(graphContainer);
    
    // ChatGPT Analysis Card
    const chatGptAnalysis = document.createElement('div');
    chatGptAnalysis.className = 'chatgpt-analysis';
    
    // Analysis header
    const analysisHeader = document.createElement('div');
    analysisHeader.className = 'analysis-header';
    analysisHeader.innerHTML = '<h3>AI Assistant</h3>';
    
    // Chat messages container
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    
    // Add initial assistant message from response data
    const initialMessage = document.createElement('div');
    initialMessage.className = 'chat-message assistant-message';
    let analysisText = 'How can I help you understand this data better?';
    if (responseData.length > 0) {
      if (responseData[0].text) {
        analysisText = responseData[0].text;
      } else if (typeof responseData[0] === 'string') {
        analysisText = responseData[0];
      }
    }
    initialMessage.textContent = analysisText;
    chatMessages.appendChild(initialMessage);
    
    // Chat input container
    const chatGptInput = document.createElement('div');
    chatGptInput.className = 'chatgpt-input';
    chatGptInput.innerHTML = `
      <input type="text" placeholder="Ask a question about the data...">
      <button class="chat-submit-btn">
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    `;
    
    // Assemble chatGPT analysis card
    chatGptAnalysis.appendChild(analysisHeader);
    chatGptAnalysis.appendChild(chatMessages);
    chatGptAnalysis.appendChild(chatGptInput);
    
    contentContainer.appendChild(chatGptAnalysis);
    
    // Update the DOM
    dynamicContent.innerHTML = '';
    dynamicContent.appendChild(contentContainer);

    // Add click events for chart type buttons (UI only, no functionality)
    const chartTypeBtns = document.querySelectorAll('.chart-type-toggle .toggle-btn');
    chartTypeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        chartTypeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentChartType = this.dataset.type;
        // Chart update functionality to be implemented
      });
    });
    
    // Add click events for time frame buttons (UI only, no functionality)
    const timeFrameBtns = document.querySelectorAll('.time-range-toggle .toggle-btn');
    timeFrameBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        timeFrameBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTimeFrame = this.dataset.timeframe;
        // Time frame update functionality to be implemented
      });
    });
    
    // Setup chatGPT input for future implementation
    // Note: No simulated responses - ready for actual API integration
    const chatInput = chatGptAnalysis.querySelector('input');
    const chatSubmitBtn = chatGptAnalysis.querySelector('.chat-submit-btn');
    
    // Chat submission handler for future implementation
    function handleChatSubmit() {
      const inputText = chatInput.value.trim();
      if (inputText) {
        // Add user message to chat
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.textContent = inputText;
        chatMessages.appendChild(userMessage);
        
        // Clear input field
        chatInput.value = '';
        
        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // TODO: Implement actual API call to backend for AI response
        // The backend integration will go here
      }
    }
    
    // Add click event for chat submit button
    chatSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleChatSubmit();
    });
    
    // Add enter key handler for chat input
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleChatSubmit();
      }
    });
  }
});
