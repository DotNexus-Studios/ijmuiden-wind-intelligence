import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #071018 0%, #0c1829 100%)",
        }}
      >
        <svg width="280" height="280" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#38bdf8" strokeWidth="3" opacity="0.4" />
          <polygon points="50,15 44,60 50,52 56,60" fill="#38bdf8" />
          <circle cx="50" cy="50" r="5" fill="#34d399" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
