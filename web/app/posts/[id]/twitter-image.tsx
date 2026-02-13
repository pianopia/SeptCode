import { ImageResponse } from "next/og";
import { getPostForOg } from "@/lib/og-queries";

export const runtime = "nodejs";
export const alt = "SeptCode 投稿プレビュー";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Language display color map
const LANG_COLORS: Record<string, string> = {
    javascript: "#f7df1e",
    typescript: "#3178c6",
    python: "#3572a5",
    ruby: "#cc342d",
    go: "#00add8",
    rust: "#dea584",
    java: "#b07219",
    kotlin: "#a97bff",
    swift: "#f05138",
    css: "#563d7c",
    html: "#e34c26",
    sql: "#e38c00",
    php: "#4f5d95",
    c: "#555555",
    cpp: "#f34b7d",
    markdown: "#083fa1",
    json: "#a3a3a3",
    yaml: "#cb171e",
    xml: "#0060ac",
    mermaid: "#ff3670"
};

function getLangColor(lang: string): string {
    return LANG_COLORS[lang.toLowerCase()] ?? "#38bdf8";
}

export default async function TwitterImage({
    params
}: {
    params: { id: string };
}) {
    const post = await getPostForOg(params.id);

    if (!post) {
        return new ImageResponse(
            (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#0b1220",
                        color: "#94a3b8",
                        fontSize: "36px",
                        fontFamily: "monospace"
                    }}
                >
                    Post not found
                </div>
            ),
            { ...size }
        );
    }

    const codeLines = post.code.split("\n").slice(0, 7);
    const langColor = getLangColor(post.language);

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    background: "linear-gradient(160deg, #0b1220 0%, #111a2b 50%, #0b1220 100%)",
                    padding: "40px 48px",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {/* Background glow */}
                <div
                    style={{
                        position: "absolute",
                        top: "-120px",
                        right: "-100px",
                        width: "400px",
                        height: "400px",
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${langColor}18 0%, transparent 70%)`,
                        display: "flex"
                    }}
                />

                {/* Header: Brand + Language */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                        width: "100%"
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px"
                        }}
                    >
                        <span
                            style={{
                                fontSize: "32px",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                background: "linear-gradient(180deg, #38bdf8, #a855f7)",
                                backgroundClip: "text",
                                color: "transparent",
                                display: "flex"
                            }}
                        >
                            {"}7"}
                        </span>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: 700,
                                letterSpacing: "0.06em",
                                color: "#94a3b8",
                                display: "flex"
                            }}
                        >
                            SeptCode
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px"
                        }}
                    >
                        <div
                            style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: langColor,
                                display: "flex"
                            }}
                        />
                        <span
                            style={{
                                fontSize: "20px",
                                color: langColor,
                                fontWeight: 600,
                                display: "flex"
                            }}
                        >
                            {post.language}
                        </span>
                    </div>
                </div>

                {/* Code block */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        borderRadius: "16px",
                        border: "1px solid #1e293b",
                        background: "linear-gradient(180deg, #0f172a 0%, #0b1120 100%)",
                        padding: "28px 32px",
                        overflow: "hidden"
                    }}
                >
                    {codeLines.map((line, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                height: "48px",
                                fontSize: "24px",
                                fontFamily: "monospace",
                                lineHeight: "48px"
                            }}
                        >
                            <span
                                style={{
                                    width: "40px",
                                    textAlign: "right",
                                    marginRight: "24px",
                                    color: "#475569",
                                    fontSize: "18px",
                                    flexShrink: 0,
                                    display: "flex",
                                    justifyContent: "flex-end"
                                }}
                            >
                                {i + 1}
                            </span>
                            <span
                                style={{
                                    color: "#e2e8f0",
                                    whiteSpace: "pre",
                                    display: "flex"
                                }}
                            >
                                {line || " "}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "20px",
                        width: "100%"
                    }}
                >
                    <span
                        style={{
                            fontSize: "20px",
                            color: "#64748b",
                            display: "flex"
                        }}
                    >
                        @{post.authorHandle}
                    </span>
                    <div
                        style={{
                            display: "flex",
                            gap: "8px"
                        }}
                    >
                        {post.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    fontSize: "14px",
                                    color: "#94a3b8",
                                    border: "1px solid #334155",
                                    borderRadius: "9999px",
                                    padding: "4px 12px",
                                    display: "flex"
                                }}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        ),
        { ...size }
    );
}
