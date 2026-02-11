import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

/** 言語名を react-syntax-highlighter が認識する名前に正規化する */
function normalizeLang(language: string): string {
    const l = language.toLowerCase().trim();
    const map: Record<string, string> = {
        js: "javascript",
        jsx: "javascript",
        ts: "typescript",
        tsx: "typescript",
        react: "javascript",
        py: "python",
        sh: "shell",
        zsh: "bash",
        yml: "yaml",
        md: "markdown",
        htm: "html",
        "c++": "cpp",
        objc: "objectivec",
        rs: "rust",
        rb: "ruby",
        kt: "kotlin",
        regex: "javascript",
        git: "bash",
        glsl: "glsl",
    };
    return map[l] ?? l;
}

export function CodeRenderer({
    language,
    code,
}: {
    language: string;
    code: string;
}) {
    const lang = useMemo(() => normalizeLang(language), [language]);

    return (
        <View style={styles.container}>
            <SyntaxHighlighter
                language={lang}
                style={atomOneDark}
                customStyle={customCodeStyle}
                fontSize={12}
            >
                {code}
            </SyntaxHighlighter>
        </View>
    );
}

const customCodeStyle = {
    backgroundColor: "#0a0f1d",
    borderRadius: 10,
    padding: 10,
    margin: 0,
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#1f2d5a",
        overflow: "hidden",
    },
});
