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
  handlePlayerOut,
} from "./utils.js";
import helper from "../helper/common.js";
import config from "../config/config.js";
import CustomMatchScorecard from "../cricket-custom-module/models/matchScorecard.models.js";
import CustomMatch from "../cricket-custom-module/models/match.models.js";
import {
  CustomCityList,
  CustomMatchOfficial,
} from "../cricket-custom-module/models/common.models.js";
import CustomPlayers from "../cricket-custom-module/models/player.models.js";
import CustomTeam from "../cricket-custom-module/models/team.models.js";
import enums from "../config/enum.js";
import CustomPlayerOvers from "../cricket-custom-module/models/playersOvers.models.js";
import { CustomBasketballBoxScore } from "../basketball-custom-module/models/basketball-boxscore.models.js";
import { validateObjectIds } from "../cricket-custom-module/utils/utils.js";
import CustomBasketballMatch from "../basketball-custom-module/models/basketball-match.models.js";

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
            const {
              matchId,
              batters,
              bowlers,
              teamRuns,
              // battingTeamId,
              incidents,
              ranges,
              isDeclared,
              isAllOut,
              outTypeId,
              fielderId,
            } = data;
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

            // Validation for End innings
            const inningsErrors = [
              validateField("isDeclared", isDeclared, "boolean"),
              validateField("isAllOut", isAllOut, "boolean"),
            ].filter((error) => error !== null);

            if (inningsErrors.length > 0) {
              ws.send(
                JSON.stringify({
                  message: inningsErrors.join(", "),
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            // Validation for power play
            const powerPlayErrors = [
              validateField("ranges", ranges, "string"),
            ].filter((error) => error !== null);

            if (powerPlayErrors.length > 0) {
              ws.send(
                JSON.stringify({
                  message: powerPlayErrors.join(", "),
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

            if (batters.isOut) {
              const result = await handlePlayerOut(
                {
                  batters,
                  bowlers,
                  outTypeId,
                  fielderId,
                },
                existingScorecard,
                ws
              );
              if (result) {
                await existingScorecard.save();
              }
            } else {
              if (batterIndex !== -1) {
                const player =
                  existingScorecard.scorecard[battingTeamKey].players[
                    batterIndex
                  ];
                if (!teamRuns.bye && !teamRuns.legBye && !bowlers.wides) {
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
                    player.overs =
                      Math.floor(currentOvers) + newBallsBowled / 10;
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
            }

            const calculateTotalOvers = (players) => {
              let totalBalls = 0;

              players.forEach((player) => {
                if (player.overs) {
                  const [wholeOvers, balls] = player.overs
                    .toString()
                    .split(".")
                    .map(Number);
                  totalBalls += wholeOvers * 6 + (balls || 0);
                }
              });

              const totalOvers =
                Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
              return totalOvers;
            };

            const calculateAndUpdateTeamScores = async (
              teamKey,
              bowlingTeamKey
            ) => {
              // const teamPlayers = existingScorecard.scorecard[teamKey].players;
              const bowlingTeamPlayers =
                existingScorecard.scorecard[bowlingTeamKey].players;

              let totalRuns = match[`${battingTeamKey}Score`]["runs"];
              if (teamRuns.bye || teamRuns.legBye) {
                totalRuns = totalRuns + (teamRuns.runs || 0);
              } else if (bowlers.wides) {
                totalRuns = totalRuns + (teamRuns.runs || 0);
              } else if (bowlers.noBalls) {
                totalRuns = totalRuns + (teamRuns.runs || 0);
              } else {
                totalRuns = totalRuns + (batters.runs || 0);
              }

              const totalOvers = calculateTotalOvers(bowlingTeamPlayers);
              const totalWickets = bowlingTeamPlayers.reduce(
                (acc, player) => acc + (player.wickets || 0),
                0
              );
              if (totalOvers > match.noOfOvers) {
                return {
                  message: "Overs is greater than Matches overs.",
                  actionType: data.action,
                  body: null,
                  status: false,
                };
              } else {
                match[`${teamKey}Score`]["runs"] = totalRuns;
                match[`${teamKey}Score`]["overs"] = totalOvers;
                match[`${teamKey}Score`]["wickets"] = totalWickets;
                return {
                  message: "score updated successfully",
                  actionType: data.action,
                  body: null,
                  status: true,
                };
              }
            };

            const matchScore = await calculateAndUpdateTeamScores(
              battingTeamKey,
              bowlingTeamKey
            );
            if (matchScore.status) {
              await match.save();
            } else {
              ws.send(JSON.stringify(matchScore));
            }

            // for using summary api
            if (matchScore.status) {
              // const matchDetails = await CustomMatch.findById(matchId);
              const scorecardDetails = await CustomMatchScorecard.findOne({
                matchId,
              });

              // console.log(batters.playerId);
              const playesImageData = await CustomPlayers.findOne({
                _id: batters.playerId,
              });

              const playingBatters = scorecardDetails.scorecard[
                battingTeamKey
              ].players

                .filter(
                  (player) =>
                    player.activeStriker === true || player.status === "not_out"
                )
                .map((player) => ({
                  name: player.name,
                  runs: player.runs,
                  balls: player.balls,
                  id: player.id,
                  image: playesImageData?.image,
                  activeStriker: player.activeStriker,
                }));

              const existingOvers = await CustomPlayerOvers.find({
                matchId: matchId,
              });

              let currentOvers = existingOvers[0]
                ? existingOvers[0]?.currentOvers
                : 1;

              let totalBalls = existingOvers[0]
                ? existingOvers[0]?.totalBalls
                : 0;

              if (bowlers.balls && bowlers.finished === false) {
                totalBalls += 1;

                const result = await CustomPlayerOvers.updateOne(
                  { matchId: matchId },
                  { $set: { totalBalls: totalBalls } }
                );
              }

              if (bowlers.balls == false && bowlers.finished === true) {
                try {
                  // Find the document and get the existing incidents array
                  const existingMatchOvers = await CustomPlayerOvers.findOne({
                    matchId: matchId,
                  });

                  if (
                    existingMatchOvers &&
                    Array.isArray(existingMatchOvers.data.incidents)
                  ) {
                    const incidents = existingMatchOvers.data.incidents;

                    // Update the isOvers field inside the data.incidents array
                    const updatedIncidents = incidents.map((incident) => {
                      return {
                        ...incident,
                        isOvers: false, // Update the isOvers field to false
                      };
                    });

                    // Update the document in the database
                    const result = await CustomPlayerOvers.updateOne(
                      { matchId: matchId },
                      {
                        $set: {
                          currentOvers: currentOvers,
                          totalBalls: 0, // Reset totalBalls to 1 or set the desired value
                          "data.incidents": updatedIncidents, // Update the incidents array with the modified data
                        },
                      }
                    );

                    console.log("Changes saved successfully:", result);
                  } else {
                  }
                } catch (error) {
                  console.error("Error updating document:", error);
                }
              }

              let allRuns;
              let TeamRun;

              if (
                (bowlers.noBalls == true && batters.runs) ||
                (batters.runs && bowlers.wides == true)
              ) {
                allRuns = batters.runs - 1;
              } else if (teamRuns.bye == true && batters.runs) {
                TeamRun = batters.runs - 1;
              } else if (teamRuns.legBye == true && batters.runs) {
                TeamRun = batters.runs - 1;
              }

              const matches = await CustomMatch.findOne({
                _id: matchId,
              });

              let newIncident = {
                playerScoreCardId: existingScorecard._id,
                battingPlayerId: batters.playerId,
                bowlerId: bowlers.playerId,
                balls: totalBalls,
                runs: bowlers.runs,
                overs_finished: bowlers.finished,
                noBall: bowlers.noBalls,
                wideBall: bowlers.wides,
                lbBall: teamRuns.legBye,
                byeBall: teamRuns.bye,
                isOut: bowlers.wickets,
                oversNumber: currentOvers,
                battingTeamId: existingScorecard.scorecard[battingTeamKey].id,
                isOvers: true,
              };

              // Find or create the document in CustomPlayerOvers
              const playerOvers = await CustomPlayerOvers.findOne({
                matchId: matchId,
                homeTeamId: matches.homeTeamId,
                awayTeamId: matches.awayTeamId,
              });

              if (playerOvers) {
                // Ensure data and incidents are initialized
                if (!playerOvers.data) {
                  playerOvers.data = {};
                }

                if (!Array.isArray(playerOvers.data.incidents)) {
                  playerOvers.data.incidents = [];
                }

                if (bowlers.balls == true && bowlers.finished == false) {
                  await CustomPlayerOvers.updateOne(
                    {
                      _id: playerOvers._id,
                    },
                    {
                      $push: { "data.incidents": newIncident },
                    }
                  );
                }

                await CustomPlayerOvers.updateOne(
                  {
                    _id: playerOvers._id,
                  },
                  {
                    $set: {
                      bowlerId: bowlers.playerId,
                    },
                  }
                );

                if (
                  (bowlers.balls == false && bowlers.wides) ||
                  bowlers.noBalls == true
                ) {
                  await CustomPlayerOvers.updateOne(
                    {
                      _id: playerOvers._id,
                    },
                    {
                      $push: { "data.incidents": newIncident },
                    }
                  );
                }
              } else {
                // Document does not exist: create a new one
                const alloversData = await CustomPlayerOvers.create({
                  matchId: matchId,
                  homeTeamId: matches.homeTeamId,
                  awayTeamId: matches.awayTeamId,
                  bowlerId: bowlers.playerId,
                  data: {
                    incidents: bowlers.balls == true ? [newIncident] : [],
                  },
                });
              }

              let isActive;
              if (ranges) {
                const [startOver, endOver] = ranges
                  .replace("to", "-")
                  .split("-")
                  .map(Number);

                const currentOver = match.noOfOvers;
                isActive = currentOver >= startOver && currentOver <= endOver;
                await CustomMatch.findByIdAndUpdate(
                  matchId,
                  {
                    $set: {
                      "powerPlays.ranges": ranges,
                      "powerPlays.isActive": isActive,
                    },
                  },
                  { new: true }
                );
              }

              if (isDeclared || isAllOut) {
                await CustomMatch.findByIdAndUpdate(
                  matchId,
                  {
                    $set: {
                      "endInnings.isDeclared": isDeclared,
                      "endInnings.isAllOut": isAllOut,
                    },
                  },
                  { new: true }
                );
              }

              const playerOversData = await CustomPlayerOvers.findOne({
                matchId: matchId,
                homeTeamId: matches.homeTeamId,
                awayTeamId: matches.awayTeamId,
              })
                .populate({
                  path: "homeTeamId",
                  model: "CustomTeam",
                  select: "teamName teamImage",
                })
                .populate({
                  path: "awayTeamId",
                  model: "CustomTeam",
                  select: "teamName teamImage",
                })
                .populate({
                  path: "bowlerId",
                  model: "CustomPlayers",
                  select: "playerName role image",
                  populate: {
                    path: "role", // This will populate the role field in CustomPlayers
                    model: "CustomPlayerRole",
                    select: "role", // Select fields from CustomPlayerRole
                  },
                });

              if (playerOversData && playerOversData.data.incidents) {
                playerOversData.data.incidents = playerOversData.data.incidents
                  .filter((incident) => incident.isOvers === true)
                  .reverse(); // Reverse the array to have the last record first
              }

              const matchLiveScore = {
                homeTeam: match.homeTeamScore,
                awayTeam: match.awayTeamScore,
                noOfOvers: match.noOfOvers,
              };

              ws.send(
                JSON.stringify({
                  message: "Score updated successfully.",
                  actionType: data.action,
                  body: {
                    matchScore: matchLiveScore,
                    batters: playingBatters,
                    playerOversData: playerOversData,
                    powerPlays: {
                      ranges: ranges ? ranges : null,
                      isActive: isActive,
                      message: isActive && ranges ? "Power play is active" : "",
                    },
                    endInnings: {
                      isDeclared: isDeclared ? isDeclared : false,
                      isAllOut: isAllOut ? isAllOut : false,
                    },
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
        case "undo":
          try {
            const { batterId, matchId, bowlerId } = data;

            const match = await CustomMatch.findOne({ _id: matchId });
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

            const requiredFields = [
              validateField("bowlerId", bowlerId, "string"),
              validateField("batterId", batterId, "string"),
              validateField("matchId", matchId, "string"),
            ].filter((error) => error !== null);

            if (requiredFields.length > 0) {
              ws.send(
                JSON.stringify({
                  message: requiredFields.join(", "),
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

            const existingMatchOvers = await CustomPlayerOvers.findOne({
              matchId,
            });

            if (!existingMatchOvers) {
              ws.send(
                JSON.stringify({
                  message: "Match overs not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            if (existingMatchOvers.data) {
              if (Array.isArray(existingMatchOvers.data.incidents)) {
                const incidents = existingMatchOvers.data.incidents;

                const lastIncidentRuns = incidents[incidents.length - 1].runs;

                const battingTeamKey =
                  existingScorecard.scorecard.homeTeam.players.some(
                    (player) => player.id.toString() === batterId
                  )
                    ? "homeTeam"
                    : "awayTeam";
                const bowlingTeamKey =
                  battingTeamKey === "homeTeam" ? "awayTeam" : "homeTeam";

                const batterIndex = existingScorecard.scorecard[
                  battingTeamKey
                ].players.findIndex(
                  (player) => player.id.toString() === batterId
                );

                if (batterIndex !== -1) {
                  const player =
                    existingScorecard.scorecard[battingTeamKey].players[
                      batterIndex
                    ];

                  player.runs =
                    player.runs > 0 ? player.runs - lastIncidentRuns : 0;
                  player.balls = player.balls > 0 ? player.balls - 1 : 0;
                  player.fours = player.fours > 0 ? player.fours - 1 : 0;
                  player.sixes = player.sixes > 0 ? player.sixes - 1 : 0;
                  player.outType = player.outType ? null : null;
                  player.wickets = player.wickets > 0 ? player.wickets - 1 : 0;

                  player.wicketByFielder = player.wicketByFielder ? null : null;
                  player.status =
                    player.status === enums.matchScorecardStatusEnum.not_out
                      ? enums.matchScorecardStatusEnum.yet_to_bat
                      : enums.matchScorecardStatusEnum.not_out;
                }

                const bowlerIndex = existingScorecard.scorecard[
                  bowlingTeamKey
                ].players.findIndex(
                  (player) => player.id.toString() === bowlerId
                );

                if (bowlerIndex !== -1) {
                  const player =
                    existingScorecard.scorecard[bowlingTeamKey].players[
                      bowlerIndex
                    ];

                  (player.overs =
                    player.overs > 0
                      ? Number((player.overs - 0.1).toFixed(1))
                      : 0),
                    (player.maidens =
                      player.maidens > 0 ? player.maidens - 1 : 0);
                  player.runs =
                    player.runs > 0 ? player.runs - lastIncidentRuns : 0;
                  player.wickets = player.wickets > 0 ? player.wickets - 1 : 0;
                  player.noBalls = player.noBalls > 0 ? player.noBalls - 1 : 0;
                  player.wides = player.wides > 0 ? player.wides - 1 : 0;
                  player.balls = player.balls > 0 ? player.balls - 1 : 0;
                  player.wicketByFielder = player.wicketByFielder ? null : null;
                  player.outType = player.outType ? null : null;
                  player.status =
                    player.status === enums.matchScorecardStatusEnum.not_out
                      ? enums.matchScorecardStatusEnum.yet_to_bat
                      : enums.matchScorecardStatusEnum.not_out;
                }

                await existingScorecard.save();

                incidents.pop();
                await CustomPlayerOvers.updateOne(
                  { _id: existingMatchOvers._id },
                  { $set: { "data.incidents": incidents } }
                );

                existingMatchOvers.totalBalls =
                  existingMatchOvers.totalBalls - 1;
                await existingMatchOvers.save();

                const playerImageData = await CustomPlayers.findOne({
                  _id: batterId,
                });

                const playingBatters = existingScorecard.scorecard[
                  battingTeamKey
                ].players
                  .filter(
                    (player) =>
                      player.activeStriker === true ||
                      player.status === "not_out"
                  )
                  .map((player) => ({
                    name: player.name,
                    runs: player.runs,
                    balls: player.balls,
                    id: player.id,
                    image: playerImageData?.image ? playerImageData?.image : "",
                    activeStriker: player.activeStriker,
                  }));

                const playerOversData = await CustomPlayerOvers.findOne({
                  matchId: matchId,
                  homeTeamId: match.homeTeamId,
                  awayTeamId: match.awayTeamId,
                })
                  .populate({
                    path: "homeTeamId",
                    model: "CustomTeam",
                    select: "teamName teamImage",
                  })
                  .populate({
                    path: "awayTeamId",
                    model: "CustomTeam",
                    select: "teamName teamImage",
                  })
                  .populate({
                    path: "bowlerId",
                    model: "CustomPlayers",
                    select: "playerName role image",
                    populate: {
                      path: "role",
                      model: "CustomPlayerRole",
                      select: "role",
                    },
                  });

                const bowlingTeamStats = existingScorecard.scorecard[
                  bowlingTeamKey
                ].players.reduce(
                  (acc, player) => {
                    acc.wickets += player.wickets || 0;
                    acc.overs += player.overs || 0;
                    return acc;
                  },
                  { wickets: 0, overs: 0 }
                );

                const battingTeamPlayers =
                  existingScorecard.scorecard[battingTeamKey].players;
                const battingTeamScore = battingTeamPlayers.reduce(
                  (acc, player) => {
                    acc.runs += player.runs || 0;
                    return acc;
                  },
                  {
                    runs: 0,
                    overs: bowlingTeamStats.overs,
                    wickets: bowlingTeamStats.wickets,
                  }
                );

                // Create update data object for the database
                const updateData = {
                  [`${battingTeamKey}Score.runs`]: battingTeamScore.runs,
                  [`${battingTeamKey}Score.overs`]: battingTeamScore.overs,
                  [`${battingTeamKey}Score.wickets`]: battingTeamScore.wickets,
                };

                await CustomMatch.updateOne(
                  { _id: matchId },
                  { $set: updateData }
                );

                const updatedMatch = await CustomMatch.findById(matchId);

                await updatedMatch.save();

                ws.send(
                  JSON.stringify({
                    message: "Action updated successfully.",
                    actionType: data.action,
                    body: {
                      matchScore: {
                        homeTeamScore: updatedMatch.homeTeamScore,
                        awayTeamScore: updatedMatch.awayTeamScore,
                        noOfOvers: updatedMatch.noOfOvers,
                      },
                      batters: playingBatters,
                      playerOversData,
                      powerPlay: {
                        ranges: updatedMatch.powerPlays.ranges,
                        isActive: updatedMatch.powerPlays.isActive,
                        message: "Action updated successfully.",
                      },
                      endInnings: {
                        isDeclared: updatedMatch.endInnings.isDeclared,
                        isAllOut: updatedMatch.endInnings.isAllOut,
                        message: "Action updated successfully.",
                      },
                    },
                    status: true,
                  })
                );
              }
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
            const battingTeamKey = scorecard.scorecard.homeTeam.players.some(
              (player) => player.status === "not_out"
            )
              ? "homeTeam"
              : "awayTeam";

            // Find the player to change strike
            const playerIndex = scorecard.scorecard[
              battingTeamKey
            ].players.findIndex(
              (player) =>
                player.id.toString() === batterId && player.status === "not_out"
            );
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
            scorecard.scorecard[battingTeamKey].players.forEach((player) => {
              if (player.status === "not_out") {
                player.activeStriker = false;
              }
            });
            scorecard.scorecard[battingTeamKey].players[
              playerIndex
            ].activeStriker = true;

            // Save the updated scorecard
            await scorecard.save();

            // Get the active striker data
            const activeStriker =
              scorecard.scorecard[battingTeamKey].players[playerIndex];

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

            if (!match) {
              ws.send(
                JSON.stringify({
                  message: "Match not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
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
                const player = await CustomPlayers.findById(playerId).select(
                  "image"
                );
                return player?.image || "";
              } catch (error) {
                console.error(
                  `Error fetching image for player ${playerId}:`,
                  error
                );
                return "";
              }
            };

            // Function to get team details
            const getTeamDetails = async (teamId) => {
              try {
                const team = await CustomTeam.findById(teamId).select(
                  "teamName teamImage"
                );
                return {
                  id: teamId,
                  name: team?.teamName || "",
                  image: team?.teamImage || "",
                };
              } catch (error) {
                console.error(
                  `Error fetching details for team ${teamId}:`,
                  error
                );
                return {
                  id: teamId,
                  name: "",
                  image: "",
                };
              }
            };

            const city = await CustomCityList.findById(match.city).select(
              "city"
            );

            // Fetch umpire names
            const umpires = await CustomMatchOfficial.find({
              _id: { $in: match.umpires },
            }).select("name");

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
                    activeStriker: player.activeStriker,
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
                tossResult: match.tossResult,
                dateTime: match.dateTime,
                status: match.status,
                matchStatus: match.matchStatus,
              },
              teams: {
                home: homeTeam,
                away: awayTeam,
              },
            };

            ws.send(
              JSON.stringify({
                message: "Summary fetched successfully",
                actionType: data.action,
                body: responseData,
                status: true,
              })
            );
          } catch (error) {
            console.error("Error fetching match summary:", error);
            ws.send(
              JSON.stringify({
                message: "Internal server error",
                actionType: data.action,
                body: null,
                status: false,
              })
            );
          }
          break;
        case "selectNextBatter":
          try {
            const { matchId, nextBatterId, activeStriker } = data;
            // Validate input
            if (
              !matchId ||
              !nextBatterId ||
              typeof activeStriker !== "boolean"
            ) {
              ws.send(
                JSON.stringify({
                  message:
                    "Match ID, Next Batter ID, and activeStriker (boolean) are required",
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

            // Check if match status is in_progress
            const match = await CustomMatch.findById(matchId);
            if (!match || match.status !== enums.matchStatusEnum.in_progress) {
              ws.send(
                JSON.stringify({
                  message: "Match is not in progress",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Determine the batting team
            const battingTeamKey = scorecard.scorecard.homeTeam.players.some(
              (player) => player.status === "not_out"
            )
              ? "homeTeam"
              : "awayTeam";

            // Find the player to update
            const playerIndex = scorecard.scorecard[
              battingTeamKey
            ].players.findIndex(
              (player) => player.id.toString() === nextBatterId
            );
            if (playerIndex === -1) {
              ws.send(
                JSON.stringify({
                  message: "Next batter not found",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Update the player's status and activeStriker
            scorecard.scorecard[battingTeamKey].players[playerIndex].status =
              "not_out";
            scorecard.scorecard[battingTeamKey].players[
              playerIndex
            ].activeStriker = activeStriker;

            // If activeStriker is true, set all other players' activeStriker to false
            if (activeStriker) {
              scorecard.scorecard[battingTeamKey].players.forEach(
                (player, index) => {
                  if (index !== playerIndex) {
                    player.activeStriker = false;
                  }
                }
              );
            }

            // Save the updated scorecard
            await scorecard.save();

            ws.send(
              JSON.stringify({
                message: "Next batter selected successfully",
                actionType: data.action,
                status: true,
                data: scorecard.scorecard[battingTeamKey].players[playerIndex],
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
        case "basketballBoxScore":
          try {
            const { matchId } = data;
            const boxScore = await CustomBasketballBoxScore.findOne({ matchId })
              .populate({
                path: "boxScore.homeTeam.teamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              })
              .populate({
                path: "boxScore.awayTeam.teamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              })
              .populate({
                path: "boxScore.homeTeam.players.playerId",
                model: "CustomBasketballPlayers",
                select: "playerName image role jerseyNumber",
              })
              .populate({
                path: "boxScore.awayTeam.players.playerId",
                model: "CustomBasketballPlayers",
                select: "playerName image role jerseyNumber",
              });

            if (!boxScore) {
              ws.send(
                JSON.stringify({
                  message: "Box score not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            const transformTeam = (team) => ({
              teamId: team.teamId._id,
              teamName: team.teamName,
              image: team.image,
              players: team.players.map((player) => ({
                playerId: player.playerId._id,
                name: player.name,
                image: player.image,
                role: player.role,
                jerseyNumber: player.jerseyNumber,
                isPlaying: player.isPlaying,
                points: player.points,
                rebounds: player.rebounds,
                assists: player.assists,
              })),
            });

            const transformedBoxScore = {
              matchId: boxScore.matchId,
              homeTeam: transformTeam(boxScore.boxScore.homeTeam),
              awayTeam: transformTeam(boxScore.boxScore.awayTeam),
            };

            ws.send(
              JSON.stringify({
                message: "Box score fetched successfully",
                actionType: data.action,
                body: transformedBoxScore,
                status: true,
              })
            );
          } catch (error) {
            console.error("Error fetching box score:", error);
            ws.send(
              JSON.stringify({
                message: "Internal server error",
                actionType: data.action,
                body: null,
                status: false,
              })
            );
          }
          break;
        case "basketballDetailMatch":
          try {
            const { matchId } = data;
            // Validate input
            if (!matchId) {
              ws.send(
                JSON.stringify({
                  message: "Match ID is required",
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Validate matchId format
            const validation = validateObjectIds({ matchId });
            if (!validation.isValid) {
              ws.send(
                JSON.stringify({
                  message: validation.message,
                  actionType: data.action,
                  status: false,
                })
              );
              return;
            }

            // Fetch match details
            const match = await CustomBasketballMatch.findById(
              matchId
            ).populate([
              {
                path: "homeTeamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              },
              {
                path: "awayTeamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              },
            ]);

            if (!match) {
              ws.send(
                JSON.stringify({
                  message: "Match not found",
                  actionType: data.action,
                  body: null,
                  status: false,
                })
              );
              return;
            }

            // Prepare match details
            const matchDetails = {
              homeTeam: {
                teamName: match.homeTeamId.teamName,
                teamImage: match.homeTeamId.teamImage,
                _id: match.homeTeamId._id,
              },
              awayTeam: {
                teamName: match.awayTeamId.teamName,
                teamImage: match.awayTeamId.teamImage,
                _id: match.awayTeamId._id,
              },
              homeTeamScore: match.homeTeamScore,
              awayTeamScore: match.awayTeamScore,
              status: match.status,
              location: match.location,
            };

            // Send response
            ws.send(
              JSON.stringify({
                message: "Match fetched successfully",
                actionType: data.action,
                body: matchDetails,
                status: true,
              })
            );
          } catch (error) {
            console.error("Error fetching match details:", error);
            ws.send(
              JSON.stringify({
                message: "Internal server error",
                actionType: data.action,
                body: null,
                status: false,
              })
            );
          }
          break;
        case "basketballController":
          try {
            const { matchId, playerId, controllerAction } = data;

            if (!matchId || !playerId || !controllerAction) {
              ws.send(
                JSON.stringify({
                  message: "Match ID, Player ID, and action are required",
                  status: false,
                })
              );
              return;
            }

            const boxScore = await CustomBasketballBoxScore.findOne({ matchId })
              .populate({
                path: "boxScore.homeTeam.teamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              })
              .populate({
                path: "boxScore.awayTeam.teamId",
                model: "CustomBasketballTeam",
                select: "teamName teamImage",
              })
              .populate({
                path: "boxScore.homeTeam.players.playerId",
                model: "CustomBasketballPlayers",
                select: "playerName image role jerseyNumber",
              })
              .populate({
                path: "boxScore.awayTeam.players.playerId",
                model: "CustomBasketballPlayers",
                select: "playerName image role jerseyNumber",
              });

            if (!boxScore) {
              ws.send(
                JSON.stringify({
                  message: "Box score not found",
                  status: false,
                })
              );
              return;
            }

            const updatePlayerStats = (team) => {
              const player = team.players.find(
                (p) => p.playerId._id.toString() === playerId
              );
              if (player) {
                switch (controllerAction) {
                  case "FTA":
                    player.freeThrowsAttempted =
                      (player.freeThrowsAttempted || 0) + 1;
                    break;
                  case "FTM":
                    player.freeThrowsMade = (player.freeThrowsMade || 0) + 1;
                    break;
                  case "AST":
                    player.assists = (player.assists || 0) + 1;
                    break;
                  case "TO":
                    player.turnovers = (player.turnovers || 0) + 1;
                    break;
                  case "FOUL":
                    player.fouls = (player.fouls || 0) + 1;
                    break;
                  case "DRB":
                    player.rebounds = (player.rebounds || 0) + 1;
                    break;
                  case "ORB":
                    player.rebounds = (player.rebounds || 0) + 1;
                    break;
                  case "2PT":
                    player.points = (player.points || 0) + 2;
                    break;
                  case "3PT":
                    player.points = (player.points || 0) + 3;
                  default:
                    break;
                }
              }
            };

            updatePlayerStats(boxScore.boxScore.homeTeam);
            updatePlayerStats(boxScore.boxScore.awayTeam);

            await boxScore.save();

            const transformTeam = (team) => ({
              teamId: team.teamId._id,
              teamName: team.teamName,
              image: team.image,
              players: team.players.map((player) => ({
                playerId: player.playerId._id,
                name: player.name,
                image: player.image,
                role: player.role,
                jerseyNumber: player.jerseyNumber,
                isPlaying: player.isPlaying,
                points: player.points,
                rebounds: player.rebounds,
                assists: player.assists,
                freeThrowsAttempted: player.freeThrowsAttempted,
                freeThrowsMade: player.freeThrowsMade,
                fouls: player.fouls,
                turnovers: player.turnovers,
              })),
            });

            const transformedBoxScore = {
              matchId: boxScore.matchId,
              homeTeam: transformTeam(boxScore.boxScore.homeTeam),
              awayTeam: transformTeam(boxScore.boxScore.awayTeam),
            };

            ws.send(
              JSON.stringify({
                message: "Action processed successfully",
                status: true,
                body: transformedBoxScore,
              })
            );
          } catch (error) {
            console.error("Error processing action:", error);
            ws.send(
              JSON.stringify({
                message: "Internal server error",
                status: false,
              })
            );
          }
          break;
      }
    });
  });
};

export default setupWebSocket;
