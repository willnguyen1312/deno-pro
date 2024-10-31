console.time("main.ts");
import { walk } from "jsr:@std/fs/walk";

async function collectTsFiles(directory: string) {
  const tsFiles: string[] = [];

  for await (const entry of walk(directory, {
    exts: [".ts"],
    includeDirs: true,
  })) {
    tsFiles.push(entry.path);
  }

  return tsFiles;
}

async function main() {
  const currentDirectory = Deno.cwd();
  const tsFiles = await collectTsFiles(currentDirectory);
  console.log("TypeScript files found: ", tsFiles.length);

  // Read the content of files in the most optimal way
  for (const file of tsFiles) {
    Deno.readTextFile(file).then((content) => {
      console.log(content);
    });
  }
}

main();
