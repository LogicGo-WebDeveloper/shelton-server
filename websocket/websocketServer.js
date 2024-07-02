import { WebSocketServer } from 'ws';
import sportWebsocketService from './service.js';
import { convertSportListToArray, filterLiveMatchData } from './utils.js';

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
          ws.send(JSON.stringify({ "message": "Live matches fetched successfully", body: filteredLiveMatches, status: true }));
        break;
        case "sportList":
          const sportList = await sportWebsocketService.getSportList(19800);
          let filteredSportList = convertSportListToArray(sportList);
          ws.send(JSON.stringify({ "message": "Sport list fetched successfully", body: filteredSportList, status: true }));
        break;
        case "liveMatch":
          const liveMatch = await sportWebsocketService.getLiveMatch(data.matchId);
          ws.send(JSON.stringify({ "message": "Live match fetched successfully", body: liveMatch.event, status: true }));
        break;
      case "scorecard":
          const scorecard = await sportWebsocketService.getScorecard(data.matchId);
          ws.send(JSON.stringify({ "message": "Scorecard fetched successfully", body: scorecard, status: true }));
        break;
      }
    });
  });
}

export default setupWebSocket;
