# Tidy elf

A weekly loop that checks the README's commands and links still work, and opens
one issue listing the ones that don't. It runs only commands that build, test,
lint or start the project, skips anything that deploys or needs a secret, and
keeps one issue current instead of opening a new one each week.

**Safe by default:** it only reads, and opens or comments on one issue. It never
commits, merges or deletes, and needs no secret beyond the factory's GitHub
access.

## Install

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill tidy-elf
```

## Trigger to copy

Add this to your `tessl.json`, then run `tessl loop validate`. It runs every
Wednesday morning.

```json
{
  "actions": {
    "tidy-elf": {
      "agent": "claude",
      "skill": "carnival-christmas-public/north-pole-gifts#tidy-elf"
    }
  },
  "schedules": {
    "tidy-elf-weekly": { "cron": "23 9 * * 3", "action": "tidy-elf" }
  }
}
```

See [the worked example](example.md) for a run on a sample repository.
