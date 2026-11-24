# Gift tag

Labels each new issue by the area of the code it concerns, and when an issue is
too vague to act on, asks its author one clarifying question and adds
`needs-info`. It uses your `area:` labels, or your top-level folders when you
have none.

**Safe by default:** it only adds labels and posts at most one comment per
issue. It never closes, assigns or edits an issue, removes a person's label, or
needs a secret beyond the factory's GitHub access.

## Install

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill gift-tag
```

## Trigger to copy

Add this to your `tessl.json`, then run `tessl loop validate`. It runs when a
person opens an issue.

```json
{
  "actions": {
    "gift-tag": {
      "agent": "claude",
      "skill": "carnival-christmas-public/north-pole-gifts#gift-tag"
    }
  },
  "triggers": {
    "gift-tag-issue-opened": {
      "on": ["github:issues.opened"],
      "when": { "event.sender.type": "User" },
      "action": {
        "use": "gift-tag",
        "inputs": { "GITHUB_ISSUE_NUMBER": "{{ event.issue.number }}" }
      }
    }
  }
}
```

See [the worked example](example.md) for two issues on a sample repository.
