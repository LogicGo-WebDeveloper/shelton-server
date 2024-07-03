export const convertSportListToArray = (sportList) => {
  return Object.keys(sportList).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' '),
    live: sportList[key].live,
    total: sportList[key].total
  }));
};

export const filterLiveMatchData = (match) => {
  return {
    tournament: {
      name: match?.tournament?.name || null,
      slug: match?.tournament?.slug || null,
      category: {
        name: match?.tournament?.category?.name || null,
        slug: match?.tournament?.category?.slug || null,
        id: match?.tournament?.category?.id || null,
        country: match?.tournament?.category?.country || null,
      },
      id: match?.tournament?.id || null,
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
      id: match?.homeTeam?.id || null,
    },
    awayTeam: {
      name: match?.awayTeam?.name || null,
      slug: match?.awayTeam?.slug || null,
      shortName: match?.awayTeam?.shortName || null,
      nameCode: match?.awayTeam?.nameCode || null,
      id: match?.awayTeam?.id || null,
    },
    homeScore: {
      current: match?.homeScore?.current || null,
      display: match?.homeScore?.display || null,
      innings: match?.homeScore?.innings 
      ? Object.entries(match.homeScore.innings).map(([key, value]) => ({ key, ...value })) 
      : null,
    },
    awayScore: {
      current: match?.awayScore?.current || null,
      display: match?.awayScore?.display || null,
      innings: match?.awayScore?.innings 
      ? Object.entries(match.awayScore.innings).map(([key, value]) => ({ key, ...value })) 
      : null,
      
    },
    id: match?.id || null,
    currentBattingTeamId: match?.currentBattingTeamId || null,
    endTimestamp: match?.endTimestamp || null,
    startTimestamp: match?.startTimestamp || null,
    slug: match?.slug || null,
    periods: match?.periods || null,
    lastPeriod: match?.lastPeriod || null,
    finalResultOnly: match?.finalResultOnly || null,
    tvUmpireName: match?.tvUmpireName || null,
    venue: match?.venue || null,
    umpire1Name: match?.umpire1Name || null,
    umpire2Name: match?.umpire2Name || null,
  };
};

 export const filterPlayerData = (players) => {
  return players.map(player => ({
    name: player.player.name || null,
    shortName: player.player.shortName || null,
    id: player.player.id || null,
    batting: player.player.cricketPlayerInfo.batting || null,
    bowling: player.player.cricketPlayerInfo.bowling || null,
    position: player.position || null,
    substitute: player.substitute || null
  }));
};

export const filterScorecardData = (scorecard) => {
  return {
    home: filterPlayerData(scorecard.home.players),
    away: filterPlayerData(scorecard.away.players)
  }
}