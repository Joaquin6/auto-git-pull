"use strict";

const {
  readConfig,
  validateProjectsDirectory,
  writeConfig
} = require("../../config");
const { log } = require("../../utils");
const git = require("../../modules/git");
const { buildProjectDirectoryList } = require("../project-directory");

function fetchFromGit(path, silent) {
  silent ? log.infoSilent(`Fetching ${path}`) : log.info(`Fetching ${path}`);
  return git.gitExec(path, "fetch");
}

function* fetchProjectsFromGit(silent) {
  const projectDirectoryList = buildProjectDirectoryList();

  for (const projectDirectory of projectDirectoryList) {
    yield fetchFromGit(projectDirectory, silent);
  }
}

function runGitStatus(path) {
  return git.gitExec(path, "status");
}

function* runStatusOnProjects() {
  const projectDirectoryList = buildProjectDirectoryList();

  for (const projectDirectory of projectDirectoryList) {
    yield { [projectDirectory]: runGitStatus(projectDirectory) };
  }
}

function* getPullableProjects() {
  const statuses = runStatusOnProjects();

  const pattern = /Your branch is behind .*? by \d+ commits?, and can be fast-forwarded/gm;

  for (const status of statuses) {
    const project = Object.getOwnPropertyNames(status)[0];
    if (status[project].search(pattern) >= 0) {
      yield project;
    }
  }
}

function runGitPull(path, silent) {
  silent ? log.infoSilent(`Pulling ${path}`) : log.info(`Pulling ${path}`);
  let gitPullResult;
  try {
    gitPullResult = git.gitExec(path, "pull");
  } catch (error) {
    gitPullResult = `${path} can't be pulled right now.`;
  }
  return gitPullResult;
}

function* pullProjectsFromGit(silent) {
  for (const project of getPullableProjects()) {
    yield runGitPull(project, silent);
  }
}

module.exports = {
  fetchProjectsFromGit,
  runStatusOnProjects,
  getPullableProjects,
  pullProjectsFromGit,
  runGitPull
};
