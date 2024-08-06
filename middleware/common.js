import fs from "fs/promises";
import path from "path";
import {
  CustomCityList,
  CustomTournamentCategory,
  CustomMatchType,
  CustomMatchOn,
  CustomTournamentWinningPrize,
  CustomPitchType,
  CustomBallType,
  CustomPlayerRole,
  CustomMatchStatus,
  CustomMatchOfficial,
  CustomOutReason,
} from "../cricket-custom-module/models/common.models.js";
import CustomSportList from "../cricket-custom-module/models/sport.models.js";
import BannerSportList from "../features/sport/models/BannerList.js";
import { CustomBasketballPlayerRole } from "../basketball-custom-module/models/basketball-common.models.js";

// Function to read JSON file
const readJsonFile = async (filePath) => {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
};

// Read JSON files
const cityList = await readJsonFile(
  path.resolve("json/cities.tournament.json")
);
const sportList = await readJsonFile(
  path.resolve("json/sport-list.tournament.json")
);
const categoryList = await readJsonFile(
  path.resolve("json/category.tournament.json")
);
const matchTypeList = await readJsonFile(
  path.resolve("json/match-type.tournament.json")
);
const matchOnList = await readJsonFile(
  path.resolve("json/match-on-tournament.json")
);
const winningPrizeList = await readJsonFile(
  path.resolve("json/winning-prize.tournament.json")
);
const pitchTypeList = await readJsonFile(
  path.resolve("json/pitch-types.match.json")
);
const ballTypeList = await readJsonFile(
  path.resolve("json/ball-types.match.json")
);

const BannerList = await readJsonFile(path.resolve("json/banner-list.json"));
const roleList = await readJsonFile(path.resolve("json/roles.player.json"));
const basketballRoleList = await readJsonFile(path.resolve("json/basketball-roles.player.json"));
const reasonList = await readJsonFile(
  path.resolve("json/player-out-reasons.json")
);
const statusList = await readJsonFile(path.resolve("json/status.match.json"));
const matchOfficialsList = await readJsonFile(
  path.resolve("json/match-officials.match.json")
);

export const InsertSportList = async () => {
  const sportNamesInJson = sportList.map((sport) => sport.sportName);
  for (const sport of sportList) {
    const exists = await CustomSportList.findOne({
      sportName: sport.sportName,
    });
    if (!exists) {
      const newSport = new CustomSportList(sport);
      await newSport.save();
    } else {
      exists.image = sport.image;
      await exists.save();
    }
  }
  // Delete sports not in JSON
  await CustomSportList.deleteMany({ sportName: { $nin: sportNamesInJson } });
};

export const InsertCityList = async () => {
  const cityNamesInJson = cityList.map((city) => city.city);
  for (const city of cityList) {
    const exists = await CustomCityList.findOne({ city: city.city });
    if (!exists) {
      const newCity = new CustomCityList(city);
      await newCity.save();
    }
  }
  // Delete cities not in JSON
  await CustomCityList.deleteMany({ city: { $nin: cityNamesInJson } });
};

export const InsertTournamentCategory = async () => {
  const categoryNamesInJson = categoryList.map((category) => category.name);
  for (const category of categoryList) {
    const exists = await CustomTournamentCategory.findOne({
      name: category.name,
    });
    if (!exists) {
      const newCategory = new CustomTournamentCategory(category);
      await newCategory.save();
    }
  }
  // Delete categories not in JSON
  await CustomTournamentCategory.deleteMany({
    name: { $nin: categoryNamesInJson },
  });
};

export const InsertMatchType = async () => {
  const matchTypeNamesInJson = matchTypeList.map((matchType) => matchType.name);
  for (const matchType of matchTypeList) {
    const exists = await CustomMatchType.findOne({ name: matchType.name });
    if (!exists) {
      const newMatchType = new CustomMatchType(matchType);
      await newMatchType.save();
    }
  }
  // Delete match types not in JSON
  await CustomMatchType.deleteMany({ name: { $nin: matchTypeNamesInJson } });
};

export const InsertMatchOn = async () => {
  const matchOnNamesInJson = matchOnList.map((matchOn) => matchOn.name);
  for (const matchOn of matchOnList) {
    const exists = await CustomMatchOn.findOne({ name: matchOn.name });
    if (!exists) {
      const newMatchOn = new CustomMatchOn(matchOn);
      await newMatchOn.save();
    }
  }
  // Delete match on not in JSON
  await CustomMatchOn.deleteMany({ name: { $nin: matchOnNamesInJson } });
};

