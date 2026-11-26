# Wrapping paper

Drafts release notes from the pull requests merged since your last tag, grouped
into breaking changes, new features, fixes and other changes, with a suggested
next version. Label an issue `wrapping-paper` and the draft arrives as a comment
on it, for a person to edit and publish.

**Safe by default:** it posts one comment. It never creates a tag or a release,
pushes, merges or deletes, and needs no secret beyond the factory's GitHub
access.

## Install

```sh
tessl install github:AINativeDev/Carnival-Factory --skill wrapping-paper
```

## Trigger to copy

Add this to your `tessl.json`, then run `tessl loop validate`. It runs when a
person adds the `wrapping-paper` label to an issue.

```json
{
  "actions": {
    "wrapping-paper": {
      "agent": "claude",
      "skill": "carnival-christmas-public/north-pole-gifts#wrapping-paper"
    }
  },
  "triggers": {
    "wrapping-paper-labelled": {
      "on": ["github:issues.labeled"],
      "when": { "event.label.name": "wrapping-paper", "event.sender.type": "User" },
      "action": {
        "use": "wrapping-paper",
        "inputs": { "GITHUB_ISSUE_NUMBER": "{{ event.issue.number }}" }
      }
    }
  }
}
```

See [the worked example](example.md) for a run on a sample repository.
