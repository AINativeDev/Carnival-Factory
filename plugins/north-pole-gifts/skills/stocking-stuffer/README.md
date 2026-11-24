# Stocking stuffer

A weekly loop that opens one pull request bumping a single outdated dependency,
with its changelog summarised. Patch releases first, then minor, then major. It
skips a version you already closed, and waits while its last pull request is
open.

**Safe by default:** it opens a pull request on its own branch and nothing more.
It never merges, deletes or pushes to your default branch, and needs no secret
beyond the factory's GitHub access.

## Install

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill stocking-stuffer
```

## Trigger to copy

Add this to your `tessl.json`, then run `tessl loop validate`. It runs every
Monday morning.

```json
{
  "actions": {
    "stocking-stuffer": {
      "agent": "claude",
      "skill": "carnival-christmas-public/north-pole-gifts#stocking-stuffer"
    }
  },
  "schedules": {
    "stocking-stuffer-weekly": { "cron": "17 9 * * 1", "action": "stocking-stuffer" }
  }
}
```

See [the worked example](example.md) for a run on a sample repository.
