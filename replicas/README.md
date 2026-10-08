# Design references

Internal, unbranded replicas of well-known status-page patterns, all filled with
the mock data in [../seed/seed.json](../seed/seed.json). Pick one as a base and
describe changes against it.

| Replica | Original | Best for |
| --- | --- | --- |
| [statuspage](statuspage/) | Atlassian Statuspage ([githubstatus.com](https://www.githubstatus.com)) | Retainers with several parallel areas of work |
| [github-roadmap](github-roadmap/) | GitHub Projects roadmap layout | Date-driven work with overlapping phases |
| [linear-updates](linear-updates/) | Linear project updates | When the written narrative matters most |
| [now-next-later](now-next-later/) | ProdPad Now / Next / Later roadmap | Avoiding date commitments |
| [hill-chart](hill-chart/) | Basecamp Hill Charts | Design work where percentages mislead |
| [delivery-tracker](delivery-tracker/) | Domino's Pizza Tracker | One project moving through fixed stages |
| [portfolio-table](portfolio-table/) | Asana portfolios | Clients with many projects |

Run one with `cd <name> && npm install && npm run dev`.
