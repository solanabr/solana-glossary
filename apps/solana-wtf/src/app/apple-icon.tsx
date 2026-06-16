import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0B10, #12142a)",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            fontSize: 110,
            fontWeight: 900,
            fontFamily: "monospace",
            color: "#00FFFF",
            textShadow: "0 0 30px rgba(0,255,255,0.6)",
            lineHeight: 1,
          }}
        >
          W
        </div>
      </div>
    ),
    { ...size }
  );
}
