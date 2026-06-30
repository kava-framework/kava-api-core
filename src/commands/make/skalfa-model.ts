import path from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { Command } from "commander";
import { conversion, logger } from "@utils";
import { makeSkalfaController } from "./skalfa-controller";
import { makeMigration } from "./basic-migration";
import { makeSeeder } from "./basic-seeder";
import { skalfaModelStub } from "../stubs";



// =====================================>
// ## Command: make:skalfa-model
// =====================================>
export const makeSkalfaModelCommand = new Command("make:skalfa-model")
  .argument("<name>", "Name of model")
  .option("-r", "Generate all resource (controller, migration, seeder)")
  .description("Make the Skalfa Model")
  .action((name, options) => {
    makeSkalfaModel(name);

    if (options.r) {
      makeSkalfaController(name);
      makeMigration("create_" + name, { init: true });
      makeSeeder(name);
    }
    
    process.exit(0);
  });

export const makeSkalfaModel = (modelName: string) => {
  const name = conversion.strPascal(modelName);
  const filename = conversion.strSlug(modelName) + ".model.ts";

  const basePath = path.join(process.cwd(), "app", "models");

  if (!existsSync(basePath)) {
    mkdirSync(basePath, { recursive: true });
  }

  const filePath = path.join(basePath, filename);

  if (existsSync(filePath)) {
    logger.error(`Model ${name} already exists!`);
    return;
  }

  let stub = skalfaModelStub;

  stub = stub
    .replace(/{{\s*name\s*}}/g, name)
    .replace(/{{\s*fields\s*}}/g, "")
    .replace(/{{\s*attributes\s*}}/g, "")
    .replace(/{{\s*relations\s*}}/g, "")
    .replace(/{{\s*hooks\s*}}/g, "")
    .replace(/{{\s*import\s*}}/g, "")
    .replace(/{{\s*import_utils\s*}}/g, "")
    .replace(/{{\s*marker\s*}}/g, "");

  writeFileSync(filePath, stub);

  logger.info(`Successfully create light model ${name}!`);
};
