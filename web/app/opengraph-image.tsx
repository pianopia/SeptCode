import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SeptCode - 7行のコード共有SNS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #0b1220 0%, #173054 40%, #0b1220 100%)",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Decorative glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "-80px",
                        right: "-60px",
                        width: "500px",
                        height: "500px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
                        display: "flex"
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: "-100px",
                        left: "-80px",
                        width: "600px",
                        height: "600px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)",
                        display: "flex"
                    }}
                />

                {/* Logo motif }7 */}
                <div
                    style={{
                        fontSize: "180px",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        lineHeight: 1,
                        display: "flex",
                        background: "linear-gradient(180deg, #38bdf8, #a855f7)",
                        backgroundClip: "text",
                        color: "transparent",
                        marginBottom: "8px"
                    }}
                >
                    {"}7"}
                </div>

                {/* Service name */}
                <div
                    style={{
                        fontSize: "72px",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        display: "flex",
                        background: "linear-gradient(90deg, #6ee7b7, #38bdf8, #818cf8)",
                        backgroundClip: "text",
                        color: "transparent"
                    }}
                >
                    SeptCode
                </div>

                {/* Tagline */}
                <div
                    style={{
                        fontSize: "28px",
                        color: "#94a3b8",
                        marginTop: "16px",
                        letterSpacing: "0.12em",
                        display: "flex"
                    }}
                >
                    7行のコード共有SNS
                </div>

                {/* Sample code decoration */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "40px",
                        right: "60px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        opacity: 0.25,
                        fontFamily: "monospace",
                        fontSize: "14px",
                        color: "#38bdf8"
                    }}
                >
                    <span style={{ display: "flex" }}>{"const code = () => {"}</span>
                    <span style={{ display: "flex" }}>{"  return <Magic />;"}</span>
                    <span style={{ display: "flex" }}>{"}"}</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
