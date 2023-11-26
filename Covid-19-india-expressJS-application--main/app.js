const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (error) {
    console.log(`Data base error is ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// API 1
//Returns a list of all states in the state table

const getStateTable = (s) => {
  return {
    stateId: s.state_id,
    stateName: s.state_name,
    population: s.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
        *
    FROM
        state`;
  const state = await db.all(getStatesQuery);
  response.send(state.map((s) => getStateTable(s)));
});

//API 2
//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
        *
    FROM
        state
    WHERE
        state_id = ${stateId};`;
  const s = await db.get(getStateQuery);
  response.send(getStateTable(s));
});

//API 3
//Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `
    INSERT INTO
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES
        ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrictQueryResponse = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
//Returns a district based on the district ID

const getDistrictTable = (d) => {
  return {
    districtId: d.district_id,
    districtName: d.district_name,
    stateId: d.state_id,
    cases: d.cases,
    cured: d.cured,
    active: d.active,
    deaths: d.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
        *
    FROM
        district
    WHERE
        district_id = ${districtId};`;
  const d = await db.get(getDistrictQuery);
  response.send(getDistrictTable(d));
});

//API 5
//Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE
        district
    SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE
        district_id = ${districtId};
    `;
  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
        sum(cases) as totalCases,
        sum(cured) as totalCured,
        sum(active) as totalActive,
        sum(deaths) as totalDeaths
    FROM
        district
    WHERE
        state_id = ${stateId};`;

  const getStatsQueryResponse = await db.get(getStatsQuery);
  response.send(getStatsQueryResponse);
});

//API 8
//Returns an object containing the state name of a district based on the district ID

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `select state_id from district where district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
