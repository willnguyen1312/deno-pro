import { join, dirname } from "jsr:@std/path";
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

const regexKey = /i18n\.translate\(\s*["'`]([^"'`]*)["'`]/g;
const regexCallTranslate = /i18n\.translate/g;

async function main() {
  const collectedFiles = [];

  for await (const entry of walk(Deno.cwd(), {
    exts: [".tsx", ".ts"],
    skip: [/\.test\./],
    includeDirs: true,
  })) {
    collectedFiles.push(entry.path);
  }

  for (const file of collectedFiles) {
    Deno.readTextFile(file).then((content) => {
      const setOfKey = new Set(
        [...content.matchAll(regexKey)].map((match) => match[1])
      );

      const numberOFTranslateCalls = [...content.matchAll(regexCallTranslate)]
        .length;

      // Get current directory of the file
      const currentDirectory = dirname(file);

      const fileName = join(currentDirectory, "translations/en.json");

      if (setOfKey.size && numberOFTranslateCalls === setOfKey.size) {
        Deno.lstat(fileName)
          .then(() => {
            import(fileName, {
              with: { type: "json" },
            })
              .then((translations) => {
                const data = translations.default;

                const allPaths = [];

                function dfs(obj, path = "") {
                  for (const key in obj) {
                    const value = obj[key];
                    const isPlural = value && value.one && value.other;

                    if (typeof obj[key] === "object" && !isPlural) {
                      dfs(obj[key], path + key + ".");
                    } else {
                      allPaths.push(path + key);
                    }
                  }
                }

                dfs(data);

                const unusedKeys = allPaths.filter((key) => !setOfKey.has(key));

                for (const key of unusedKeys) {
                  const keys = key.split(".");
                  let obj = data;
                  for (let i = 0; i < keys.length - 1; i++) {
                    obj = obj[keys[i]];
                  }
                  delete obj[keys[keys.length - 1]];
                }

                const cleanedData = removeEmptyNested(data);

                Deno.writeTextFile(
                  join(currentDirectory, "translations/cleaned_en.json"),
                  JSON.stringify(cleanedData, null, 2)
                );
              })
              .catch((err) => {
                // console.error(err);
              });
          })
          .catch(() => {
            // console.error(`File ${fileName} not found`);
          });
      }
    });
  }
}

main();
