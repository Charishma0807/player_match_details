const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB error: ${error.message}`);
  }
};

initializeDbAndServer();

const convertPlayerDatabaseObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDatabaseObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
        *
    FROM 
        player_details;
    `;
  const playerArray = await database.all(getPlayerQuery);
  response.send(
    playerArray.map((eachPlayer) =>
      convertPlayerDatabaseObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};
    `;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerDatabaseObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;

  const updatePlayersDetails = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;

  await database.run(updatePlayersDetails);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetailsQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId}
    `;
  const matchDetails = await database.get(matchDetailsQuery);
  response.send(convertMatchDatabaseObjectToResponseObject(matchDetails));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN match_details
    WHERE player_id = ${playerId};
    `;
  const playerMatches = await database.all(getPlayerDetailsQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDatabaseObjectToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};
    `;
  const playersArray = await database.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDatabaseObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};
    `;
  const playerMatchDetails = await database.get(getMatchPlayerQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
