import { useEffect, useState } from 'react';
import './App.css';
import {Buttons, MyChartJS} from './components';
import dir from './Data/test_data.xlsx';
import * as XLSX from 'xlsx';


function App() {
  const [excelData, setExcelData] = useState([]);   //fill the array with the data from the excel file
  const [userOptions, setUserOptions] = useState([]);   // keep the options fro the checkboxes
  const [chartData, setChartData] = useState([]);  
  
  
  useEffect(() => {
    fetch(dir)
    .then(response => response.arrayBuffer())
    .then(buffer => {
      let data = new Uint8Array(buffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) ;
      setExcelData(jsonData);
    })
    .catch(error => {
      console.log('Error reading Excel file:', error);
    })  
  }, [excelData]);    


  useEffect(() => {   
    processData(excelData);
  }, [userOptions])   // we call the processData when the user changes the options


  const handleOptions = (options) => {  // handle the checkboxes options
    setUserOptions(options);
  };


  const processData = (jsonData) => {
    var record;
    var isMatchRegion = false;  // label for relating the record with the region
    var isMatchModel = false;
    var isMatchScenario = false;
    var isMatchVariable = false;
    const selected_regions = userOptions['Regions'];
    const selected_models = userOptions['Models'];
    const selected_scenarios = userOptions['Scenarios'];
    const selected_variables = userOptions['Variables'];


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
      <div className="container">
        <div className="formData">
          <Buttons 
            data={excelData} 
            handleOptions={handleOptions} 
          />
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
