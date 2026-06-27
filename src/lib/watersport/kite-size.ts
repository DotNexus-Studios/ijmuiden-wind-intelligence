import { msToKnots } from "@/lib/units/wind";
import { WEIGHT_LABELS } from "@/lib/i18n/nl";

export type RiderWeight = "light" | "medium" | "heavy";

const WEIGHT_KG: Record<RiderWeight, number> = {
  light: 65,
  medium: 80,
  heavy: 95,
};

export interface KiteSizeResult {
  primary: string;
  range: string;
  sizeM2: number;
  notes: string;
}

export function recommendKiteSize(
  windSpeedMs: number,
  weight: RiderWeight = "medium"
): KiteSizeResult {
  const knots = msToKnots(windSpeedMs);
  const kg = WEIGHT_KG[weight];

  let sizeM2: number;
  if (knots < 10) sizeM2 = 14;
  else if (knots < 14) sizeM2 = 12;
  else if (knots < 18) sizeM2 = weight === "light" ? 11 : 10;
  else if (knots < 22) sizeM2 = weight === "heavy" ? 10 : 9;
  else if (knots < 26) sizeM2 = weight === "light" ? 9 : 8;
  else if (knots < 30) sizeM2 = weight === "heavy" ? 8 : 7;
  else if (knots < 35) sizeM2 = 6;
  else sizeM2 = 5;

  if (weight === "light" && knots > 16) sizeM2 = Math.max(5, sizeM2 - 1);
  if (weight === "heavy" && knots < 20) sizeM2 = Math.min(14, sizeM2 + 1);

  const low = Math.max(4, sizeM2 - 1);
  const high = Math.min(17, sizeM2 + 1);

  return {
    primary: `${sizeM2}m`,
    range: `${low}-${high}m`,
    sizeM2,
    notes:
      knots < 12
        ? "Weinig wind - overweeg een grotere kite of wacht op meer wind."
        : knots > 30
          ? "Harde wind - kleinere kite, alleen voor ervaren riders."
          : `Goed bereik voor ${WEIGHT_LABELS[weight].toLowerCase()} riders (${kg} kg).`,
  };
}

export function kiteSizeForBar(windKnots: number, gustKnots: number, weight: RiderWeight): string {
  const gustFactor = gustKnots / Math.max(windKnots, 1);
  const effectiveWind = gustFactor > 1.35 ? windKnots * 0.9 : windKnots;
  return recommendKiteSize(effectiveWind / 1.94384, weight).primary;
}
