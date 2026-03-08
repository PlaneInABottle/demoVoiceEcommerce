import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findNearestPackageRoot(startDirectory: string) {
  let currentDirectory = startDirectory;

  while (true) {
    if (existsSync(join(currentDirectory, 'package.json'))) {
      return currentDirectory;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      throw new Error(`Could not resolve an agent package root from ${startDirectory}`);
    }

    currentDirectory = parentDirectory;
  }
}

export function getAgentPackageRoot() {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  return findNearestPackageRoot(currentDirectory);
}

export function getRepoRoot() {
  return resolve(getAgentPackageRoot(), '..');
}

export function getRootEnvPath() {
  return join(getRepoRoot(), '.env');
}

export function getProductCatalogPath() {
  return join(getRepoRoot(), 'data', 'products.json');
}
