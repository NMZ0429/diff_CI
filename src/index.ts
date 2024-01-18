import { getInput, setFailed } from "@actions/core";
import { Octokit } from "@octokit/rest";

const { GITHUB_REPOSITORY, GITHUB_SHA } = process.env;
if (!GITHUB_REPOSITORY) {
	setFailed("GITHUB_REPOSITORY is not defined");
}
if (!GITHUB_SHA) {
	setFailed("GITHUB_SHA is not defined");
}
const [owner, repo] = GITHUB_REPOSITORY.split("/");
const pull_number = process.env.GITHUB_REF.split("/").slice(-2)[0];
const token = getInput("github-token");
const octokit = new Octokit({ auth: `token ${token}` });
octokit.pulls
	.get({
		owner: owner,
		repo: repo,
		pull_number: +pull_number,
		mediaType: {
			format: "diff",
		},
	})
	.then(({ data }) => {
		const lines = data.toString().split("\n");
		const count = lines.filter(
			(line) => line.startsWith("+ ") || line.startsWith("- ")
		).length;
		// TODO: return the result
		console.log(count);
	})
	.catch((err) => {
		setFailed(`Error: ${owner}/${repo}#${pull_number} ${err.message}`);
	});
