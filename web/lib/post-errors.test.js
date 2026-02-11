import { describe, expect, it } from "bun:test";
import { buildInvalidPostRedirect, resolveCreatePostErrorMessage } from "@/lib/post-errors";
import { createPostSchema } from "@/lib/validators";

describe("post error helpers", () => {
  it("builds invalid post redirect with details", () => {
    const url = buildInvalidPostRedirect("コードは7行以内にしてください");
    const query = url.split("?")[1] ?? "";
    const params = new URLSearchParams(query);

    expect(url.startsWith("/?")).toBe(true);
    expect(params.get("error")).toBe("invalid_post");
    expect(params.get("post_error")).toBe("コードは7行以内にしてください");
  });

  it("can build invalid post redirect for a custom path", () => {
    const url = buildInvalidPostRedirect("前提文は2行以内で入力してください", "/posts/abc");
    const [path, query] = url.split("?");
    const params = new URLSearchParams(query ?? "");

    expect(path).toBe("/posts/abc");
    expect(params.get("error")).toBe("invalid_post");
    expect(params.get("post_error")).toBe("前提文は2行以内で入力してください");
  });

  it("returns custom validation message from createPostSchema", () => {
    const payload = {
      premiseText: "前提が1行だけ",
      code: "1\n2\n3\n4\n5\n6\n7\n8",
      language: "TypeScript",
      version: "latest",
      tags: ""
    };
    const parsed = createPostSchema.safeParse(payload);
    expect(parsed.success).toBe(false);

    if (parsed.success) return;
    expect(resolveCreatePostErrorMessage(parsed.error)).toBe("コードは7行以内にしてください");
  });

  it("maps missing field errors to Japanese labels", () => {
    const parsed = createPostSchema.safeParse({
      code: "",
      language: "TypeScript",
      version: "latest",
      tags: ""
    });
    expect(parsed.success).toBe(false);

    if (parsed.success) return;
    expect(resolveCreatePostErrorMessage(parsed.error)).toBe("コードを入力してください");
  });

  it("allows empty premise/language/version/tags", () => {
    const parsed = createPostSchema.safeParse({
      premiseText: "",
      code: "console.log('ok')",
      language: "",
      version: "",
      tags: ""
    });
    expect(parsed.success).toBe(true);
  });
});
