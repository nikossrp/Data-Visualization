import React, { useEffect, useRef, useState } from 'react';
import ChartJS from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom'; // for zomming in/out in diagram

const MyChartJS = ({ chartData }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    let chartInstance = null;
    if (chartData[0]) {
      chartInstance = generateChartJS(chartData);
    }

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, [chartData]);

  const generateChartJS = (data) => {
    const labels = data[0].slice(5);
    const chartData = Object.values(data).slice(1);
    const datasets = [];
  
    // Check if a chart already exists on the canvas
    if (chartRef.current && chartRef.current.chartInstance) {
      chartRef.current.chartInstance.destroy();
    }
  
    // Check if there is at least one record, if not, display empty diagram
    if (!data[Object.keys(data)[1]]) {
      const emptyData = {
        labels: labels,
        datasets: [],
      };
      datasets.push(emptyData);
    } else {
      chartData.forEach((row) => {
        const label = row[0] + ' ' + row[1] + ' ' + row[2] + ' ' + row[3];
        const values = row.slice(5);
  
        const dataset = {
          label: label,
          data: values,
          fill: false,
          tension: 0.1,
        };
        datasets.push(dataset);
      });
    }
  
    // Define the options for the chart
    const options = {
      responsive: true,
      interaction: {
        mode: 'index',    // it display all the results on the x axis
      },
      elements: {
        point: {
          radius: 4,
          hoverRadius: 8,
        },
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'xy',
          },
        },
        tooltip: {
          enabled: true,
          intersect: false,
          callbacks: {
            label: function (context) {
              const datasetLabel = context.dataset.label || '';
              const dataPointIndex = context.dataIndex;
              const dataset = context.chart.data.datasets[context.datasetIndex];
              const dataValue = dataset.data[dataPointIndex];
              
              return datasetLabel + ': ' + dataValue;
            },
          },
        },
      },
    };
  
    // Create the chart
    if (chartRef.current) {
      ChartJS.register(zoomPlugin);
      const ctx = chartRef.current.getContext('2d');
      chartRef.current.chartInstance = new ChartJS(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: datasets,
        },
        options: options,
      });
    }
  };

  return (
      <canvas ref={chartRef} id="myChart" />
  );
};

export default MyChartJS;