export const InsertTournamentWinningPrize = async () => {
  const winningPrizeNamesInJson = winningPrizeList.map((prize) => prize.name);

  for (const winningPrize of winningPrizeList) {
    const exists = await CustomTournamentWinningPrize.findOne({
      name: winningPrize.name,
    });
    if (!exists) {
      const newWinningPrize = new CustomTournamentWinningPrize(winningPrize);
      await newWinningPrize.save();
    }
  }
  // Delete winning prizes not in JSON
  await CustomTournamentWinningPrize.deleteMany({
    name: { $nin: winningPrizeNamesInJson },
  });
};

export const InsertPitchType = async () => {
  const pitchTypeNamesInJson = pitchTypeList.map(
    (pitchType) => pitchType.pitchType
  );

  for (const pitchType of pitchTypeList) {
    const exists = await CustomPitchType.findOne({
      pitchType: pitchType.pitchType,
    });
    if (!exists) {
      const newPitchType = new CustomPitchType(pitchType);
      await newPitchType.save();
    }
  }
  // Delete pitch types not in JSON
  await CustomPitchType.deleteMany({
    pitchType: { $nin: pitchTypeNamesInJson },
  });
};

export const InsertBallType = async () => {
  const ballTypeNamesInJson = ballTypeList.map((ballType) => ballType.ballType);

  for (const ballType of ballTypeList) {
    const exists = await CustomBallType.findOne({
      ballType: ballType.ballType,
      icon: ballType.icon,
    });
    if (!exists) {
      const newBallType = new CustomBallType(ballType);
      await newBallType.save();
    }
  }
  // Delete ball types not in JSON
  await CustomBallType.deleteMany({ ballType: { $nin: ballTypeNamesInJson } });
};

export const InsertBannerList = async () => {
  const bannerNamesInJson = BannerList.map((banner) => banner.bannerImage);

  for (const banner of BannerList) {
    const exists = await BannerSportList.findOne({
      bannerImage: banner.bannerImage,
    });
    if (!exists) {
      const newSport = new BannerSportList(banner);
      await newSport.save();
    }
  }
  // Delete sports not in JSON
  await BannerSportList.deleteMany({
    bannerImage: { $nin: bannerNamesInJson },
  });
};

export const InsertPlayerRole = async () => {
  const roleNamesInJson = roleList.map((role) => role.role);
  for (const role of roleList) {
    const exists = await CustomPlayerRole.findOne({
      role: role.role,
      image: role.image,
    });
    if (!exists) {
      const newRole = new CustomPlayerRole(role);
      await newRole.save();
    }
  }
  // Delete roles not in JSON
  await CustomPlayerRole.deleteMany({ role: { $nin: roleNamesInJson } });
};

export const InsertBasketballPlayerRole = async () => {
  const roleNamesInJson = basketballRoleList.map((role) => role.role);
  for (const role of basketballRoleList) {
    const exists = await CustomBasketballPlayerRole.findOne({
      role: role.role,
      image: role.image,
    });
    if (!exists) {
      const newRole = new CustomBasketballPlayerRole(role);
      await newRole.save();
    }
  }
  // Delete roles not in JSON
  await CustomBasketballPlayerRole.deleteMany({ role: { $nin: roleNamesInJson } });
};

export const playerOutReasons = async () => {
  reasonList.map((reason) => reason.reason);
  for (const reason of reasonList) {
    const exists = await CustomOutReason.findOne({
      reason: reason.reason,
      icon: reason.icon,
    });
    if (!exists) {
      const newReason = new CustomOutReason(reason);
      await newReason.save();
    }
  }
};

export const InsertMatchStatus = async () => {
  const statusNamesInJson = statusList.map((status) => status.status);
  for (const status of statusList) {
    const exists = await CustomMatchStatus.findOne({ status: status.status });
    if (!exists) {
      const newStatus = new CustomMatchStatus(status);
      await newStatus.save();
    }
  }
  // Delete status not in JSON
  await CustomMatchStatus.deleteMany({ status: { $nin: statusNamesInJson } });
};

export const InsertMatchOfficials = async () => {
  const matchOfficialsNamesInJson = matchOfficialsList.map(
    (matchOfficial) => matchOfficial.name
  );
  for (const matchOfficial of matchOfficialsList) {
    const exists = await CustomMatchOfficial.findOne({
      name: matchOfficial.name,
    });
    if (!exists) {
      const newMatchOfficial = new CustomMatchOfficial(matchOfficial);
      await newMatchOfficial.save();
    } else {
      exists.image = matchOfficial.image;
      await exists.save();
    }
  }
  // Delete sports not in JSON
  await CustomMatchOfficial.deleteMany({
    name: { $nin: matchOfficialsNamesInJson },
  });
};
