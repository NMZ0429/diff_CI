# Count the number of lines with difference

## Description

### What is this?

This is a simple GitHub Action that counts the number of lines differed between two branches in a pull request.

What specifically this action does is as follows:

1. It counts the number of lines with addition and deletion (i.e., lines beginning with `+` or `-`) in the diff of a pull request.
2. If the sum exceeds the first threshold, it raises a warning while it's still marked as a success.
3. If the sum exceeds the second threshold, it raises an error and returns a failure.

The two thresholds are set to 300 and 500 by default, but you can change them by setting the `good-num-lines` and `max-num-lines` inputs respectively.

### How to use it?

The following is an example of a workflow file that triggers the action on pull request events.
You do not need to set any secrets for this action as GITHUB_TOKEN is automatically provided by GitHub Actions.

```yaml
on:
  pull_request:
    types:
      - opened

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: NMZ0429/diff_CI@v1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```
