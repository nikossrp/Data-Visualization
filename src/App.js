import { useEffect, useState } from 'react';
import './App.css';
import {Buttons, MyChartJS, TransferDataButton, UploadDataButton } from './components';
import dir from './Data/test_data.xlsx';
import * as XLSX from 'xlsx';
import axios from 'axios';


function App() {
  const [excelData, setExcelData] = useState([]);   //fill the array with the data from the excel file
  const [userOptions, setUserOptions] = useState([]);   // keep the options fro the checkboxes
  const [chartData, setChartData] = useState([]);  
  // const [upload, setUpload] = useState(false);
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("uncompleted_transference");


  // for pooling the data from database
  useEffect(() => {
    const startpooling = () => {
      const pollInterval = setInterval(fetchStatus, 10000); // Periodically fetch the data every 5 seconds until the transfer is completed
      function fetchStatus() {
        axios.get('http://localhost:8080/api/results')
          .then(response => {
            const status = response.data.status;
            console.log(response.data, status);
            setStatus(status)
            if (status === 'completed_transference') {
              // Perform actions when complete status is received
              stopPolling(); // Stop the polling loop
              
              console.log(response.data.data.length);
              console.log(response.data.data);
              setStatus(status)
              setExcelData(response.data.data);
            }
          })
          .catch(error => {
            console.log('Error fetching status:', error);
          });
      }
      function stopPolling() {
        clearInterval(pollInterval);
      }
    }

    startpooling();

  }, []);

  

  
  // useEffect(() => {
  //   fetch(dir)
  //   .then(response => response.arrayBuffer())
  //   .then(buffer => {
  //     let data = new Uint8Array(buffer);
  //     const workbook = XLSX.read(data, { type: 'array' });
  //     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //     const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) ;
  //     setExcelData(jsonData);
  //   })
  //   .catch(error => {
  //     console.log('Error reading Excel file:', error);
  //   })  
  // }, [excelData]);    


  useEffect(() => {   
    processData(excelData);
  }, [userOptions])   // we call the processData when wereceive the data from backkend and user changes the options


  const handleOptions = (options) => {  // handle the checkboxes options
    setUserOptions(options);
  };

  // fill the chartData array using the data from excel compared with the user options
  const processData = (jsonData, status) => {
    var record;
    var isMatchRegion = false;  // label for relating the record with the region
    var isMatchModel = false;
    var isMatchScenario = false;
    var isMatchVariable = false;
    const selected_regions = userOptions['Regions'];
    const selected_models = userOptions['Models'];
    const selected_scenarios = userOptions['Scenarios'];
    const selected_variables = userOptions['Variables'];

    if (status === 'uncompleted_transference' ) {
      console.log("I have uncompleted status");
      return;
    }

    const temp_data = {};
    temp_data[0] = jsonData[0];
      // clear the dataset based on the selected options that the user made
    for (let curr_record = 1; curr_record < jsonData.length; curr_record++) {
      record = jsonData[curr_record];

      isMatchRegion = record.some(el => selected_regions.includes(el));  // if the user dones't select region we dont plot the diagram
      
      
      if (selected_models.length > 0) {
        isMatchModel = record.some(el => selected_models.includes(el));
      } 
      else {
        isMatchModel = true;  // include all models if the user hasn't selected any options
      }
      
      if (selected_scenarios.length > 0) {
        isMatchScenario = record.some(el => selected_scenarios.includes(el));
      } 
      else {
        isMatchScenario = true;  // include all scenarios if the user hasn't selected any options
      }
      
      if (selected_variables.length > 0) {
        isMatchVariable = record.some(el => selected_variables.includes(el));
      } 
      else {
        isMatchVariable = true;  // include all variables if the user hasn't selected any options
      }


      if (isMatchRegion && isMatchModel && isMatchScenario && isMatchVariable) {
        isMatchRegion = false;
        isMatchModel = false;
        isMatchScenario = false;
        isMatchVariable = false;
        temp_data[curr_record] = record;
        continue;
      }
    }

    setChartData(temp_data);
  };


  return (
    <div className="App">
        <div className='top'>
          <p> Lorem, ipsum dolor sit amet consectetur adipisicing elit.
             Ullam veniam magni provident explicabo nulla impedit nihil 
             quae sit sapiente. Laborum! </p>
          <div><UploadDataButton/></div>
          <div><TransferDataButton/></div>
        </div>
        <div className="container">
          <div className="formData">
              <Buttons 
                data={excelData} 
                handleOptions={handleOptions} />
          </div>
          <div className="charts">
            <MyChartJS
              chartData={chartData}  
            />
          </div>
        </div>
    </div>
  );
}

export default App;
