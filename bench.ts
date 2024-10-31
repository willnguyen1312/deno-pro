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

async function main1() {
  const currentDirectory = Deno.cwd() + "/src";
  const tsFiles = await collectTsFiles(currentDirectory);

  for (const file of tsFiles) {
    await import(file, {
      with: { type: "json" },
    }).then((content) => {
      const data = content.default;
      console.log(data.message);
    });
  }
}

async function main2() {
  const currentDirectory = Deno.cwd() + "/src";
  const tsFiles = await collectTsFiles(currentDirectory);

  for (const file of tsFiles) {
    await Deno.readTextFile(file).then((content) => {
      const data = JSON.parse(content);
      console.log(data.message);
    });
  }
}

Deno.bench("run with default import", async function run1() {
  await main1();
});

Deno.bench("run with readTextFile", async function rune2() {
  await main2();
});
