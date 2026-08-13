import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { writeFile } from "fs/promises";

const FILE_PATH = "data/trainTimes.json";

const F_TRAIN_ENDPOINT =
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm";
const G_TRAIN_ENDPOINT =
  "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g";
const BERGEN_ST_NORTHBOUND_STOP_ID = "F20N";

const LINE_FEEDS = {
  F: F_TRAIN_ENDPOINT,
  G: G_TRAIN_ENDPOINT,
} as const;

export type BergenStTrainMinutes = {
  F: number[];
  G: number[];
  timeRecorded: number;
};

function minutesUntil(arrivalEpochSeconds: number, nowMs: number): number {
  const minutes = (arrivalEpochSeconds * 1000 - nowMs) / 60_000;
  return Math.max(0, Math.round(minutes));
}

async function fetchFeed(
  url: string,
): Promise<GtfsRealtimeBindings.transit_realtime.FeedMessage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`MTA feed request failed (${response.status}): ${url}`);
  }

  const buffer = await response.arrayBuffer();
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
    new Uint8Array(buffer),
  );
}

function getNorthboundMinutesForLine(
  feed: GtfsRealtimeBindings.transit_realtime.FeedMessage,
  lineId: keyof typeof LINE_FEEDS,
  limit: number,
  nowMs: number,
): number[] {
  const arrivals: number[] = [];

  for (const entity of feed.entity) {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate?.trip || tripUpdate.trip.routeId !== lineId) {
      continue;
    }

    for (const stopUpdate of tripUpdate.stopTimeUpdate ?? []) {
      if (stopUpdate.stopId !== BERGEN_ST_NORTHBOUND_STOP_ID) {
        continue;
      }

      const arrivalTime =
        stopUpdate.arrival?.time ?? stopUpdate.departure?.time;
      if (!arrivalTime) {
        continue;
      }

      arrivals.push(Number(arrivalTime));
      break;
    }
  }

  arrivals.sort((a, b) => a - b);
  return arrivals
    .slice(0, limit)
    .map((arrivalEpochSeconds) => minutesUntil(arrivalEpochSeconds, nowMs));
}

export async function getNorthboundTrainMinutes(
  limit = 3,
): Promise<BergenStTrainMinutes> {
  const nowMs = Date.now();
  const [fFeed, gFeed] = await Promise.all([
    fetchFeed(LINE_FEEDS.F),
    fetchFeed(LINE_FEEDS.G),
  ]);

  return {
    F: getNorthboundMinutesForLine(fFeed, "F", limit, nowMs),
    G: getNorthboundMinutesForLine(gFeed, "G", limit, nowMs),
    timeRecorded: nowMs,
  };
}

async function writeData(data: BergenStTrainMinutes): Promise<void> {
  try {
    await writeFile(FILE_PATH, JSON.stringify(data), "utf-8");
  } catch (error) {
    console.error("Error writing file:", error);
  }
}

async function main(): Promise<void> {
  const data: BergenStTrainMinutes = await getNorthboundTrainMinutes();
  writeData(data);
}

main();
