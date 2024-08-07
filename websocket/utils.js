import helper from "../helper/common.js";
import config from "../config/config.js";
import { CustomOutReason } from "../cricket-custom-module/models/common.models.js";

export const convertSportListToArray = (sportList) => {
  let sportUrl = req.protocol + "://" + req.get("host") + "/sport/";

  return Object.keys(sportList).map((key) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " "),
    live: sportList[key].live,
    total: sportList[key].total,
    image: sportList[key].image ? sportUrl + sportList[key].image : "",
  }));
};

export const filterLiveMatchData = (match, _id, isFavourite) => {
  let isAllfavourite = isFavourite ? isFavourite.status : false;
  return {
    _id: _id ? _id : undefined,
    tournament: {
      name: match?.tournament?.name || null,
      slug: match?.tournament?.slug || null,
      category: {
        name: match?.tournament?.category?.name || null,
        slug: match?.tournament?.category?.slug || null,
        id: match?.tournament?.category?.id || null,
        country: match?.tournament?.category?.country || null,
        image: match?.tournament?.category?.image || null,
      },
      id: match?.tournament?.id || null,
      image: match?.tournament?.image || null,
    },
    favouriteMatchDetails: {
      is_favourite: isAllfavourite ? isAllfavourite : false,
    },
    customId: match?.customId || null,
    season: {
      name: match?.season?.name || null,
      year: match?.season?.year || null,
      id: match?.season?.id || null,
    },
    status: {
      code: match?.status?.code || null,
      description: match?.status?.description || null,
      type: match?.status?.type || null,
    },
    homeTeam: {
      name: match?.homeTeam?.name || null,
      slug: match?.homeTeam?.slug || null,
      shortName: match?.homeTeam?.shortName || null,
      nameCode: match?.homeTeam?.nameCode || null,
      image: match?.homeTeam?.image || null,
      id: match?.homeTeam?.id || null,
    },
    awayTeam: {
      name: match?.awayTeam?.name || null,
      slug: match?.awayTeam?.slug || null,
      shortName: match?.awayTeam?.shortName || null,
      nameCode: match?.awayTeam?.nameCode || null,
      image: match?.awayTeam?.image || null,
      id: match?.awayTeam?.id || null,
    },
    homeScore: {
      current: match?.homeScore?.current || null,
      display: match?.homeScore?.display || null,
      innings: match?.homeScore?.innings
        ? Object.entries(match.homeScore.innings).map(([key, value]) => ({
            key,
            ...value,
          }))
        : null,
    },
    awayScore: {
      current: match?.awayScore?.current || null,
      display: match?.awayScore?.display || null,
      innings: match?.awayScore?.innings
        ? Object.entries(match.awayScore.innings).map(([key, value]) => ({
            key,
            ...value,
          }))
        : null,
    },
    id: match?.id || null,
    currentBattingTeamId: match?.currentBattingTeamId || null,
    endTimestamp: match?.endTimestamp || null,
    startTimestamp: match?.startTimestamp || null,
    slug: match?.slug || null,
    tvUmpireName: match?.tvUmpireName || null,
    venue: match?.venue || null,
    umpire1Name: match?.umpire1Name || null,
    umpire2Name: match?.umpire2Name || null,
    winnerCode: match.winnerCode || null,
    notes: match.note || null,
  };
};

export const filterPlayerData = (players) => {
  return players.map((player) => ({
    name: player.player.name || null,
    shortName: player.player.shortName || null,
    id: player.player.id || null,
    batting: player.player.cricketPlayerInfo.batting || null,
    bowling: player.player.cricketPlayerInfo.bowling || null,
    position: player.position || null,
    substitute: player.substitute || null,
    image: player.player.image || null,
  }));
};

export const filterScorecardData = (scorecard) => {
  return {
    home: filterPlayerData(scorecard.home.players),
    away: filterPlayerData(scorecard.away.players),
  };
};

export const filterStandingsData = (standings) => {
  return {
    tournament: {
      name: standings.tournament.name,
      slug: standings.tournament.slug,
      category: {
        name: standings.tournament.category.name,
        slug: standings.tournament.category.slug,
        id: standings.tournament.category.id,
        flag: standings.tournament.category.flag,
      },
      id: standings.tournament.id,
    },
    rows: standings.rows.map((row) => ({
      team: {
        name: row.team.name,
        slug: row.team.slug,
        shortName: row.team.shortName,
        userCount: row.team.userCount,
        nameCode: row.team.nameCode,
        national: row.team.national,
        type: row.team.type,
        id: row.team.id,
      },
      position: row.position,
      matches: row.matches,
      wins: row.wins,
      noResult: row.noResult,
      netRunRate: row.netRunRate,
      id: row.id,
      losses: row.losses,
      draws: row.draws,
      points: row.points,
    })),
  };
};

export const fractionalOddsToDecimal = (fractionalOdds) => {
  const [numerator, denominator] = fractionalOdds.split("/").map(Number);
  return numerator / denominator + 1;
};

