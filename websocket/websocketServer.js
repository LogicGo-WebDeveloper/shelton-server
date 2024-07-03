import { WebSocketServer } from 'ws';
import sportWebsocketService from './service.js';
import service from "../features/tournament/service.js"
import { convertSportListToArray, filterLiveMatchData, filterPlayerData, filterStandingsData } from './utils.js';

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
          try {
            const liveMatches = await sportWebsocketService.getAllLiveMatches(data.sport);
            const filteredLiveMatches = liveMatches.events.map(filterLiveMatchData);
            ws.send(JSON.stringify({ "message": "Live matches fetched successfully", actionType: data.action, body: filteredLiveMatches, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){  
              ws.send(JSON.stringify({ "message": "No live matches found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "sportList":
          try {
            const sportList = await sportWebsocketService.getSportList(19800);
            let filteredSportList = convertSportListToArray(sportList);
            ws.send(JSON.stringify({ "message": "Sport list fetched successfully", actionType: data.action, body: filteredSportList, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "No sport list found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "liveMatch":
          try {
            const liveMatch = await sportWebsocketService.getLiveMatch(data.matchId);
            const filteredLiveMatch = filterLiveMatchData(liveMatch.event);
            if(filteredLiveMatch?.status?.type === "finished"){
              ws.send(JSON.stringify({ "message": "Match has been finished", actionType: data.action, body: null, status: true }));
            } else {
              ws.send(JSON.stringify({ "message": "Live match fetched successfully", actionType: data.action, body: filteredLiveMatch, status: true }));
            }
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Match not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "scorecard":
          try {
            const scorecard = await sportWebsocketService.getScorecard(data.matchId);
            ws.send(JSON.stringify({ "message": "Scorecard fetched successfully", actionType: data.action, body: scorecard.innings, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Scorecard not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "squad":
          try {
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
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Squad not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "overs":
          try {
            const overs = await sportWebsocketService.getOvers(data.matchId);
            ws.send(JSON.stringify({ "message": "Overs fetched successfully", actionType: data.action, body: overs?.incidents, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Overs not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "matches":
          try {
            const matches = await sportWebsocketService.getMatches(data.customId);
            const filteredMatches = matches.events.map(filterLiveMatchData);
            ws.send(JSON.stringify({ "message": "Matches fetched successfully", actionType: data.action, body: filteredMatches, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Matches not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "votes":
          try {
            const votes = await sportWebsocketService.getVotes(data.matchId);
            ws.send(JSON.stringify({ "message": "Votes fetched successfully", actionType: data.action, body: votes, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Votes not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
        case "standings":
          try {
            const standingsData = await service.getSeasonStandingsByTeams(data.tournamentId, data.seasonId);
            const filteredStandings = filterStandingsData(standingsData.standings[0]);

            // const filteredStandings = standingsData.standings[0].rows.map(row => ({
            //   team: {
            //     name: row.team.name,
            //     slug: row.team.slug,
            //     shortName: row.team.shortName,
            //     userCount: row.team.userCount,
            //     nameCode: row.team.nameCode,
            //     national: row.team.national,
            //     type: row.team.type,
            //     id: row.team.id
            //   },
            //   position: row.position,
            //   matches: row.matches,
            //   wins: row.wins,
            //   noResult: row.noResult,
            //   netRunRate: row.netRunRate,
            //   id: row.id,
            //   losses: row.losses,
            //   draws: row.draws,
            //   points: row.points
            // }));
            ws.send(JSON.stringify({ "message": "Standings fetched successfully", actionType: data.action, body: filteredStandings, status: true }));
          } catch (error) {
            if(error?.response?.status === 404){
              ws.send(JSON.stringify({ "message": "Standings not found", actionType: data.action, body: null, status: false }));
            } else {
              ws.send(JSON.stringify({ "message": "Something went wrong", actionType: data.action, body: null, status: false }));
            }
            return;
          }
        break;
      }
    });
  });
}

export default setupWebSocket;
