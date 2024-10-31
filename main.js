import { join } from "jsr:@std/path";
import { walk } from "jsr:@std/fs/walk";

function removeEmptyNested(obj) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value != null) {
      const cleaned = removeEmptyNested(value);
      const isEmpty =
        cleaned != null &&
        typeof cleaned === "object" &&
        Object.keys(cleaned).length === 0;
      if (!isEmpty) {
        result[key] = cleaned;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

const regex = /i18n\.translate\(\s*["'`]([^"'`]*)["'`]/g;

async function main() {
  const tsFiles = [];

  for await (const entry of walk(Deno.cwd(), {
    exts: [".ts"],
    includeDirs: true,
  })) {
    tsFiles.push(entry.path);
  }

  for (const file of tsFiles) {
    Deno.readTextFile(file).then((content) => {
      const setOfKey = new Set(
        [...content.matchAll(regex)].map((match) => match[1])
      );

      if (setOfKey.size) {
        import(join(currentDirectory, "translations/en.json"), {
          with: { type: "json" },
        }).then((translations) => {
          const data = translations.default;

          const allPaths = [];

          function dfs(obj, path = "") {
            for (const key in obj) {
              if (typeof obj[key] === "object") {
                dfs(obj[key], path + key + ".");
              } else {
                allPaths.push(path + key);
              }
            }
          }

          dfs(data);

          const unusedKeys = allPaths.filter((key) => !setOfKey.has(key));
          const filteredData = structuredClone(data);

          for (const key of unusedKeys) {
            const keys = key.split(".");
            let obj = filteredData;
            for (let i = 0; i < keys.length - 1; i++) {
              obj = obj[keys[i]];
            }
            delete obj[keys[keys.length - 1]];
          }

          const cleanedData = removeEmptyNested(filteredData);

          Deno.writeTextFile(
            join(currentDirectory, "translations/cleaned_en.json"),
            JSON.stringify(cleanedData, null, 2)
          );
        });
      }
    });
  }
}

main();
