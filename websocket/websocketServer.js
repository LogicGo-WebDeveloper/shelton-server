import { WebSocketServer } from 'ws';
import sportWebsocketService from './service.js';
import { convertSportListToArray, filterLiveMatchData, filterPlayerData } from './utils.js';

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.error('Invalid JSON:', error);
        ws.send(JSON.stringify({ message: 'Invalid JSON format', body: null, status: false }));
        return;
      }
      switch (data.action) {
        case "liveMatches":
          const liveMatches = await sportWebsocketService.getAllLiveMatches(data.sport);
          const filteredLiveMatches = liveMatches.events.map(filterLiveMatchData);
          ws.send(JSON.stringify({ "message": "Live matches fetched successfully", actionType: data.action, body: filteredLiveMatches, status: true }));
        break;
        case "sportList":
          const sportList = await sportWebsocketService.getSportList(19800);
          let filteredSportList = convertSportListToArray(sportList);
          ws.send(JSON.stringify({ "message": "Sport list fetched successfully", actionType: data.action, body: filteredSportList, status: true }));
        break;
        case "liveMatch":
          const liveMatch = await sportWebsocketService.getLiveMatch(data.matchId);
          const filteredLiveMatch = filterLiveMatchData(liveMatch.event);

          ws.send(JSON.stringify({ "message": "Live match fetched successfully", actionType: data.action, body: filteredLiveMatch, status: true }));
        break;
        case "scorecard":
          const scorecard = await sportWebsocketService.getScorecard(data.matchId);
          ws.send(JSON.stringify({ "message": "Scorecard fetched successfully", actionType: data.action, body: scorecard.innings, status: true }));
        break;
        case "squad":
          const squad = await sportWebsocketService.getSquad(data.matchId);
          const filteredSquad = {
            home: {
              players: filterPlayerData(squad.home.players),
              supportStaff: squad.home.supportStaff
            },
            away: {
              players: filterPlayerData(squad.away.players),
              supportStaff: squad.away.supportStaff
            }
          };
          ws.send(JSON.stringify({ "message": "Squad fetched successfully", actionType: data.action, body: filteredSquad, status: true }));
        break;
        case "overs":
          const overs = await sportWebsocketService.getOvers(data.matchId);
          ws.send(JSON.stringify({ "message": "Overs fetched successfully", actionType: data.action, body: overs?.incidents, status: true }));
        break;
        case "matches":
          const matches = await sportWebsocketService.getMatches(data.customId);
          ws.send(JSON.stringify({ "message": "Matches fetched successfully", actionType: data.action, body: matches?.events, status: true }));
        break;
        case "votes":
          const votes = await sportWebsocketService.getVotes(data.matchId);
          ws.send(JSON.stringify({ "message": "Votes fetched successfully", actionType: data.action, body: votes, status: true }));
        break;
        // case "standings":
        //   const standings = await sportWebsocketService.getStandings(data.matchId);
        //   ws.send(JSON.stringify({ "message": "Standings fetched successfully", actionType: data.action, body: standings, status: true }));
        // break;
      }
    });
  });
}

export default setupWebSocket;
