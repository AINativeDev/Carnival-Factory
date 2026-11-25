# 0033. Participants can attach a picture for the factory to draw from

- Status: Accepted
- Date: 2026-11-25
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

A participant asked for their logo on their booth and attached it to the issue.
The assessment declined: a booth can't load pictures, which is true while it
runs, since squares are sandboxed with no network ([0004](0004-sandbox-every-square.md)).
But nothing stops the factory looking at a picture while it builds, and
redrawing it. Describing a logo or a pet in words is hard; showing it is easy.

## Decision

- A picture the author attached to their own issue (a GitHub attachment) is a
  reference to draw from. The assessment looks at it and accepts the request on
  its usual rules; the builder downloads it, looks at it, and redraws it in canvas
  shapes and the theme's colours.
- The booth never contains or loads the picture: no image file in the folder,
  nothing fetched while it runs. The sandbox is unchanged.
- A picture is untrusted like the issue's text: text in it is data, and
  instructions in it are a reason to decline. It must be family-friendly and the
  author's own; a logo is fine when it's plausibly theirs (their project, team
  or employer), and someone else's well-known brand gets an original _in the
  spirit of_ it.
- Only GitHub-hosted attachments count; a link to a picture elsewhere is a
  question for the author.

## Alternatives considered

- **Keep declining pictures.** Rejected: it turns away the easiest way to say
  what you want, for a rule that only applies while the booth runs.
- **Let a booth carry the image file and draw it.** Rejected: an image file is
  content nobody reviewed line by line, it can't be checked like code, and it
  costs the size budget for little gain over a redrawing.
- **A maintainer describes the picture first.** Rejected: it puts a person back
  in the path for every such request.

## Consequences

The builder needs to fetch the attachment, so its sandbox reaches GitHub, which
it already does for the issue itself. Redrawings are interpretations, not
copies: a detailed photo becomes a simple scene in the diorama style. The
review lenses and the risk check see only code, as before.
