import { WebSocketServer } from 'ws';
import sportWebsocketService from './service.js';
import { convertSportListToArray, filterLiveMatchData } from './utils.js';

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      let messageObj = JSON.parse(message);
      switch (messageObj.action) {
        case "liveMatches":
          const liveMatches = await sportWebsocketService.getAllLiveMatches(messageObj.sport);
          const filteredLiveMatches = liveMatches.events.map(filterLiveMatchData);
          ws.send(JSON.stringify({ "action": messageObj.action, "data": filteredLiveMatches }));
        break;
        case "sportList":
          const sportList = await sportWebsocketService.getSportList(19800);
          let filteredSportList = convertSportListToArray(sportList);
          ws.send(JSON.stringify({ "action": messageObj.action, "data": filteredSportList }));
        break;
      }
    });
  });
}

export default setupWebSocket;
