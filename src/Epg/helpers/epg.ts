import { differenceInMinutes, startOfDay, addDays, isEqual } from "date-fns";

// Import interfaces
import { Channel, Program } from "./interfaces";

// Import types
import { ProgramWithPosition, Position, DateTime } from "./types";

// Import variables
import {
  ITEM_OVERSCAN,
  SIDEBAR_ITEM_HEIGHT,
  HOUR_WIDTH,
  HOUR_IN_MINUTES,
} from "./variables";

// Import time heleprs
import {
  formatTime,
  roundToMinutes,
  isYesterday as isYesterdayTime,
} from "./time";

// -------- Program width --------
const getItemDiffWidth = (diff: number) =>
  (diff * HOUR_WIDTH) / HOUR_IN_MINUTES;

export const getPositionX = (
  since: DateTime,
  till: DateTime,
  startDate: DateTime
) => {
  const tomorrowDate = startOfDay(addDays(new Date(startDate), 1));
  const dateNow = startOfDay(new Date(till));
  const isTomorrow = isEqual(dateNow, tomorrowDate);
  const isYesterday = isYesterdayTime(since, startDate);

  if (isYesterday) {
    const diffTime = differenceInMinutes(
      roundToMinutes(till),
      startOfDay(new Date(startDate))
    );
    return getItemDiffWidth(diffTime);
  }

  if (isTomorrow) {
    const diffTime = differenceInMinutes(
      startOfDay(new Date(till)),
      roundToMinutes(since)
    );
    return getItemDiffWidth(diffTime);
  }

  const diffTime = differenceInMinutes(
    roundToMinutes(new Date(till)),
    roundToMinutes(new Date(since))
  );

  return getItemDiffWidth(diffTime);
};

// -------- Channel position in the Epg --------
export const getChannelPosition = (channelIndex: number) => {
  const top = SIDEBAR_ITEM_HEIGHT * channelIndex;
  const position = {
    top,
  };
  return position;
};
// -------- Program position in the Epg --------
export const getProgramPosition = (
  program: Program,
  channelIndex: number,
  startDate: DateTime
) => {
  const item = {
    ...program,
    since: formatTime(program.since),
    till: formatTime(program.till),
  };
  const isYesterday = isYesterdayTime(item.since, startDate);

  const width = getPositionX(item.since, item.till, startDate);
  const top = SIDEBAR_ITEM_HEIGHT * channelIndex;
  let left = getPositionX(startDate, item.since, startDate);
  const edgeEnd = getPositionX(startDate, item.till, startDate);

  if (isYesterday) left = 0;

  const position = {
    width,
    height: SIDEBAR_ITEM_HEIGHT,
    top,
    left,
    edgeEnd,
  };
  return { position, data: item };
};

// -------- Converted programs with position data --------
type ConvertedProgramsType = {
  data: Program[];
  channels: Channel[];
  startDate: DateTime;
};
export const getConvertedPrograms = ({
  data,
  channels,
  startDate,
}: ConvertedProgramsType) =>
  data.map((next) => {
    const channelIndex = channels.findIndex(
      ({ uuid }) => uuid === next.channelUuid
    );
    return getProgramPosition(next, channelIndex, startDate);
  }, [] as ProgramWithPosition[]);

// -------- Converted channels with position data --------
export const getConvertedChannels = (channels: Channel[]) =>
  channels.map((channel, index) => ({
    ...channel,
    position: getChannelPosition(index),
  }));

// -------- Dynamic virtual program visibility in the EPG --------
export const getItemVisibility = (
  position: Position,
  scrollY: number,
  scrollX: number,
  containerHeight: number,
  containerWidth: number
) => {
  if (scrollY > position.top + ITEM_OVERSCAN * 3) {
    return false;
  }

  if (scrollY + containerHeight <= position.top) {
    return false;
  }

  if (
    scrollX + containerWidth >= position.left &&
    scrollX <= position.edgeEnd
  ) {
    return true;
  }

  return false;
};
export const getSidebarItemVisibility = (
  position: Position,
  scrollY: number,
  containerHeight: number
) => {
  if (scrollY > position.top + ITEM_OVERSCAN * 3) {
    return false;
  }

  if (scrollY + containerHeight <= position.top) {
    return false;
  }

  return true;
};