const getImageUrl = async (playerId) => {
  const folderName = "player";
  let imageUrl;
  const image = await helper.getPlayerImage(playerId);
  if (image) {
    await helper.uploadImageInS3Bucket(
      `${process.env.SOFASCORE_FREE_IMAGE_API_URL}/api/v1/player/${playerId}/image`,
      folderName,
      playerId
    );
    imageUrl = `${config.cloud.digitalocean.baseUrl}/${config.cloud.digitalocean.rootDirname}/${folderName}/${playerId}`;
  } else {
    imageUrl = null;
  }
  return imageUrl;
};

export const filteredOversData = async (data) => {
  const result = [];
  const overMap = {};

  for (const item of data) {
    const over = item.over;
    if (!overMap[over]) {
      overMap[over] = {
        over: over?.toString(),
        total_runs_in_this_over: 0,
        image: (await getImageUrl(item?.bowler?.id)) || null,
        balls: [],
      };
      result.push(overMap[over]);
    }

    overMap[over].total_runs_in_this_over += item.totalRuns;
    overMap[over].balls.push({
      id: item.id,
      ball: item.ball?.toString(),
      runs: item.runs !== null ? item.runs?.toString() : null,
      totalRuns: item.totalRuns,
      commentary: item.commentary,
      score: item.score,
      wicket: item.wicket ? true : false,
      missed: item.missed ? true : false,
      scored: item.scored ? true : false,
      batsman: item.batsman
        ? {
            name: item.batsman?.name || null,
            shortName: item.batsman?.shortName || null,
            position: item.batsman?.position || null,
            id: item.batsman?.id || null,
            cricketPlayerInfo: item.batsman?.cricketPlayerInfo || null,
          }
        : null,
      bowler: item.bowler
        ? {
            name: item.bowler?.name || null,
            shortName: item.bowler?.shortName || null,
            position: item.bowler?.position || null,
            id: item.bowler?.id || null,
            cricketPlayerInfo: item.bowler?.cricketPlayerInfo || null,
          }
        : null,
      fielder: item.fielder
        ? {
            name: item.fielder?.name || null,
            shortName: item.fielder?.shortName || null,
            position: item.fielder?.position || null,
            id: item.fielder?.id || null,
            cricketPlayerInfo: item.fielder?.cricketPlayerInfo || null,
          }
        : null,
      incidentClassLabel: item?.incidentClassLabel || null,
      zone: item?.zone || null,
    });
  }

  return result;
};


export const handlePlayerOut = async (data, existingScorecard, ws) => {
  const { batters, bowlers, outTypeId, fielderId } = data;

  // Fetch the outType details from the database
  const outTypeDetails = await CustomOutReason.findById(outTypeId);
  if (!outTypeDetails) {
    throw new Error("Invalid outTypeId provided");
  }

  const outType = outTypeDetails.reason;

  if (!existingScorecard || !existingScorecard.scorecard) {
    throw new Error("Scorecard not found or not properly initialized");
  }
  const battingTeamKey = existingScorecard.scorecard.homeTeam.players.some(
    (player) => player.id.toString() === batters.playerId
  )
    ? "homeTeam"
    : "awayTeam";
  const bowlingTeamKey = battingTeamKey === "homeTeam" ? "awayTeam" : "homeTeam";
  const batterIndex = existingScorecard.scorecard[battingTeamKey].players.findIndex(
    (player) => player.id.toString() === batters.playerId
  );

  const bowlerIndex = existingScorecard.scorecard[bowlingTeamKey].players.findIndex(
    (player) => player.id.toString() === bowlers.playerId
  );

  if (batterIndex !== -1) {
    const player = existingScorecard.scorecard[battingTeamKey].players[batterIndex];
    player.status = "out";
    player.outType = outType;

    if (outType !== "Retired Hurt" && outType !== "Timed Out") {
      player.balls = (player.balls || 0) + (batters.balls ? 1 : 0);
    }

    if (outType === "Run Out") {
      player.runs = (player.runs || 0) + batters.runs;
    } else if (outType !== "Retired Hurt" && outType !== "Timed Out" && !bowlers.wides) {
      player.runs = (player.runs || 0) + batters.runs;
      player.fours = (player.fours || 0) + (batters.fours ? 1 : 0);
      player.sixes = (player.sixes || 0) + (batters.sixes ? 1 : 0);
    }

    if (["Caught", "Stumped"].includes(outType)) {
      player.wicketByFielder = fielderId;
    }
  }

  const getDecimalPart = (num) => {
    const parts = num.toString().split(".");
    return parts.length > 1 ? parseInt(parts[1], 10) : 0;
  };

  if (bowlerIndex !== -1) {
    const player = existingScorecard.scorecard[bowlingTeamKey].players[bowlerIndex];
  
    if (outType !== "Retired Hurt" && outType !== "Timed Out") {

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
    }

    if (["Bowled", "Caught", "Stumped", "Hit Wicket", "LBW"].includes(outType)) {
        player.wickets = (player.wickets || 0) + 1;
    }
}

  return true;
};