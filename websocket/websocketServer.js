import { WebSocketServer } from "ws";
import sportWebsocketService from "./service.js";
import service from "../features/tournament/service.js";
import {
  convertSportListToArray,
  filterLiveMatchData,
  filterPlayerData,
  filterStandingsData,
  filteredOversData,
  fractionalOddsToDecimal,
} from "./utils.js";
import helper from "../helper/common.js";
import config from "../config/config.js";

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      let data;
      try {
        data = JSON.parse(message);
      } catch (error) {
        console.error("Invalid JSON:", error);
        ws.send(
          JSON.stringify({
            message: "Invalid JSON format",
            body: null,
            status: false,
          })
        );
        return;
      }
      switch (data.action) {
        case "liveMatches":
          try {
            const liveMatches = await sportWebsocketService.getAllLiveMatches(
              data.sport
            );
            for (const event of liveMatches.events) {
              const folderName = "team";
              const tournamentFolderName = "tournaments";
              const countryFolderName = "country";

              let homeImageUrl;
              let awayImageUrl;
              let tournamentImageUrl;
              let countryImageUrl;

              let uniqueTournamentId = event.tournament?.uniqueTournament?.id;
              let alpha2 = event.tournament?.category?.alpha2 || undefined;
              const flag = event.tournament?.category?.flag || undefined;
              const identifier = (alpha2 || flag).toLowerCase();

              const home_image = await helper.getTeamImages(event.homeTeam.id);
              const away_image = await helper.getTeamImages(event.awayTeam.id);
              const tournament_image = await helper.getTournamentImage(
                uniqueTournamentId
              );

              if (home_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${event.homeTeam.id}/image`,
                  folderName,
                  event.homeTeam.id
                );
                homeImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${event.homeTeam.id}`;
              } else {
                homeImageUrl = "";
              }

              if (away_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${event.awayTeam.id}/image`,
                  folderName,
                  event.awayTeam.id
                );
                awayImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${event.awayTeam.id}`;
              } else {
                awayImageUrl = "";
              }

              if (tournament_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/unique-tournament/${uniqueTournamentId}/image`,
                  tournamentFolderName,
                  uniqueTournamentId
                );
                tournamentImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${tournamentFolderName}/${uniqueTournamentId}`;
              } else {
                tournamentImageUrl = "";
              }

              if (identifier) {
                const image = await helper.getFlagsOfCountry(identifier);
                if (image) {
                  await helper.uploadImageInS3Bucket(
                    `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/static/images/flags/${identifier}.png`,
                    countryFolderName,
                    identifier
                  );
                  countryImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${countryFolderName}/${identifier}`;
                } else {
                  countryImageUrl = "";
                }
              }

              event.homeTeam.image = homeImageUrl;
              event.awayTeam.image = awayImageUrl;
              event.tournament.image = tournamentImageUrl;
              event.tournament.category.image = countryImageUrl;
            }
            const filteredLiveMatches =
              liveMatches.events.map(filterLiveMatchData);
            ws.send(
              JSON.stringify({
                message: "Live matches fetched successfully",
                actionType: data.action,
                body: filteredLiveMatches,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "No live matches found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "sportList":
          try {
            const sportList = await sportWebsocketService.getSportList(19800);
            let filteredSportList = convertSportListToArray(sportList);
            ws.send(
              JSON.stringify({
                message: "Sport list fetched successfully",
                actionType: data.action,
                body: filteredSportList,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "No sport list found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "liveMatch":
          try {
            const liveMatch = await sportWebsocketService.getLiveMatch(
              data.matchId
            );
            let homeId = liveMatch.event.homeTeam.id;
            let awayId = liveMatch.event.awayTeam.id;
            let uniqueTournamentId =
              liveMatch.event.tournament?.uniqueTournament?.id;
            let alpha2 =
              liveMatch.event.tournament?.category?.alpha2 || undefined;
            const flag =
              liveMatch.event.tournament?.category?.flag || undefined;
            const identifier = (alpha2 || flag).toLowerCase();

            const home_image = await helper.getTeamImages(homeId);
            const away_image = await helper.getTeamImages(awayId);
            const tournament_image = await helper.getTournamentImage(
              uniqueTournamentId
            );

            let homeImageUrl;
            let awayImageUrl;
            let tournamentImageUrl;
            let countryImageUrl;

            const folderName = "team";
            const tournamentFolderName = "tournaments";
            const countryFolderName = "country";

            if (home_image) {
              await helper.uploadImageInS3Bucket(
                `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${homeId}/image`,
                folderName,
                homeId
              );
              homeImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${homeId}`;
            } else {
              homeImageUrl = "";
            }

            if (away_image) {
              await helper.uploadImageInS3Bucket(
                `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${awayId}/image`,
                folderName,
                awayId
              );
              awayImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${awayId}`;
            } else {
              awayImageUrl = "";
            }

            if (tournament_image) {
              await helper.uploadImageInS3Bucket(
                `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/unique-tournament/${uniqueTournamentId}/image`,
                tournamentFolderName,
                uniqueTournamentId
              );
              tournamentImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${tournamentFolderName}/${uniqueTournamentId}`;
            } else {
              tournamentImageUrl = "";
            }

            if (identifier) {
              const image = await helper.getFlagsOfCountry(identifier);
              if (image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/static/images/flags/${identifier}.png`,
                  countryFolderName,
                  identifier
                );
                countryImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${countryFolderName}/${identifier}`;
              } else {
                countryImageUrl = "";
              }
            }

            liveMatch.event.homeTeam.image = homeImageUrl;
            liveMatch.event.awayTeam.image = awayImageUrl;
            liveMatch.event.tournament.image = tournamentImageUrl;
            liveMatch.event.tournament.category.image = countryImageUrl;

            const filteredLiveMatch = filterLiveMatchData(liveMatch.event);
            if (filteredLiveMatch?.status?.type === "finished") {
              ws.send(
                JSON.stringify({
                  message: "Match has been finished",
                  actionType: data.action,
                  body: null,
                  status: true,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Live match fetched successfully",
                  actionType: data.action,
                  body: filteredLiveMatch,
                  status: true,
                })
              );
            }
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Match not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "scorecard":
          try {
            const scorecard = await sportWebsocketService.getScorecard(
              data.matchId
            );
            ws.send(
              JSON.stringify({
                message: "Scorecard fetched successfully",
                actionType: data.action,
                body: scorecard.innings,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Scorecard not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "squad":
          try {
            const squad = await sportWebsocketService.getSquad(data.matchId);
            for (const player of squad.home.players) {
              const image = await helper.getPlayerImage(player.player.id);
              if (image) {
                const folderName = "player";
                helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/player/${player.player.id}/image`,
                  folderName,
                  player.player.id
                );
                player.player.image = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${player.player.id}`;
              } else {
                player.player.image = "";
              }
            }

            for (const player of squad.away.players) {
              const image = await helper.getPlayerImage(player.player.id);
              if (image) {
                const folderName = "player";
                helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/player/${player.player.id}/image`,
                  folderName,
                  player.player.id
                );
                player.player.image = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${player.player.id}`;
              } else {
                player.player.image = "";
              }
            }

            const filteredSquad = {
              home: {
                players: filterPlayerData(squad.home.players),
                supportStaff: squad.home.supportStaff,
              },
              away: {
                players: filterPlayerData(squad.away.players),
                supportStaff: squad.away.supportStaff,
              },
            };
            ws.send(
              JSON.stringify({
                message: "Squad fetched successfully",
                actionType: data.action,
                body: filteredSquad,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Squad not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "overs":
          try {
            const overs = await sportWebsocketService.getOvers(data.matchId);
            const filterHomeTeam = overs.incidents?.filter(
              (incident) =>
                Number(incident.battingTeamId) === Number(data.homeTeamId)
            );
            const filterAwayTeam = overs.incidents?.filter(
              (incident) =>
                Number(incident.battingTeamId) === Number(data.awayTeamId)
            );
            const filteredOvers = {
              homeTeam: {
                data: await filteredOversData(filterHomeTeam),
                teamId: data.homeTeamId,
              },
              awayTeam: {
                data: await filteredOversData(filterAwayTeam),
                teamId: data.awayTeamId,
              },
            };
            ws.send(
              JSON.stringify({
                message: "Overs fetched successfully",
                actionType: data.action,
                body: filteredOvers,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Overs not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "matches":
          try {
            const matches = await sportWebsocketService.getMatches(
              data.customId
            );
            for (const event of matches.events) {
              const folderName = "team";
              const tournamentFolderName = "tournaments";
              const countryFolderName = "country";

              let homeImageUrl;
              let awayImageUrl;
              let tournamentImageUrl;
              let countryImageUrl;

              let uniqueTournamentId = event.tournament?.uniqueTournament?.id;
              let alpha2 = event.tournament?.category?.alpha2 || undefined;
              const flag = event.tournament?.category?.flag || undefined;
              const identifier = (alpha2 || flag).toLowerCase();

              const home_image = await helper.getTeamImages(event.homeTeam.id);
              const away_image = await helper.getTeamImages(event.awayTeam.id);
              const tournament_image = await helper.getTournamentImage(
                uniqueTournamentId
              );

              if (home_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${event.homeTeam.id}/image`,
                  folderName,
                  event.homeTeam.id
                );
                homeImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${event.homeTeam.id}`;
              } else {
                homeImageUrl = "";
              }

              if (away_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/team/${event.awayTeam.id}/image`,
                  folderName,
                  event.awayTeam.id
                );
                awayImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${event.awayTeam.id}`;
              } else {
                awayImageUrl = "";
              }

              if (tournament_image) {
                await helper.uploadImageInS3Bucket(
                  `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/unique-tournament/${uniqueTournamentId}/image`,
                  tournamentFolderName,
                  uniqueTournamentId
                );
                tournamentImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${tournamentFolderName}/${uniqueTournamentId}`;
              } else {
                tournamentImageUrl = "";
              }

              if (identifier) {
                const image = await helper.getFlagsOfCountry(identifier);
                if (image) {
                  await helper.uploadImageInS3Bucket(
                    `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/static/images/flags/${identifier}.png`,
                    countryFolderName,
                    identifier
                  );
                  countryImageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${countryFolderName}/${identifier}`;
                } else {
                  countryImageUrl = "";
                }
              }

              event.homeTeam.image = homeImageUrl;
              event.awayTeam.image = awayImageUrl;
              event.tournament.image = tournamentImageUrl;
              event.tournament.category.image = countryImageUrl;
            }

            const filteredMatches = matches.events.map(filterLiveMatchData);
            ws.send(
              JSON.stringify({
                message: "Matches fetched successfully",
                actionType: data.action,
                body: filteredMatches,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Matches not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "votes":
          try {
            const votes = await sportWebsocketService.getVotes(data.matchId);
            ws.send(
              JSON.stringify({
                message: "Votes fetched successfully",
                actionType: data.action,
                body: votes?.vote,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Votes not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "standings":
          try {
            const standingsData = await service.getSeasonStandingsByTeams(
              data.tournamentId,
              data.seasonId
            );
            const filteredStandings = filterStandingsData(
              standingsData.standings[0]
            );
            ws.send(
              JSON.stringify({
                message: "Standings fetched successfully",
                actionType: data.action,
                body: filteredStandings,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Standings not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "matchOdds":
          try {
            const matchOdds = await sportWebsocketService.getMatchOdds(
              data.matchId
            );
            const filteredMatchOdds = matchOdds.markets.map((market) => ({
              marketName: market.marketName,
              isLive: market.isLive,
              id: market.id,
              choices: market.choices.map((choice) => ({
                name: choice.name,
                odds: fractionalOddsToDecimal(choice.fractionalValue).toFixed(
                  2
                ),
              })),
            }));
            ws.send(
              JSON.stringify({
                message: "Match odds fetched successfully",
                actionType: data.action,
                body: filteredMatchOdds,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Match odds not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "pregameForm":
          try {
            const pregameForm = await sportWebsocketService.getPregameForm(
              data.matchId
            );
            ws.send(
              JSON.stringify({
                message: "Pregame form fetched successfully",
                actionType: data.action,
                body: pregameForm,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "Pregame form not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
        case "h2h":
          try {
            const h2h = await sportWebsocketService.getMatchH2H(data.matchId);
            ws.send(
              JSON.stringify({
                message: "h2h fetched successfully",
                actionType: data.action,
                body: h2h?.teamDuel,
                status: true,
              })
            );
          } catch (error) {
            if (error?.response?.status === 404) {
              ws.send(
                JSON.stringify({
                  message: "h2h not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            } else {
              ws.send(
                JSON.stringify({
                  message: "Something went wrong",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
            }
            return;
          }
          break;
      }
    });
  });
};

export default setupWebSocket;
