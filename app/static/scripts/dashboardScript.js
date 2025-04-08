document.addEventListener("DOMContentLoaded", function() {
  // Main DOM elements
  const form = document.getElementById("data-form");
  const dynamicContent = document.getElementById("dynamic-content");
  const errorMessageDiv = document.getElementById("error-message");
  const loadingSpinner = document.getElementById("loading");
  const welcomeText = document.querySelector(".welcome-text");
  const inputContainer = document.getElementById("input-container");
  
  // Check if Plotly is loaded
  console.log("Plotly loaded:", typeof Plotly !== 'undefined');
  
  // Add window error handler to catch script errors
  window.addEventListener('error', function(event) {
    console.error('Script error caught:', event.message);
    // Don't show errors to user unless needed
  });
  
  
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

  // Add event listeners to history dropdown items
  const historyItems = document.querySelectorAll('.history-dropdown-item[data-response-id]');
  historyItems.forEach(item => {
    item.addEventListener('click', function() {
      // Close the dropdown
      historyDropdown.classList.remove("active");
      
      // Get the response data from the data attribute
      const responseData = JSON.parse(this.getAttribute('data-response-data'));
      const header = this.getAttribute('data-header');
      
      // Hide welcome text and move input up if not already done
      if (!welcomeHidden) {
        welcomeText.classList.add("hidden");
        inputContainer.classList.add("moved-up");
        welcomeHidden = true;
      }
      
      // Update UI with the selected prediction data
      updateCards(responseData);
      
      // Add back button
      hasActiveResult = true;
      setTimeout(addBackButton, 100);
    });
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
  let currentData = null; // Store the current data for chart updates

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
    currentData = null;
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
        currentData = responseData; // Store the data globally
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
   * Filter data based on selected time frame
   * @param {Array} data - The full dataset
   * @param {String} timeFrame - The selected time frame ('1day', '1week', etc.)
   * @returns {Array} - Filtered data
   */
  function filterDataByTimeFrame(data, timeFrame) {
    console.log("Filtering data:", data);
    console.log("Time frame:", timeFrame);
    
    // If data is not in the expected format, try to use it directly
    if (!data || !data.length) {
      console.warn("No data available or data is empty");
      return [];
    }
    
    // Check if data has 'day' field (model output format)
    const hasDayField = data[0] && data[0].day !== undefined;
    
    if (hasDayField) {
      console.log("Found 'day' field, using numeric filtering");
      
      // Map timeframe to number of days to show
      let daysToShow;
      switch(timeFrame) {
        case '1day':
          daysToShow = 1;
          break;
        case '1week':
          daysToShow = 7;
          break;
        case '1month':
          daysToShow = 30;
          break;
        case '6months':
          daysToShow = 180;
          break;
        case '1year':
          daysToShow = 365;
          break;
        default:
          daysToShow = 30; // Default to 1 month
      }
      
      // Sort by day in ascending order if needed
      const sortedData = [...data].sort((a, b) => a.day - b.day);
      
      // Filter by day field
      const filteredData = sortedData.filter(item => {
        const day = parseInt(item.day);
        return !isNaN(day) && day <= daysToShow;
      });
      
      console.log(`Filtered from ${data.length} to ${filteredData.length} items with daysToShow=${daysToShow}`);
      return filteredData.length ? filteredData : sortedData;
    }
    
    // For date-based data, use the original implementation
    let hasDateFields = false;
    
    // Check if data has timestamp or date fields
    if (data[0]) {
      hasDateFields = data[0].timestamp || data[0].date || 
                     (typeof data[0].x !== 'undefined') ||
                     (data[0].time) || (data[0].datetime);
    }
    
    // If no date fields, just return all data
    if (!hasDateFields) {
      console.warn("No date fields found in data, using all data");
      return data;
    }
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch(timeFrame) {
      case '1day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        cutoffDate.setDate(now.getDate() - 7); // Default to 1 week
    }

    console.log("Cutoff date:", cutoffDate);
    
    // More flexible filtering - try multiple possible date field names
    const filteredData = data.filter(item => {
      // Try all possible date field names
      const dateStr = item.timestamp || item.date || item.time || item.datetime || item.x;
      
      // If no date field found, include the item
      if (!dateStr) return true;
      
      let itemDate;
      try {
        // Try to parse the date
        itemDate = new Date(dateStr);
        // Check if date is valid
        if (isNaN(itemDate.getTime())) {
          console.warn("Invalid date:", dateStr);
          return true; // Include items with invalid dates
        }
      } catch (e) {
        console.warn("Error parsing date:", dateStr, e);
        return true; // Include items with unparseable dates
      }
      
      return itemDate >= cutoffDate;
    });
    
    console.log("Filtered data count:", filteredData.length);
    
    // If filtering resulted in empty data, return original data
    if (!filteredData.length) {
      console.warn("Filtering resulted in empty data, using all data");
      return data;
    }
    
    return filteredData;
  }

  /**
   * Render the chart with the provided data
   * @param {Array} data - The data to display
   * @param {String} chartType - The type of chart ('line' or 'candlestick')
   * @param {String} timeFrame - The time frame to filter by
   */
  function renderChart(data, chartType, timeFrame) {
    if (!data || !data.length) {
      console.error("No data available for rendering chart");
      return;
    }
    
    console.log("Rendering chart with data:", data);
    console.log("Chart type:", chartType);
    
    // Check if data is string or not properly formatted
    if (data.length > 0 && typeof data[0] === 'string') {
      console.warn("Data appears to be strings, attempting to parse");
      try {
        // Try to parse the strings as JSON
        data = data.map(item => {
          try {
            return typeof item === 'string' ? JSON.parse(item) : item;
          } catch (e) {
            console.error("Failed to parse item:", item);
            return { value: parseFloat(item) || 0 };
          }
        });
        console.log("After parsing:", data);
      } catch (e) {
        console.error("Error parsing data:", e);
      }
    }
    
    // If data values are coming from the 'predictions' field, extract it
    if (data.length > 0 && data[0].predictions && Array.isArray(data[0].predictions)) {
      console.log("Found predictions array in data, using that instead");
      data = data[0].predictions;
    }
    
    // Check if data is actually the prediction response with prices
    if (data.length > 0 && data[0].prices && Array.isArray(data[0].prices)) {
      console.log("Found prices array in data, using that instead");
      data = data[0].prices;
    }
    
    // Handle common Flask response format where data might be in 'values'
    if (data.length > 0 && data[0].values && Array.isArray(data[0].values)) {
      console.log("Found values array in data, using that instead");
      data = data[0].values;
    }
    
    // Handle single prediction object format
    if (data.length === 1 && data[0].prediction !== undefined) {
      console.log("Found single prediction object, transforming to time series");
      // Create a time series from the single prediction
      const baseValue = parseFloat(data[0].prediction) || 0;
      const newData = [];
      
      // Generate a simple time series based on the prediction value
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (9 - i));
        
        // Create variation around the prediction value
        const variation = i === 9 ? 0 : (Math.random() * 2 - 1) * (baseValue * 0.05);
        const value = baseValue + variation;
        
        newData.push({
          date: date.toISOString(),
          value: value
        });
      }
      
      data = newData;
      console.log("Transformed to time series:", data);
    }
    
    // Print the actual value of a sample
    if (data.length > 0) {
      console.log("Sample data value as number:", 
        parseFloat(data[0].price || data[0].value || data[0].close || data[0].y || data[0].prediction || data[0]));
    }
    
    // Filter data based on time frame
    const filteredData = filterDataByTimeFrame(data, timeFrame);
    
    // Analyze data structure to determine the right format
    const dataFormat = analyzeDataFormat(filteredData);
    console.log("Detected data format:", dataFormat);
    
    // Extract X and Y values with explicit logging
    const xValues = extractXValues(filteredData, dataFormat);
    const yValues = extractYValues(filteredData, dataFormat);
    
    console.log("Final X values (first 5):", xValues.slice(0, 5));
    console.log("Final Y values (first 5):", yValues.slice(0, 5));
    
    // Prepare the data for Plotly based on chart type and detected format
    let plotData;
    
    if (chartType === 'line') {
      // Line chart data
      plotData = [{
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines+markers',
        line: {
          color: '#e92c6c',
          width: 3
        },
        marker: {
          color: '#e92c6c',
          size: 8
        }
      }];
    } else if (chartType === 'candlestick') {
      // Check if we have OHLC data
      if (dataFormat.hasOHLC) {
        // Candlestick chart data
        plotData = [{
          x: xValues,
          open: extractValues(filteredData, 'open', dataFormat),
          high: extractValues(filteredData, 'high', dataFormat),
          low: extractValues(filteredData, 'low', dataFormat),
          close: extractValues(filteredData, 'close', dataFormat),
          type: 'candlestick',
          increasing: {line: {color: '#26a69a'}},
          decreasing: {line: {color: '#ef5350'}}
        }];
      } else {
        // Fallback to line chart if OHLC data not available
        console.warn("Candlestick selected but OHLC data not available. Falling back to line chart.");
        plotData = [{
          x: xValues,
          y: yValues,
          type: 'scatter',
          mode: 'lines+markers',
          line: {
            color: '#e92c6c',
            width: 3
          },
          marker: {
            color: '#e92c6c',
            size: 8
          }
        }];
      }
    }
    
    // Log the actual plot data being sent to Plotly
    console.log("Plot data being sent to Plotly:", plotData);
    
    // Get the graph div
    const graphDiv = document.getElementById('graph');
    if (!graphDiv) {
      console.error("Graph container not found in DOM");
      return;
    }
    
    // Set up the layout
    const layout = {
      title: 'Market Analysis',
      paper_bgcolor: '#222225',
      plot_bgcolor: '#2c2c30',
      font: { color: '#e0e0e0' },
      autosize: true,
      height: 400,
      width: graphDiv.clientWidth || 800,
      margin: {
        l: 50,
        r: 30,
        b: 50,
        t: 50
      },
      xaxis: {
        fixedrange: true, // Prevent x-axis from being dragged/zoomed
        type: dataFormat.hasDayField ? 'category' : (dataFormat.hasDateX ? 'date' : 'category'),
        title: dataFormat.hasDayField ? 'Day' : 'Date',
        rangeslider: chartType === 'candlestick' && dataFormat.hasOHLC ? { visible: false } : undefined
      },
      yaxis: {
        fixedrange: true, // Prevent y-axis from being dragged/zoomed
        title: dataFormat.hasOHLC ? 'Price' : 'Value'
      }
    };
    
    // Render the chart
    Plotly.newPlot('graph', plotData, layout, {
      responsive: true,
      displayModeBar: false, // Disable the mode bar completely
      modeBarButtonsToRemove: ['lasso2d', 'select2d']
    }).then(function() {
      console.log("Chart rendered successfully");
      
      // Fix any SVG namespace issues
      const svgElements = document.querySelectorAll('#graph svg');
      svgElements.forEach(svg => {
        if (!svg.getAttribute('xmlns')) {
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        
        if (!svg.getAttribute('width')) {
          svg.setAttribute('width', '100%');
        }
        if (!svg.getAttribute('height')) {
          svg.setAttribute('height', '100%');
        }
      });
      
      // Handle window resize
      window.addEventListener('resize', function() {
        Plotly.relayout('graph', {
          width: document.getElementById('graph').clientWidth,
          height: 400
        });
      });
    }).catch(function(error) {
      console.error("Error rendering chart:", error);
    });
  }
  
  /**
   * Analyze the data format to determine how to extract values
   * @param {Array} data - The data to analyze
   * @returns {Object} Format information
   */
  function analyzeDataFormat(data) {
    if (!data || !data.length) {
      return { 
        hasDateX: false, 
        hasXY: false, 
        hasOHLC: false,
        hasArrayFormat: false,
        hasDayField: false
      };
    }
    
    const sample = data[0];
    const format = {
      hasDateX: false,
      hasXY: false,
      hasOHLC: false,
      hasArrayFormat: false,
      hasDayField: false,
      dateField: null,
      valueField: null
    };
    
    // Check for 'day' field (model output format)
    if (sample.day !== undefined) {
      format.hasDayField = true;
      console.log("Detected model output format with 'day' field");
    }
    
    // Check if data is in array format (e.g., [[date, value], [date, value]])
    if (Array.isArray(sample) && !sample.hasOwnProperty) {
      format.hasArrayFormat = true;
      // Assume first element is date/x and second is value/y
      const firstItem = sample[0];
      if (firstItem && (typeof firstItem === 'string' || firstItem instanceof Date || !isNaN(new Date(firstItem)))) {
        format.hasDateX = true;
      }
      return format;
    }
    
    // Check for common date fields
    const dateFields = ['timestamp', 'date', 'time', 'datetime', 'x'];
    for (const field of dateFields) {
      if (sample[field] !== undefined) {
        format.dateField = field;
        try {
          const date = new Date(sample[field]);
          if (!isNaN(date.getTime())) {
            format.hasDateX = true;
          }
        } catch (e) {
          // Not a valid date, continue
        }
        break;
      }
    }
    
    // Check for x/y format
    if (sample.x !== undefined && sample.y !== undefined) {
      format.hasXY = true;
    }
    
    // Check for value fields if not x/y format
    if (!format.hasXY) {
      const valueFields = ['value', 'price', 'close', 'y'];
      for (const field of valueFields) {
        if (sample[field] !== undefined) {
          format.valueField = field;
          break;
        }
      }
    }
    
    // Check for OHLC format
    format.hasOHLC = (
      sample.open !== undefined &&
      sample.high !== undefined &&
      sample.low !== undefined &&
      (sample.close !== undefined || sample.price !== undefined)
    );
    
    return format;
  }
  
  /**
   * Extract X values (dates or categories) from the data
   * @param {Array} data - The data to extract from
   * @param {Object} format - The detected format
   * @returns {Array} X values
   */
  function extractXValues(data, format) {
    if (!data || !data.length) return [];
    
    // If we have 'day' field, use that for X axis
    if (format.hasDayField) {
      console.log("Using 'day' field for X values");
      return data.map(item => item.day);
    }
    
    if (format.hasArrayFormat) {
      // Data is in array format [[x, y], [x, y]]
      return data.map(item => format.hasDateX ? new Date(item[0]) : item[0]);
    }
    
    if (format.hasXY) {
      // Data has explicit x/y properties
      return data.map(item => format.hasDateX ? new Date(item.x) : item.x);
    }
    
    // Try common date fields
    if (format.dateField) {
      return data.map(item => {
        const val = item[format.dateField];
        return format.hasDateX ? new Date(val) : val;
      });
    }
    
    // If none of the above, use indices as X values
    return data.map((_, i) => i);
  }
  
  /**
   * Extract Y values from the data
   * @param {Array} data - The data to extract from
   * @param {Object} format - The detected format
   * @returns {Array} Y values
   */
  function extractYValues(data, format) {
    if (!data || !data.length) return [];
    
    console.log("Original data structure for first item:", JSON.stringify(data[0]));
    
    let yValues = [];
    
    // If data has OHLC format and we're looking for line chart values,
    // prefer 'close' price which is standard for financial charts
    if (format.hasOHLC) {
      console.log("Using 'close' price for Y values from OHLC data");
      yValues = data.map(item => {
        let val = item.close;
        return typeof val === 'string' ? parseFloat(val) : val;
      });
      
      console.log("First few close values:", yValues.slice(0, 5));
      return yValues; // Return early as we have what we need
    }
    
    if (format.hasArrayFormat) {
      // Data is in array format [[x, y], [x, y]]
      console.log("Using array format extraction");
      yValues = data.map(item => {
        // Make sure to convert to number
        let val = item[1];
        return typeof val === 'string' ? parseFloat(val) : val;
      });
    } else if (format.hasXY) {
      // Data has explicit x/y properties
      console.log("Using x/y property extraction");
      yValues = data.map(item => {
        let val = item.y;
        return typeof val === 'string' ? parseFloat(val) : val;
      });
    } else if (format.valueField) {
      // Try common value fields
      console.log("Using value field extraction:", format.valueField);
      yValues = data.map(item => {
        let val = item[format.valueField];
        return typeof val === 'string' ? parseFloat(val) : val;
      });
    } else {
      // Try other common fields
      console.log("Using fallback field extraction");
      yValues = data.map(item => {
        // Check each value for debugging
        const closeVal = item.close || null;
        const priceVal = item.price || null;
        const valueVal = item.value || null;
        const yVal = item.y || null;
        
        console.log("Checking values - close:", closeVal, "price:", priceVal, "value:", valueVal, "y:", yVal);
        
        // Order matters - first match wins, prefer close for financial data
        let val = item.close || item.price || item.value || item.y || 0;
        
        // If we have a prediction key, it might be the main value
        if (item.prediction !== undefined) {
          console.log("Found prediction value:", item.prediction);
          val = item.prediction;
        }
        
        // If it's a string, convert to float
        if (typeof val === 'string') {
          val = parseFloat(val);
        }
        
        return val;
      });
    }
    
    // Convert any remaining strings to numbers and handle potential NaN values
    yValues = yValues.map(val => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      return isNaN(val) ? 0 : val;
    });
    
    // Log the extracted values for debugging
    console.log("Extracted Y values (first 5):", yValues.slice(0, 5));
    return yValues;
  }
  
  /**
   * Extract values for a specific field from the data
   * @param {Array} data - The data to extract from
   * @param {String} field - The field to extract
   * @param {Object} format - The detected format
   * @returns {Array} Extracted values
   */
  function extractValues(data, field, format) {
    if (!data || !data.length) return [];
    
    if (format.hasArrayFormat) {
      // For array format, we need field mapping
      const fieldMap = { open: 1, high: 2, low: 3, close: 4 };
      const index = fieldMap[field] || 1;
      // Check if we have enough elements
      return data.map(item => item.length > index ? item[index] : 0);
    }
    
    // Try direct field access
    return data.map(item => {
      const value = item[field];
      return value !== undefined ? value : 
             (field === 'close' ? (item.price || item.value || 0) : 0);
    });
  }

  /**
   * Updates the dashboard cards with the response data from the server
   * Creates graph container and chatGPT analysis sections
   * @param {Array} responseData - The data returned from the server
   */
  function updateCards(responseData) {
    console.log("Updating cards with data:", responseData);
    
    // Store the data globally for chart updates
    currentData = responseData;
    
    // Ensure we have array data to work with
    if (!Array.isArray(currentData)) {
      console.warn("Response data is not an array, attempting to convert");
      
      // Try to convert different formats to an array
      if (typeof currentData === 'object') {
        // If it's an object, check for data arrays inside
        if (currentData.data && Array.isArray(currentData.data)) {
          currentData = currentData.data;
        } else if (currentData.prices && Array.isArray(currentData.prices)) {
          currentData = currentData.prices;
        } else if (currentData.values && Array.isArray(currentData.values)) {
          currentData = currentData.values;
        } else if (currentData.response && Array.isArray(currentData.response)) {
          currentData = currentData.response;
        } else {
          // Convert object to array of [key, value] pairs as last resort
          currentData = Object.entries(currentData);
        }
      } else if (typeof currentData === 'string') {
        // If it's a string, try parsing as JSON
        try {
          const parsed = JSON.parse(currentData);
          if (Array.isArray(parsed)) {
            currentData = parsed;
          } else if (typeof parsed === 'object') {
            // Extract array data from parsed object
            if (parsed.data && Array.isArray(parsed.data)) {
              currentData = parsed.data;
            } else if (parsed.response && Array.isArray(parsed.response)) {
              currentData = parsed.response;
            } else {
              // Convert object to array as last resort
              currentData = Object.entries(parsed);
            }
          }
        } catch (e) {
          console.error("Failed to parse string data as JSON", e);
          // Create dummy data as fallback
          currentData = generateDummyData();
        }
      } else {
        // If all else fails, create dummy data
        console.warn("Could not convert data to usable format, using dummy data");
        currentData = generateDummyData();
      }
    }
    
    // Special case handling for specific nested data format
    if (currentData.length === 1 && typeof currentData[0] === 'string') {
      try {
        const parsedItem = JSON.parse(currentData[0]);
        console.log("Parsed single string item:", parsedItem);
        
        // Check if it contains prediction data
        if (parsedItem.predictions && Array.isArray(parsedItem.predictions)) {
          currentData = parsedItem.predictions;
        } else if (parsedItem.prices && Array.isArray(parsedItem.prices)) {
          currentData = parsedItem.prices;
        } else if (parsedItem.data && Array.isArray(parsedItem.data)) {
          currentData = parsedItem.data;
        } else if (Array.isArray(parsedItem)) {
          currentData = parsedItem;
        } else {
          // If it's just a single object with price properties
          currentData = [parsedItem];
        }
      } catch (e) {
        console.warn("Failed to parse single string item:", e);
      }
    }
    
    // Handle case where each array item is a JSON string
    if (currentData.length > 0 && typeof currentData[0] === 'string') {
      try {
        const newData = [];
        for (let i = 0; i < currentData.length; i++) {
          try {
            const parsed = JSON.parse(currentData[i]);
            newData.push(parsed);
          } catch (e) {
            // If parsing fails, try to see if it's a numeric string
            if (!isNaN(parseFloat(currentData[i]))) {
              newData.push({ value: parseFloat(currentData[i]) });
            }
          }
        }
        if (newData.length > 0) {
          console.log("Converted string array to objects:", newData);
          currentData = newData;
        }
      } catch (e) {
        console.warn("Failed to process string array:", e);
      }
    }
    
    // Check if we have a prediction object with prices
    if (currentData.length === 1 && currentData[0].prices && Array.isArray(currentData[0].prices)) {
      console.log("Found prices array in single object, extracting");
      currentData = currentData[0].prices;
    }
    
    // Print first 3 items for debugging
    if (currentData.length > 0) {
      console.log("First 3 items of processed data:");
      for (let i = 0; i < Math.min(3, currentData.length); i++) {
        console.log(`Item ${i}:`, JSON.stringify(currentData[i]));
      }
    }
    
    // Check if data array is empty
    if (!currentData.length) {
      console.warn("Data array is empty, using dummy data");
      currentData = generateDummyData();
    }
    
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
    graphDiv.style.height = '400px'; // Increased height for better visibility
    graphContainer.appendChild(graphDiv);

    // Add graph container to content container first
    contentContainer.appendChild(graphContainer);
    
    // Update the DOM before plotting to ensure the element exists
    dynamicContent.innerHTML = '';
    dynamicContent.appendChild(contentContainer);

    // Check if Plotly is loaded and render the chart
    if (typeof Plotly !== 'undefined') {
      console.log("Plotly is defined, rendering chart");
      
      // Allow DOM to fully update before rendering Plotly
      setTimeout(() => {
        try {
          // Render the chart with the current data and settings
          renderChart(currentData, currentChartType, currentTimeFrame);
        } catch (e) {
          console.error("Exception when rendering Plotly chart:", e);
          
          // If rendering fails, try with dummy data
          console.warn("Trying fallback with dummy data");
          renderChart(generateDummyData(), 'line', currentTimeFrame);
        }
      }, 100); // Short delay to ensure DOM is ready
    } else {
      console.error("Plotly is not defined!");
      // Add fallback message for users
      graphDiv.innerHTML = '<p style="text-align: center; padding: 50px;">Chart visualization failed to load. Please refresh the page.</p>';
    }
    
    // Create graph controls container
    const graphControls = document.createElement('div');
    graphControls.className = 'graph-controls';
    
    // Chart type toggle buttons
    const chartTypeToggle = document.createElement('div');
    chartTypeToggle.className = 'chart-type-toggle';
    
    const lineBtn = document.createElement('button');
    lineBtn.className = 'toggle-btn' + (currentChartType === 'line' ? ' active' : '');
    lineBtn.textContent = 'Line';
    lineBtn.dataset.type = 'line';
    
    const candleBtn = document.createElement('button');
    candleBtn.className = 'toggle-btn' + (currentChartType === 'candlestick' ? ' active' : '');
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

    // Add click events for chart type buttons
    const chartTypeBtns = document.querySelectorAll('.chart-type-toggle .toggle-btn');
    chartTypeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        chartTypeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentChartType = this.dataset.type;
        
        // Update the chart with the new chart type
        if (currentData) {
          renderChart(currentData, currentChartType, currentTimeFrame);
        }
      });
    });
    
    // Add click events for time frame buttons
    const timeFrameBtns = document.querySelectorAll('.time-range-toggle .toggle-btn');
    timeFrameBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        timeFrameBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentTimeFrame = this.dataset.timeframe;
        
        // Update the chart with the new time frame
        if (currentData) {
          renderChart(currentData, currentChartType, currentTimeFrame);
        }
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
  
  /**
   * Generate dummy data for fallback rendering
   * @returns {Array} Dummy data with dates and values
   */
  function generateDummyData() {
    const now = new Date();
    const data = [];
    
    // Generate 30 days of dummy data
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random value between 100 and 200
      const value = 100 + Math.random() * 100;
      
      data.push({
        date: date.toISOString(),
        value: value,
        // For candlestick support
        open: value - (5 + Math.random() * 10),
        high: value + (5 + Math.random() * 10),
        low: value - (5 + Math.random() * 10),
        close: value
      });
    }
    
    return data;
  }
});
