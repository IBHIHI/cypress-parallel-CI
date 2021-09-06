import { Given } from "@cucumber/cucumber";
import path from "path";
import { promises as fs } from "fs";
import { name as packageName } from "../../package.json";

async function addOrUpdateConfiguration(
  absoluteConfigPath: string,
  additionalJsonContent: string
) {
  let existingConfig: any;

  try {
    existingConfig = JSON.parse(
      (await fs.readFile(absoluteConfigPath)).toString()
    );
  } catch (e: any) {
    if (e.code === "ENOENT") {
      existingConfig = {};
    } else {
      throw e;
    }
  }

  await fs.writeFile(
    absoluteConfigPath,
    JSON.stringify(
      {
        ...existingConfig,
        ...JSON.parse(additionalJsonContent),
      },
      null,
      2
    )
  );
}

Given("additional Cypress configuration", async function (jsonContent) {
  const absoluteConfigPath = path.join(this.tmpDir, "cypress.json");

  await addOrUpdateConfiguration(absoluteConfigPath, jsonContent);
});
