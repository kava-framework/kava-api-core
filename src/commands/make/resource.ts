import { Command } from "commander";
import { makeLightModel } from "./skalfa-model";
import { makeLightController } from "./skalfa-controller";
import { makeMigration } from "./basic-migration";
import { makeSeeder } from "./basic-seeder";



// =====================================>
// ## Command: make:resource
// =====================================>
export const makeResourceCommand = new Command("make:resource")
  .argument("<name>", "Name of resource")
  .description("Create a new model, migration, seeder, and controller for a resource")
  .action((name) => {
    makeLightModel(name);
    makeLightController(name);
    makeMigration("create_" + name, { init: true });
    makeSeeder(name);
    process.exit(0);
  });
