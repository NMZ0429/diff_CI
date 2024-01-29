# Count the number of lines with difference

## Description

### What is this?

This is a simple GitHub Action that counts the number of lines differed between two branches in a pull request.

What specifically this action does is as follows:

1. It counts the number of lines with addition and deletion (i.e., lines beginning with `+` or `-`) in the diff of a pull request.
2. If the sum exceeds the first threshold, it posts a warning while it's still marked as a success.
3. If the sum exceeds the second threshold, it raises an error and returns a failure.

The two thresholds are set to 300 and 500 by default, but you can change them by setting the `good-num-lines` and `max-num-lines` inputs respectively.

### How to use it?

The following is an example of a workflow file that triggers the action on pull request events.
**Copy and paste it to your workflow file, and you're good to go.**
You do not need to set any secrets for this action as GITHUB_TOKEN is automatically provided by GitHub Actions.

```yaml
on:
  pull_request:
    types:
      - opened

jobs:
  check:
    runs-on: ubuntu-latest
    permissions: write-all # required to post a warning
    steps:
      - uses: NMZ0429/diff_CI@v1.5
        with:
          good-num-lines: 200 # optional: default is 300
          max-num-lines: 400 # optional: default is 500
          ignore: '["**/*.d.ts", "**/*.jpg"]' # optional: default is '[]'
          disable-branches: '["develop", "main"]' # optional: default is ""
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

#### Warning

- Please use single quotes for the `ignore` input. Then use double quotes inside the single quotes.
