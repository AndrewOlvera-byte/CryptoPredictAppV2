document.addEventListener("DOMContentLoaded", function() {
    // Define sample data
    const data = [
      {
        x: [1, 2, 3, 4, 5],
        y: [10, 15, 13, 17, 10],
        type: 'scatter'
      }
    ];
  
    // Define layout with a pink background
    const layout = {
      title: 'Sample Plotly Chart',
      paper_bgcolor: 'pink',
      plot_bgcolor: 'pink',
      width: 600,
      height: 400,
      margin: {
        l: 50,
        r: 50,
        t: 50,
        b: 50
      }
    };
  
    // Render the chart
    Plotly.newPlot('chart', data, layout);
  });
  