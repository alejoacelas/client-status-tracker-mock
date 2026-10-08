# Decisions

## Core decisions

### Replicas
- [Replicas are internal and unbranded](#internal-unbranded-replicas)
- [Third-party captures stay out of the repository](#reference-captures)

## Details

### Internal, unbranded replicas
Each replica copies its original's layout, palette and behaviour as closely as
the public material allows, so that design discussions can point at a concrete
page. Logos and brand names are replaced with "Fieldwork Studio". Anything
adopted from a replica is restyled before Varun uses it commercially.

### Reference captures
Screenshots, HTML and CSS captured from the original sites live in each
replica's ignored `reference/` folder. The repository is public, and the
captures belong to their owners.

## Decision log

- 2026-10-08: Deleted the Airtable and Supabase prototypes after the comparison
  (findings kept in README.md). Started the replica gallery.
