export async function explainCode(premise1: string, premise2: string, code: string) {
  if (!process.env.OPENAI_API_KEY) {
    return `前提: ${premise1} / ${premise2}。このコードは ${code.split("\n").length} 行で目的を実現しています。`;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: `以下のコードを日本語で120文字以内で要点解説してください。\\n前提1:${premise1}\\n前提2:${premise2}\\nコード:\\n${code}`
          }
        ],
        max_output_tokens: 200
      })
    });

    if (!response.ok) return "AI解説の生成に失敗しました。";
    const json = await response.json();
    const out = json?.output?.[0]?.content?.[0]?.text;
    return typeof out === "string" && out.length > 0 ? out : "AI解説の生成に失敗しました。";
  } catch {
    return "AI解説の生成に失敗しました。";
  }
}
