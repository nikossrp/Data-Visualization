const express = require('express');
const cors = require('cors')
const { Pool } = require('pg');
const XLSX = require('xlsx');
const path = require('path');
const multer = require('multer');
const port = 8080;
const upload = multer({dest: 'upload/'}); // for taking the file
const app = express();


let uploadedFile = null;
let completed_transference = false;
let yearsArray = []    // keeping the years on a global variable for using on the processData function
let countRows = 0; 


app.use(cors());    // we're using cors for allowing access from the front-end (Note: Springboot has cors by default)
app.use(cors({
  origin: 'http://localhost:3000'
}))

require('dotenv').config({ path: '../../Database/.env' }) // allowing the use of variables from .env


const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT, // or the port number for your PostgreSQL database
});


// fetch endpoint retrieve data from the ResultsTable
app.get('/api/results', async (req, res) => {
  // pool.connect((err, client, done) => {
    try {
      if (!completed_transference) {
        res.json({data: {}, status: "uncompleted_transference"});
        return;
      }

      const client = await pool.connect();
      await client.query('CREATE EXTENSION IF NOT EXISTS tablefunc;');  // this is for convert he rows (years) into columns for using them on the front end
      
      const years = `
        SELECT DISTINCT Year
        FROM Resultstable
        ORDER BY Year; `;

      const distinctYearsColumns = await client.query(years);
      const distinctYearsArray = distinctYearsColumns.rows.map(row => row.year);   // here we get an array with the years [2005, 2010, ...]

      const columnDefinitions = distinctYearsArray
      .map(value => `"${value}" text`)
      .join(', ');
      const testResults = await client.query(
        `SELECT ModelTable.Name as Model, ScenarioTable.Name as Scenario, RegionTable.Name as Region, VariableTable.name as Variable, UnitTable.Name as Unit, ResultsTable.Year, ResultsTable.Value
        FROM ResultsTable
        INNER JOIN ModelTable on ResultsTable.Model_id = ModelTable.id
        INNER JOIN ScenarioTable on ResultsTable.Scenario_id = ScenarioTable.id
        INNER JOIN RegionTable ON ResultsTable.Region_id = RegionTable.id
        INNER JOIN VariableTable ON ResultsTable.Variable_id = VariableTable.id
        INNER JOIN UnitTable ON ResultsTable.Unit_id = UnitTable.id`);


      const results = await client.query(
        `SELECT *
          FROM crosstab(
              'SELECT ModelTable.Name as Model, ScenarioTable.Name as Scenario, RegionTable.Name as Region, VariableTable.name as Variable, UnitTable.Name as Unit, ResultsTable.Year, ResultsTable.Value
                FROM ResultsTable
                INNER JOIN ModelTable on ResultsTable.Model_id = ModelTable.id
                INNER JOIN ScenarioTable on ResultsTable.Scenario_id = ScenarioTable.id
                INNER JOIN RegionTable ON ResultsTable.Region_id = RegionTable.id
                INNER JOIN VariableTable ON ResultsTable.Variable_id = VariableTable.id
                INNER JOIN UnitTable ON ResultsTable.Unit_id = UnitTable.id
              ORDER BY 6, 7',
              'SELECT DISTINCT Year
              FROM ResultsTable
              ORDER BY 1'
          ) AS ct (
            ${columnDefinitions},
              Model text,
              Scenario text,
              Region text,
              Variable text,
              Unit text
          );
        `
      );
      console.log(testResults.rows.length);
      console.log("------------------------------------");
      const headers = yearsArray;
      headers.unshift('Model', 'Scenario', 'Region', 'Variable', 'Unit');

      jsonData = results.rows.map(row => {
        return Object.values(row);
      });
      jsonData.unshift(headers)
      console.log(jsonData);
      res.json({data: jsonData, status: "completed_transference"}); // send data as a response
      client.release();
    } catch(err) {
      console.log('Error connecting to the database', err);
      res.status(500).send('Error onnecting to the database');
      return;
    }
    
    // client.query(
    //   `
    //   SELECT ModelTable.Name as Model, ScenarioTable.Name as Scenario, RegionTable.Name as Region, VariableTable.name, UnitTable.Name as Unit, ResultsTable.Year, ResultsTable.Value
    //   FROM ResultsTable
    //   INNER JOIN ModelTable on ResultsTable.Model_id = ModelTable.id
    //   INNER JOIN ScenarioTable on ResultsTable.Scenario_id = ScenarioTable.id
    //   INNER JOIN RegionTable ON ResultsTable.Region_id = RegionTable.id
    //   INNER JOIN VariableTable ON ResultsTable.Variable_id = VariableTable.id
    //   INNER JOIN UnitTable ON ResultsTable.Unit_id = UnitTable.id
    //   `,
    //   (error, results) => {
    //     done(); // Release the cliend back to the pool
        
    //     if (error) {
    //       console.error('Error retrieving data from the database', error);
    //       res.status(500).send('Error retrieving data from the database');
    //       return;
    //     } 
    //     if (completed_transference) {
    //       const data = processData(results.rows); // send the data in the dataset format 
    //       res.json({data: data, status: "completed_transference"}); // send data as a response
    //     }
    //     else {
    //       res.json({data: results.rows, status: "uncompleted_transference"}); // send data as a response
    //     }
    //   }
    //   )


    });
