import { Octokit } from "octokit";

export default defineNuxtPlugin(() => {
  const octokit = new Octokit();

  return {
    provide: {
      octokit,
    },
  };
});
