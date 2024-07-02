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
        name: match?.tournament?.name,
        slug: match?.tournament?.slug,
        category: {
          name: match?.tournament?.category?.name,
          slug: match?.tournament?.category?.slug,
          id: match?.tournament?.category?.id,
        },
        id: match?.tournament?.id,
      },
      season: {
        name: match?.season?.name,
        year: match?.season?.year,
        id: match?.season?.id,
      },
      status: {
        code: match?.status?.code,
        description: match?.status?.description,
        type: match?.status?.type,
      },
      homeTeam: {
        name: match?.homeTeam?.name,
        slug: match?.homeTeam?.slug,
        shortName: match?.homeTeam?.shortName,
        nameCode: match?.homeTeam?.nameCode,
        id: match?.homeTeam?.id,
      },
      awayTeam: {
        name: match?.awayTeam?.name,
        slug: match?.awayTeam?.slug,
        shortName: match?.awayTeam?.shortName,
        nameCode: match?.awayTeam?.nameCode,
        id: match?.awayTeam?.id,
      },
      homeScore: match?.homeScore,
      awayScore: match?.awayScore,
      id: match?.id,
      currentBattingTeamId: match?.currentBattingTeamId,
      endTimestamp: match?.endTimestamp,
      startTimestamp: match?.startTimestamp,
      slug: match?.slug,
      periods: match?.periods,
      lastPeriod: match?.lastPeriod,
      finalResultOnly: match?.finalResultOnly,
    };
  };