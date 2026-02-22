import { Match } from "../db/schema";
import { MATCH_STATUS } from "../validation/matches";

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

export function getMatchStatus(
  startTime: string | Date | null,
  endTime: string | Date | null,
  now = new Date(),
): MatchStatus {
  if (!startTime || !endTime) {
    return MATCH_STATUS.SCHEDULED;
  }
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

export async function syncMatchStatus(
  match: Match,
  updateStatus: (status: MatchStatus) => Promise<void> | void,
): Promise<MatchStatus | undefined> {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);
  if (!nextStatus) {
    return match.status;
  }
  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }
  return match.status;
}
