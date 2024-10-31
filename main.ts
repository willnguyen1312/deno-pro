import { walk } from "jsr:@std/fs/walk";

async function collectTsFiles(directory: string) {
  const tsFiles: string[] = [];

  for await (const entry of walk(directory, {
    exts: [".json"],
    includeDirs: true,
  })) {
    tsFiles.push(entry.path);
  }

  return tsFiles;
}

async function main() {
  const currentDirectory = Deno.cwd() + "/src";
  const tsFiles = await collectTsFiles(currentDirectory);

  for (const file of tsFiles) {
    await import(file, {
      with: { type: "json" },
    }).then((content) => {
      console.log(content.default.message);
    });
  }
}

main();
