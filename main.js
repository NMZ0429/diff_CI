const core = require("@actions/core");
const { Octokit } = require("@octokit/rest");

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
const pull_number = process.env.GITHUB_REF.split("/").slice(-1)[0];
const token = core.getInput("github-token");
const octokit = new Octokit({ auth: `token ${token}` });
octokit.pulls
	.get({
		owner: owner,
		repo: repo,
		pull_number: pull_number,
		mediaType: {
			format: "diff",
		},
	})
	.then(({ data }) => {
		const lines = data.split("\n");
		const count = lines.filter(
			(line) => line.startsWith("+ ") || line.startsWith("- ")
		).length;
		// TODO: return the result
	})
	.catch((err) => {
		core.setFailed(err.message);
	});
