export const MAX_CODE_LINE_LENGTH = 200;

export function wrapCodeLinesByMaxChars(input: string, maxChars = MAX_CODE_LINE_LENGTH) {
  return input
    .split("\n")
    .map((line) => {
      if (line.length <= maxChars) return line;
      const chunks: string[] = [];
      for (let i = 0; i < line.length; i += maxChars) {
        chunks.push(line.slice(i, i + maxChars));
      }
      return chunks.join("\n");
    })
    .join("\n");
}
