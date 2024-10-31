import { join } from "jsr:@std/path";
import { walk } from "jsr:@std/fs/walk";

async function collectTsFiles(directory) {
  const tsFiles = [];

  for await (const entry of walk(directory, {
    exts: [".ts"],
    includeDirs: true,
  })) {
    tsFiles.push(entry.path);
  }

  return tsFiles;
}

const regex = /i18n\.translate\(\s*["'`]([^"'`]*)["'`]/g;

function isEmptyObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    !Array.isArray(obj) &&
    Object.keys(obj).length === 0
  );
}

function removeEmptyNested(obj) {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // Recursively clean nested objects
      const cleaned = removeEmptyNested(value);
      // Only add non-empty objects to result
      if (!isEmptyObject(cleaned)) {
        result[key] = cleaned;
      }
    } else {
      // Keep non-object values as is
      result[key] = value;
    }
  }

  return result;
}

async function main() {
  const currentDirectory = Deno.cwd() + "/src";
  const tsFiles = await collectTsFiles(currentDirectory);

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
          // Write back to the file
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
