import React, { useCallback, useEffect, useState } from 'react'

const Buttons = ({data, handleOptions}) => {

  const [options, setOptions] = useState({});
  const [selectedOptions, setSelectedOptions] = useState({
    'Regions': [],
    'Models': [],
    'Scenarios': [],
    'Variables': []
  });
  


  useEffect(() => {
    processData(data);
  }, [data]);


  
  const processData = (jsonData) => {
    const checkBoxes = {};

    var region, model, scenario, variable;

    var regions = [];   // keep all the regions on the dataset
    var models = [];
    var scenarios = [];
    var variables = [];
  
    // Fill the arrays based on the data
    for (let i = 1; i < jsonData.length; i++) { 
      model = jsonData[i][0];
      scenario = jsonData[i][1];
      region = jsonData[i][2];
      variable = jsonData[i][3];
      
      // remove duplicates
      if (region === 'RUS') {
        region = 'Russia';
        jsonData[i][2] = region;
      }
      else if (region === 'CHI' || region === 'CHN') {
        region = 'China';
        jsonData[i][2] = region;
      }
      
      if (scenario === 'baseline') {
        scenario = 'Baseline';
        jsonData[i][1] = scenario;
      }
  
      if (!regions.includes(region)) {
        regions.push(region);
      }
      if (!models.includes(model)) {
        models.push(model);
      }
      if (!scenarios.includes(scenario)) {
        scenarios.push(scenario);
      }
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    checkBoxes['Regions'] = regions;
    checkBoxes['Models'] = models;
    checkBoxes['Scenarios'] = scenarios;
    checkBoxes['Variables'] = variables;

    setOptions(checkBoxes);
  }



  const handleSubmit = (e) => {
    e.preventDefault();
    handleOptions(selectedOptions);
    // handleSubmitValue(true);
    setSelectedOptions({
      'Regions': [],
      'Models': [],
      'Scenarios': [],
      'Variables': []
    });   
    e.target.reset(); 
  }


  const handleCheckboxChange = (e, category) => {
    setSelectedOptions((prevSelectedOptions) => {
      const checked = e.target.checked;
      const value = e.target.value;
      if (checked) {  // add it to the input field
        return {
          ...prevSelectedOptions,
            [category]: [...prevSelectedOptions[category], value]
          };
        }
        else if (!checked) {  // remove from input field
          const updateSelectedOptions = prevSelectedOptions[category].filter((option) => option !== value);
          return {
            ...prevSelectedOptions,
            [category]: updateSelectedOptions
          }
        }
      });
    }

    
    
    
    return (
      <div>
    {/* Generate the checkBoxes based on the data */}
    <form onSubmit={handleSubmit}>

        {Object.entries(options).map(([category, options]) => (
          <div key={category}>
            <h3>{category === "Regions" ? "Regions *" : category}</h3>    
            <input
              type="text"
              id={`dropdown-${category}`}
              value={selectedOptions[category] }
              readOnly
            />
            {options.map((option, index) => (
              <div key={index}>
                <input
                  type="checkbox"
                  id={`checkbox-${option}`}
                  value = {option}
                  onClick={(e) => handleCheckboxChange(e, category)}
                />
                <label htmlFor={`checkbox-${option}`}>{option}</label>
              </div>
            ))}
          </div>
        ))}
        <br />
      <button type='submit'>Submit</button>
    </form>
    </div>
  );
}

export default Buttons