-- CREATE Model Table
DROP TABLE IF EXISTS ModelTable;
CREATE TABLE ModelTable (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- CREATE Scenario Table
DROP TABLE IF EXISTS ScenarioTable;
CREATE TABLE ScenarioTable (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- CREATE Region Table
DROP TABLE IF EXISTS RegionTable;
CREATE TABLE RegionTable (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- CREATE Unit Table
DROP TABLE IF EXISTS UnitTable;
CREATE TABLE UnitTable (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- CREATE Variable Table
DROP TABLE IF EXISTS VariableTable;
CREATE TABLE VariableTable (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL
);

-- CREATE Result Table
DROP TABLE IF EXISTS ResultsTable;
CREATE TABLE ResultsTable (
  id SERIAL PRIMARY KEY,
  Model_id INT REFERENCES ModelTable(id),
  Scenario_id INT REFERENCES ScenarioTable(id),
  Region_id INT REFERENCES RegionTable(id),
  Unit_id INT REFERENCES UnitTable(id),
  Variable_id INT REFERENCES VariableTable(id),
  Year INTEGER,
  Value FLOAT
);
