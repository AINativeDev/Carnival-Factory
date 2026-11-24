# Snow plough

A monthly loop that finds branches and draft pull requests nobody has touched in
90 days, and lists them in one issue for a person to decide on. It puts merged
branches first, since they're the easy ones, and keeps the same issue current
instead of opening a new one each month.

**Safe by default:** it never deletes a branch or closes a pull request. It only
reads, and opens or comments on its one issue, with no secret beyond the
factory's GitHub access.

## Install

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill snow-plough
```

## Trigger to copy

Add this to your `tessl.json`, then run `tessl loop validate`. It runs on the
first morning of each month.

```json
{
  "actions": {
    "snow-plough": {
      "agent": "claude",
      "skill": "carnival-christmas-public/north-pole-gifts#snow-plough"
    }
  },
  "schedules": {
    "snow-plough-monthly": { "cron": "41 8 1 * *", "action": "snow-plough" }
  }
}
```

See [the worked example](example.md) for a run on a sample repository.
