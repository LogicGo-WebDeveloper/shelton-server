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
import CustomPlayerOvers from "../cricket-custom-module/models/playersOvers.models.js";
import CustomMatchScorecard from "../cricket-custom-module/models/matchScorecard.models.js";
import CustomMatch from "../cricket-custom-module/models/match.models.js";
import { CustomCityList, CustomMatchOfficial } from "../cricket-custom-module/models/common.models.js";
import CustomPlayers from "../cricket-custom-module/models/player.models.js";
import CustomTeam from "../cricket-custom-module/models/team.models.js";

const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    const validateField = (field, value, type) => {
      if (typeof value !== type) {
        return `Invalid data format for ${field}`;
      }
      return null;
    };

    ws.on("message", async (message) => {
      const messageString = message.toString();
      let data;
      try {
        data = JSON.parse(messageString);
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
        case "cricketController":
          try {
            const { matchId, batters, bowlers, teamRuns } = data;
            const match = await CustomMatch.findOne({ _id: matchId });

            //for update match scorecard
            if (!match) {
              ws.send(
                JSON.stringify({
                  message: "Match not found",
                  actionType: data.action,
                  body: null,
                  status: true,
                })
              );
              return;
            }

            // Validation for batters
            const batterErrors = [
              validateField("batters.balls", batters.balls, "boolean"),
              validateField("batters.fours", batters.fours, "boolean"),
              validateField("batters.sixes", batters.sixes, "boolean"),
            ].filter((error) => error !== null);

            if (batterErrors.length > 0) {
              ws.send(
                JSON.stringify({
                  message: batterErrors.join(", "),
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            // Validation for bowlers
            const bowlerErrors = [
              validateField("bowlers.balls", bowlers.balls, "boolean"),
              validateField("bowlers.maidens", bowlers.maidens, "boolean"),
              validateField("bowlers.runs", bowlers.runs, "number"),
              validateField("bowlers.wickets", bowlers.wickets, "boolean"),
              validateField("bowlers.noBalls", bowlers.noBalls, "boolean"),
              validateField("bowlers.wides", bowlers.wides, "boolean"),
            ].filter((error) => error !== null);

            if (bowlerErrors.length > 0) {
              ws.send(
                JSON.stringify({
                  message: bowlerErrors.join(", "),
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            // Validation for teamRuns
            const teamRunsErrors = [
              validateField("teamRuns.bye", teamRuns.bye, "boolean"),
              validateField("teamRuns.legBye", teamRuns.legBye, "boolean"),
              validateField("teamRuns.runs", teamRuns.runs, "number"),
            ].filter((error) => error !== null);

            if (teamRunsErrors.length > 0) {
              ws.send(
                JSON.stringify({
                  message: teamRunsErrors.join(", "),
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            const existingScorecard = await CustomMatchScorecard.findOne({
              matchId,
            });

            if (!existingScorecard) {
              ws.send(
                JSON.stringify({
                  message: "Scorecard not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            const battingTeamKey =
              existingScorecard.scorecard.homeTeam.players.some(
                (player) => player.id.toString() === batters.playerId
              )
                ? "homeTeam"
                : "awayTeam";
            const bowlingTeamKey =
              battingTeamKey === "homeTeam" ? "awayTeam" : "homeTeam";

            const batterIndex = existingScorecard.scorecard[
              battingTeamKey
            ].players.findIndex(
              (player) => player.id.toString() === batters.playerId
            );

            if (batterIndex !== -1) {
              const player =
                existingScorecard.scorecard[battingTeamKey].players[
                  batterIndex
                ];
              if (!teamRuns.bye && !teamRuns.legBye) {
                player.runs = (player.runs || 0) + batters.runs;
                player.balls = (player.balls || 0) + (batters.balls ? 1 : 0);
                player.fours = (player.fours || 0) + (batters.fours ? 1 : 0);
                player.sixes = (player.sixes || 0) + (batters.sixes ? 1 : 0);
              }
            }

            const bowlerIndex = existingScorecard.scorecard[
              bowlingTeamKey
            ].players.findIndex(
              (player) => player.id.toString() === bowlers.playerId
            );

            const getDecimalPart = (num) => {
              const parts = num.toString().split(".");
              return parts.length > 1 ? parseInt(parts[1], 10) : 0;
            };

            if (bowlerIndex !== -1) {
              const player =
                existingScorecard.scorecard[bowlingTeamKey].players[
                  bowlerIndex
                ];
              const currentOvers = player.overs || 0;
              const ballsBowled = getDecimalPart(currentOvers);

              if (bowlers.balls) {
                const newBallsBowled = ballsBowled + 1;
                if (newBallsBowled >= 6) {
                  player.overs = Math.floor(currentOvers) + 1;
                } else {
                  player.overs = Math.floor(currentOvers) + newBallsBowled / 10;
                }
              }
              player.maidens =
                (player.maidens || 0) + (bowlers.maidens ? 1 : 0);
              player.runs = (player.runs || 0) + bowlers.runs;
              player.wickets =
                (player.wickets || 0) + (bowlers.wickets ? 1 : 0);
              player.noBalls =
                (player.noBalls || 0) + (bowlers.noBalls ? 1 : 0);
              player.wides = (player.wides || 0) + (bowlers.wides ? 1 : 0);
            }

            await existingScorecard.save();

            const calculateAndUpdateTeamScores = async (teamKey) => {
              const teamPlayers = existingScorecard.scorecard[teamKey].players;
              const totalRuns = teamPlayers.reduce((acc, batters) => {
                if (teamRuns.bye || teamRuns.legBye) {
                  return acc + (teamRuns.runs || 0);
                } else {
                  return acc + (batters.runs || 0);
                }
              }, 0);
              const totalOvers = teamPlayers.reduce(
                (acc, player) => acc + (player.overs || 0),
                0
              );
              const totalWickets = teamPlayers.reduce(
                (acc, player) => acc + (player.wickets || 0),
                0
              );
              if (totalOvers > match.noOfOvers) {
                return {
                  message: "Overs is greater than Matches overs.",
                  actionType: data.action,
                  body: null,
                  status: false,
                }
              } else {
                  console.log("match111111111", match)
                  console.log("match22222222", match.awayTeamScore)
                  console.log("match3333333", match.noOfOvers)

                  match[`${teamKey}Score`]['runs'] = totalRuns;
                  match[`${teamKey}Score`]['overs'] = totalOvers;
                  match[`${teamKey}Score`]['wickets'] = totalWickets;
                  return {
                    message: "score updated successfully",
                    actionType: data.action,
                    body: null,
                    status: true,
                  }
              }
            };

            const matchScore = await calculateAndUpdateTeamScores(battingTeamKey);
            if(matchScore.status) {
              await match.save();
            } else{
              ws.send(
                JSON.stringify(matchScore)
              );
            }
            // for using summary api
            if(matchScore.status) {
            const matchDetails = await CustomMatch.findById(matchId);
            const scorecardDetails = await CustomMatchScorecard.findOne({
              matchId,
            });

            const matchLiveScore = {
              homeTeam: matchDetails.homeTeamScore,
              awayTeam: matchDetails.awayTeamScore,
              noOfOvers: matchDetails.noOfOvers,
            };

            const playingBatters = scorecardDetails.scorecard[
              battingTeamKey
            ].players
              .filter((player) => player.status === "not_out")
              .slice(0, 2)
              .map((player) => ({
                name: player.name,
                runs: player.runs,
                balls: player.balls,
                id: player.id,
              }));

            ws.send(
              JSON.stringify({
                message: "score updated successfully",
                actionType: data.action,
                body: {
                  matchScore: matchLiveScore,
                  batters: playingBatters,
                },
                status: true,
                })
              );
            }
          } catch (error) {
            console.error("Failed to update score:", error.message);
            ws.send(
              JSON.stringify({
                message: "Something went wrong",
                actionType: data.action,
                body: null,
                status: false,
              })
            );
          }
        break;
        case "changeBatterStrike":
          try {
            const { matchId, batterId } = data;

            // Validate input
            if (!matchId || !batterId) {
              ws.send(
                JSON.stringify({
                  message: "Match ID and Batter ID are required",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Find the match scorecard
            const scorecard = await CustomMatchScorecard.findOne({ matchId });
            if (!scorecard) {
              ws.send(
                JSON.stringify({
                  message: "Scorecard not found",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Determine the batting team
            const battingTeamKey = scorecard.scorecard.homeTeam.players.some(player => player.status === 'not_out') ? 'homeTeam' : 'awayTeam';

            // Find the player to change strike
            const playerIndex = scorecard.scorecard[battingTeamKey].players.findIndex(player => player.id.toString() === batterId && player.status === 'not_out');
            if (playerIndex === -1) {
              ws.send(
                JSON.stringify({
                  message: "Batter not found or not currently batting",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Update the strike status
            scorecard.scorecard[battingTeamKey].players.forEach(player => {
              if (player.status === 'not_out') {
                player.activeStriker = false;
              }
            });
            scorecard.scorecard[battingTeamKey].players[playerIndex].activeStriker = true;

            // Save the updated scorecard
            await scorecard.save(); 

            // Get the active striker data
            const activeStriker = scorecard.scorecard[battingTeamKey].players[playerIndex];

            ws.send(
              JSON.stringify({
                message: "Batter strike changed successfully",
                actionType: data.action,
                status: true,
                data: activeStriker,
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                message: "Internal server error",
                actionType: data.action,
                status: false,
              })
            );
          }
        break;
        case "getMatchSummary":
          try {
            const { matchId } = data;
            const scorecard = await CustomMatchScorecard.findOne({ matchId });
            const match = await CustomMatch.findById(matchId);

            if (!scorecard) {
              ws.send(JSON.stringify({
                message: "Scorecard not found",
                actionType: data.action,
                body: null,
                status: false,
              }));
              return;
            }

            if (!match) {
              ws.send(JSON.stringify({
                message: "Match not found",
                actionType: data.action,
                body: null,
                status: false,
              }));
              return;
            }

            // Filter the players based on their status
            const battingTeamKey = scorecard.scorecard.homeTeam.players.some(
              (player) => player.status === "not_out"
            )
              ? "homeTeam"
              : "awayTeam";
            const bowlingTeamKey =
              battingTeamKey === "homeTeam" ? "awayTeam" : "homeTeam";

            const batters = scorecard.scorecard[battingTeamKey].players.filter(
              (player) => player.status === "not_out"
            );
            const bowlers = scorecard.scorecard[bowlingTeamKey].players.filter(
              (player) => player.activeBowler
            );

            // Function to get player image from the database
            const getPlayerImageFromDB = async (playerId) => {
              try {
                const player = await CustomPlayers.findById(playerId).select("image");
                return player?.image || "";
              } catch (error) {
                console.error(`Error fetching image for player ${playerId}:`, error);
                return "";
              }
            };

            // Function to get team details
            const getTeamDetails = async (teamId) => {
              try {
                const team = await CustomTeam.findById(teamId).select("teamName teamImage");
                return {
                  id: teamId,
                  name: team?.teamName || "",
                  image: team?.teamImage || "",
                };
              } catch (error) {
                console.error(`Error fetching details for team ${teamId}:`, error);
                return {
                  id: teamId,
                  name: "",
                  image: "",
                };
              }
            };

            const city = await CustomCityList.findById(match.city).select("city");

            // Fetch umpire names
            const umpires = await CustomMatchOfficial.find({ _id: { $in: match.umpires } }).select("name");

            // Fetch team data
            const homeTeam = await getTeamDetails(match.homeTeamId);
            homeTeam.score = match.homeTeamScore;

            const awayTeam = await getTeamDetails(match.awayTeamId);
            awayTeam.score = match.awayTeamScore;

            const responseData = {
              batters: await Promise.all(
                batters.map(async (player) => {
                  const image = await getPlayerImageFromDB(player.id);
                  return {
                    name: player.name,
                    runs: player.runs,
                    balls: player.balls,
                    fours: player.fours,
                    sixes: player.sixes,
                    id: player.id,
                    image: image,
                  };
                })
              ),
              bowlers: await Promise.all(
                bowlers.map(async (player) => {
                  const image = await getPlayerImageFromDB(player.id);
                  return {
                    name: player.name,
                    overs: player.overs,
                    maidens: player.maidens,
                    runs: player.runs,
                    wickets: player.wickets,
                    id: player.id,
                    image: image,
                  };
                })
              ),
              matchInfo: {
                location: city ? city.city : "",
                venue: match.ground,
                referee: umpires.map((umpire) => umpire.name).join(", "),
              },
              teams: {
                home: homeTeam,
                away: awayTeam,
              },
            };

            ws.send(JSON.stringify({
              message: "Summary fetched successfully",
              actionType: data.action,
              body: responseData,
              status: true,
            }));
          } catch (error) {
            console.error("Error fetching match summary:", error);
            ws.send(JSON.stringify({
              message: "Internal server error",
              actionType: data.action,
              body: null,
              status: false,
            }));
          }
        break;
      }
    });
  });
};

export default setupWebSocket;
