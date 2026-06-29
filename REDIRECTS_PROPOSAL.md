# Top 20 Redirect Map — techspian.com → new site

Old WordPress URLs that I found on the live site (sitemap + nav + homepage). Each is mapped to the most relevant page on the new build.

| # | Old URL (techspian.com)                                                                                       | → New page                | Why                                       |
| - | ------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------- |
| 1 | `/`                                                                                                           | `/` (homepage)            | Homepage stays homepage                   |
| 2 | `/about-us/`                                                                                                  | `/about.html`             | About → About                             |
| 3 | `/services/`                                                                                                  | `/capabilities.html`      | Services = capabilities now               |
| 4 | `/what-we-do/`                                                                                                | `/capabilities.html`      | Same intent                               |
| 5 | `/what-we-do/ai-and-ml/`                                                                                      | `/capabilities.html#ai`   | AI/ML capability                          |
| 6 | `/what-we-do/cloud-engineering-services/`                                                                     | `/capabilities.html#cloud`| Cloud capability                          |
| 7 | `/what-we-do/platform-engineering-services/`                                                                  | `/capabilities.html#platform` | Platform capability                   |
| 8 | `/what-we-do/mobile-app-development/`                                                                         | `/capabilities.html#mobile` | Mobile dev                              |
| 9 | `/mobile-app-development/`                                                                                    | `/capabilities.html#mobile` | Same                                    |
| 10 | `/contact-us/`                                                                                               | `/contact.html`           | Contact → Contact                         |
| 11 | `/techspian-careers/`                                                                                        | `/about.html#careers`     | Careers section on About (or `/contact`) |
| 12 | `/techspian-case-studies/`                                                                                   | `/work.html`              | Case studies → Our Work                   |
| 13 | `/case-studies/b2b-hotel-booking-platform-generated-436-6-million-in-sales/`                                  | `/work.html`              | Specific case study → work index          |
| 14 | `/case-studies/rebuilding-an-entire-flight-booking-engine-for-the-largest-canadian-travel-business/`         | `/work.html`              | TravelBrands case study                   |
| 15 | `/case-studies/created-worlds-first-ever-social-media-driven-hotel-booking-platform/`                         | `/work.html`              | Hotel booking case                        |
| 16 | `/case-studies/how-techspian-revolutionized-hotel-experience/`                                               | `/work.html`              | Hotel experience case                     |
| 17 | `/blogs/`                                                                                                    | `/`                       | Blog index → home (no blog on new site)   |
| 18 | `/blog/*` (any blog post)                                                                                    | `/`                       | All posts → home                          |
| 19 | `/rfp/`                                                                                                      | `/contact.html`           | RFP form → contact                        |
| 20 | `/press-and-media/`                                                                                          | `/about.html`             | Press → About                             |

## Catch-all

Any other `techspian.com/...` path that isn't in this list will fall through to the homepage `/` (no 404s during the transition).

## How these work on Render

Render's `render.yaml` static-site `routes` support `type: redirect` with `source` (old path) + `destination` (new path). The 301 happens at the edge before any HTML is served — no SEO loss.
