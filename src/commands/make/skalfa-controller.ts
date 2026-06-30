import path from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { Command } from "commander";
import { conversion, logger } from "@utils";
import { skalfaControllerStub } from "../stubs";



// =====================================>
// ## Command: make:skafa-controller
// =====================================>
export const makeSkalfaControllerCommand = new Command("make:skalfa-controller")
  .argument("<name>", "Name of controller")
  .option("-m, --model <model>", "Attach model to controller")
  .description("Make the Skalfa Controller")
  .action((name, options) => {
      makeSkalfaController(name, options.model);
      process.exit(0);
  });

export const makeSkalfaController = (controllerName: string, modelName?: string) => {
  const basePath = path.join(process.cwd(), "app", "controllers");

  if (!controllerName || controllerName.trim() === "") {
    logger.error("Controller name invalid!");
    process.exit(1);
  }

  const names = controllerName.split("/");
  const realName = names[names.length - 1];
  const name = conversion.strPascal(realName) + "Controller";
  const filename = conversion.strSlug(realName) + ".controller.ts";
  const model = modelName || conversion.strPascal(realName);

  names.pop();
  const folder = names.join("/");

  const filePath = path.join(basePath, filename);

  if (existsSync(filePath)) {
    logger.error("Controller already exists!");
    process.exit(1);
  }

  const targetDir = folder ? path.join(basePath, folder) : basePath;
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
    logger.info(`Create folder ${targetDir}...`);
  }

  let stub = skalfaControllerStub;

  stub = stub.replace(
    /{{\s*name\s*}}|{{\s*model\s*}}|{{\s*validations\s*}}|{{\s*marker\s*}}/g,
    (match) => {
      switch (match) {
        case "{{ name }}":
          return name;
        case "{{ model }}":
          return model;
        default:
          return "";
      }
    }
  );

  writeFileSync(filePath, stub);
  logger.info(`Successfully create light controller: ${filePath}!`);
};