// }
// );


// Handle the uploaded file
app.post('/api/upload', upload.single('file'), (req, res) => {
  
  console.log('File uploaded successfully', req.file.originalname);
  if (req.file) {
    uploadedFile = req.file;
    res.status(200).json({message: 'File uploaded successfully'})
  }
  else {
    res.status(400).json({ error: 'No file uploaded' })
  }
})


// Transfer the data to database using the uploaded file
app.post('/api/transfer', async (req, res) => {
  // const filePath = path.join(__dirname, '../Data/test_data.xlsx');
  const filePath = uploadedFile.path;
  console.log("Transfering data to database.....");

  try { 

    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, {header: 1});

    let valueForEachYear = [];

    console.time("The whole transference of data to database");
    for (const row of data.slice(0, 4)) {
      const model = row[0];
      const scenario = row[1];
      const region = row[2];
      const variable = row[3];
      const unit = row[4];
      countRows += 1;       // we keep a counter for proccessing, retrieving the data and sending them to the client after the transference
      valueForEachYear = model != "Model" ? row.slice(5, row.length) : [];

      // when you are on headers take the years for the specific excel file
      if (model == "Model") {
        yearsArray = row.slice(5, row.length);
        continue;
      }

      try {
        let modelId, scenarioId, regionId, variableId, unitId;

        //** Inserting into to modelTable */
        const modelResult = await pool.query('SELECT id FROM ModelTable WHERE Name = $1', [model]);
        // Insert the value into ModelTable if it doesn't exist
        if (modelResult && modelResult.rows.length > 0) {
          modelId = modelResult.rows[0].id;
        } else {
          // Insert the value into ModelTable if it doesn't exist
          const insertModelResult = await pool.query('INSERT INTO ModelTable (Name) VALUES ($1) RETURNING id', [model]);
          modelId = insertModelResult.rows[0].id;
        }
        // console.log("I ended from model table with modeId: ", modelId);
        
        
        //** Inserting into to ScenarioTable */
        const scenarioResult = await pool.query('SELECT id FROM ScenarioTable WHERE Name = $1', [scenario]);
        if (scenarioResult && scenarioResult.rows.length > 0) {
          scenarioId = scenarioResult.rows[0].id;
        } else {
          const insertScenarioResult = await pool.query('INSERT INTO ScenarioTable (Name) VALUES ($1) RETURNING id', [scenario]);
          scenarioId = insertScenarioResult.rows[0].id;
        }
        // console.log("I ended from scenario table with scenarioId: ", scenarioId);

        
        //** Inserting into to RegionTable */
        const regionResult = await pool.query('SELECT id FROM RegionTable WHERE Name = $1', [region]);
        if (regionResult && regionResult.rows.length > 0) {
          regionId = regionResult.rows[0].id;
        } else {
          const insertRegionResult = await pool.query('INSERT INTO RegionTable (Name) VALUES ($1) RETURNING id', [region]);
          regionId = insertRegionResult.rows[0].id;
        }
        // console.log("I ended from region table with regionId: ", regionId);
        

        //** Inserting into to VariableTable */
        const variableResult = await pool.query('SELECT id FROM VariableTable WHERE Name = $1', [variable]);
        if (variableResult && variableResult.rows.length > 0) {
          variableId = variableResult.rows[0].id;
        } else {
          const insertVariableResult = await pool.query('INSERT INTO VariableTable (Name) VALUES ($1) RETURNING id', [variable]);
          variableId = insertVariableResult.rows[0].id;
        }
        // console.log("I ended from variable table with unitId: ", variableId);
        

        //** Inserting into to UnitTable */
        const unitResult = await pool.query('SELECT id FROM UnitTable WHERE Name = $1', [unit]);
        if (unitResult && unitResult.rows.length > 0) {
          unitId = unitResult.rows[0].id;
        } else {
          const insertUnitResult = await pool.query('INSERT INTO UnitTable (Name) VALUES ($1) RETURNING id', [unit]);
          unitId = insertUnitResult.rows[0].id;
        }
        // console.log("I ended from unit table with unitId: ", unitId);

        
        // Insert the data into the ResultsTable
        for (let i = 0; i < yearsArray.length; i++) {
          let year = yearsArray[i];
          let value = valueForEachYear[i];

          // take the values for each year and insert it on the ResultTable
          const insertResultTable = await pool.query(
            `INSERT INTO ResultsTable (Model_id, Scenario_id, Region_id, Unit_id, Variable_id, Year, Value ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             RETURNING id`, 
             [modelId, scenarioId, regionId, unitId, variableId, year, value]
          );
        }
      } catch (error) {
        console.log('Error inserting data', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
    }
    console.timeEnd("The whole transference of data to database")

    
    console.log("Data transfered to database, Extracted ", countRows-1, " from the Excel and inserted to the Database");
    completed_transference = true; // inform the /api/results end point that the transference ended.
    res.json({ message: 'File uploaded and processed successfully' });

  } catch (error) {
    console.log('Error processing the file', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }

  
})


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


//  Start the server by running: node server.js 
// the results will be displayed in the localhost:3000/api/results 

