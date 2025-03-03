document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("data-form");
  const dynamicContent = document.getElementById("dynamic-content");
  const errorMessageDiv = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading");

  let currentChartType = 'line';

  // Arbitrary set of 7 data points
  const defaultData = [
    {day: 1, open: 100, high: 105, low: 95,  close: 102, volume: 1500},
    {day: 2, open: 102, high: 108, low: 101, close: 107, volume: 1600},
    {day: 3, open: 107, high: 110, low: 104, close: 105, volume: 1700},
    {day: 4, open: 105, high: 109, low: 103, close: 108, volume: 1550},
    {day: 5, open: 108, high: 112, low: 107, close: 111, volume: 1650},
    {day: 6, open: 111, high: 115, low: 110, close: 114, volume: 1800},
    {day: 7, open: 114, high: 118, low: 113, close: 117, volume: 1750}
  ];


  // Handle form submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorMessageDiv.classList.remove("show");
    loadingSpinner.style.display = "block";

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
      })
      .catch(errData => {
        loadingSpinner.style.display = "none";
        errorMessageDiv.textContent = errData.error || 'An unknown error occurred.';
        errorMessageDiv.classList.add("show");
      });
  });

  function updateCards(responseData) {
    const contentContainer = document.createElement('div');
    contentContainer.className = 'dynamic-content';

    //  Graph Card 
    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';

    const graphHeader = document.createElement('div');
    graphHeader.className = 'graph-header';
    graphHeader.innerHTML = `<h3>Market Analysis</h3>`;

    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'chart-type-toggle';

    const lineBtn = document.createElement('button');
    lineBtn.className = 'toggle-btn active';
    lineBtn.textContent = 'Line';
    lineBtn.dataset.type = 'line';

    const candleBtn = document.createElement('button');
    candleBtn.className = 'toggle-btn';
    candleBtn.textContent = 'Candlestick';
    candleBtn.dataset.type = 'candlestick';

    toggleContainer.appendChild(lineBtn);
    toggleContainer.appendChild(candleBtn);
    graphHeader.appendChild(toggleContainer);
    graphContainer.appendChild(graphHeader);

    // Create the div for the Plotly graph.
    const graphDiv = document.createElement('div');
    graphDiv.id = 'graph';
    // Set only the width; let the height be determined by CSS/Plotly.
    graphDiv.style.width = '100%';
    graphContainer.appendChild(graphDiv);

    //  Analysis Card 
    const textContainer = document.createElement('div');
    textContainer.className = 'text-container';
    let analysisText = 'No analysis available.';
    if (responseData.length > 0) {
      if (responseData[0].text) {
        analysisText = responseData[0].text;
      } else if (typeof responseData[0] === 'string') {
        analysisText = responseData[0];
      }
    }
    textContainer.innerHTML = `
      <div class="analysis-header">
        <h3>AI Analysis</h3>
      </div>
      <div class="analysis-content">
        <p>${analysisText}</p>
      </div>
    `;

    contentContainer.appendChild(graphContainer);
    contentContainer.appendChild(textContainer);
    dynamicContent.innerHTML = '';
    dynamicContent.appendChild(contentContainer);

    // Delay Plotly rendering slightly to ensure the container is visible.
    setTimeout(() => {
      updateChart(defaultData);
    }, 50);

    [lineBtn, candleBtn].forEach(btn => {
      btn.addEventListener('click', function() {
        lineBtn.classList.remove('active');
        candleBtn.classList.remove('active');
        this.classList.add('active');
        currentChartType = this.dataset.type;
        updateChart(defaultData);
      });
    });
  }

  function updateChart(data) {
    // Wait for DOM to be fully ready
    if (!document.getElementById('graph')) {
      console.error('Graph container not found, retrying...');
      setTimeout(() => updateChart(data), 100);
      return;
    }
    // Check if Plotly is loaded
    if (typeof Plotly === 'undefined') {
      console.error('Plotly not loaded, retrying...');
      setTimeout(() => updateChart(data), 100);
      return;
    }
    const xValues = data.map(d => `Day ${d.day}`);
    const layout = {
      autosize: true,
      margin: { l: 50, r: 20, b: 50, t: 20, pad: 4 },
      showlegend: false,
      xaxis: { showgrid: false, tickfont: { color: '#8e9fad' } },
      yaxis: { showgrid: true, gridcolor: '#edf2f7', tickfont: { color: '#8e9fad' } },
      plot_bgcolor: '#ffffff',
      paper_bgcolor: '#ffffff'
    };

    let trace;
    if (currentChartType === 'line') {
      trace = {
        x: xValues,
        y: data.map(d => d.close),
        mode: 'lines',
        type: 'scatter',
        line: { color: '#007aff', width: 3, shape: 'spline' },
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 122, 255, 0.1)',
        name: 'Price'
      };
    } else if (currentChartType === 'candlestick') {
      trace = {
        x: xValues,
        open: data.map(d => d.open),
        high: data.map(d => d.high),
        low: data.map(d => d.low),
        close: data.map(d => d.close),
        type: 'candlestick',
        increasing: { line: { color: '#34c759' } },
        decreasing: { line: { color: '#ff3b30' } },
        name: 'Price'
      };
    }

    // Render the chart with the responsive config.
    Plotly.newPlot('graph', [trace], layout, { responsive: true });

    // Add a resize listener to ensure the chart fits its container.
    window.addEventListener('resize', () => {
      Plotly.Plots.resize('graph');
    });
  }
});
