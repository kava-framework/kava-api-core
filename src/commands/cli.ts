import fs from "fs";
import path from "path";
import { Command } from "commander";

import { makeControllerCommand } from "./make/basic-controller";
import { makeSkalfaControllerCommand } from "./make/skalfa-controller";
import { barrelsCommand, watchBarrelsCommand } from "./runner/barrels";
import { makeModelCommand } from "./make/basic-model";
import { makeSeederCommand } from "./make/basic-seeder";
import { makeMigrationCommand } from "./make/basic-migration";
import { makeSkalfaModelCommand } from "./make/skalfa-model";
import { makeBlueprintCommand } from "./make/blueprint";
import { makeResourceCommand } from "./make/resource";
import { migrateCommand, migrateFreshCommand } from "./runner/migration";
import { seederCommand } from "./runner/seeder";
import { blueprintCommand } from "./runner/blueprint/runner";
import { generateDocsCommand } from "./runner/generate-docs";
import { makeQueueCommand } from "./make/queue";
import { makeMailCommand } from "./make/mail";
import { makeNotificationCommand } from "./make/notification";
import { makeDaMigrationCommand } from "./make/da-migration";
import { daMigrateCommand, daMigrateFreshCommand } from "./runner/da-migration";

export function runCli() {
  let dependencies: Record<string, string> = {};
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      dependencies = pkg.dependencies || {};
    }
  } catch {}

  const hasMail = !!dependencies["@skalfa/mail"] || !!dependencies["skalfa-mail"];
  const hasNotification = !!dependencies["@skalfa/notification"] || !!dependencies["skalfa-notification"];
  const hasQueue = !!dependencies["@skalfa/queue"] || !!dependencies["@skalfa/redis"] || !!dependencies["skalfa-queue"] || !!dependencies["skalfa-redis"];
  const hasDa = !!dependencies["@skalfa/da"] || !!dependencies["skalfa-da"] || !!dependencies["@clickhouse/client"];

  const program = new Command();
  program.name("skalfa").description("Skalfa-api CLI").version("1.0.0");

  program.addCommand(barrelsCommand);

  program.addCommand(makeControllerCommand);
  program.addCommand(makeSkalfaControllerCommand);
  program.addCommand(watchBarrelsCommand);
  program.addCommand(makeModelCommand);
  program.addCommand(makeMigrationCommand);
  program.addCommand(makeSeederCommand);
  program.addCommand(makeSkalfaModelCommand);
  program.addCommand(makeBlueprintCommand);
  program.addCommand(makeResourceCommand);

  program.addCommand(migrateCommand);
  program.addCommand(migrateFreshCommand);
  program.addCommand(seederCommand);
  program.addCommand(blueprintCommand);
  program.addCommand(generateDocsCommand);

  if (hasMail) {
    program.addCommand(makeMailCommand);
  }

  if (hasNotification) {
    program.addCommand(makeNotificationCommand);
  }

  if (hasQueue) {
    program.addCommand(makeQueueCommand);
  }

  if (hasDa) {
    program.addCommand(makeDaMigrationCommand);
    program.addCommand(daMigrateCommand);
    program.addCommand(daMigrateFreshCommand);
  }

  program.parse(process.argv);
}
