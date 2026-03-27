---
name: publish-blog-post
description: >
  Publish a new blog post to the NW Homeworks static site (nwhomeworks.com). Use this skill whenever the user
  wants to write, create, draft, or publish a blog post, article, or project story. Also use it when the user
  says things like "new post", "write up this project", "let's do a blog about...", "here are the photos for
  the next post", or provides project images and details for content creation. Covers the full workflow: keyword
  research with Semrush, writing the draft, building the HTML page, updating the blog index and sitemap,
  and deploying via git push.
---

# Publish Blog Post — NW Homeworks

This skill handles the end-to-end process of publishing a new blog post to nwhomeworks.com — from keyword research through writing, HTML construction, and deployment.

## Site details

- **Repo**: `C:\Users\tim\nwhomeworks-static`
- **Hosting**: Cloudflare Pages, auto-deploys from GitHub on push to main
- **Blog posts**: `/blog/{slug}/index.html` (each post gets its own directory)
- **Images**: `/images/blog/` (all blog images live here, flat directory)
- **Blog index**: `blog/index.html` (featured post + grid of older posts)
- **Sitemap**: `sitemap.xml` (add new URL entry for each post)
- **Author**: Tim Hutchinson, Owner & General Contractor, NW Homeworks
- **Analytics**: Google Analytics `G-KVJ4CWM5DR`

## Workflow

Follow these phases in order. Each phase has a natural checkpoint where you pause for user input before continuing.

### Phase 1: Gather inputs

Tim typically provides:
- A verbal description of the project (location, what was done, challenges, interesting details)
- A folder path containing numbered images in sequence (e.g., `image-0.webp` through `image-7.webp`)
- Sometimes additional details trickle in across multiple messages — collect everything before writing

**Do this:**
1. List the image folder contents to see what you're working with
2. Read every image to understand the visual story and construction sequence
3. Read the writing style memory at `.claude/projects/C--Users-tim-nwhomeworks-static/memory/feedback_writing_style.md` (or whichever project memory path is active) for tone and style reminders
4. Confirm you have enough detail to write. If anything is unclear, ask Tim before proceeding.

### Phase 2: Keyword research (Semrush)

Before writing a single word, research keywords to make sure the post targets terms people actually search for.

**Do this:**
1. Brainstorm 5-10 keyword phrases relevant to the project (think about what a homeowner would Google)
2. Run these Semrush tools:
   - `semrush_keyword_overview` — get volume and competition for your top keyword ideas
   - `semrush_related_keywords` — find related terms you might not have thought of
   - `semrush_broad_match_keywords` — discover alternate phrasings
   - `semrush_batch_keyword_overview` — check a batch of candidates at once
   - `semrush_keyword_difficulty` — confirm difficulty scores for your best candidates
   - `semrush_phrase_questions` — find question-based keywords (great for H2 headings)
3. Present a summary table to Tim showing the best targets: keyword, monthly volume, and difficulty score
4. Recommend which keywords to target in the title, headings, and body copy
5. Get Tim's sign-off before writing

**What makes a good target:** Volume 50+ with difficulty under 30 is the sweet spot for a local contractor site. Even low-volume long-tail keywords (20-50/mo) are worth targeting if they're highly relevant and have very low difficulty. Local modifiers (city names) typically have low volume but very high intent.

### Phase 3: Write the draft

Write the blog post content and present it to Tim for review. Do NOT build the HTML yet — just the text.

**Present these elements:**
- **Title** (H1) — should include the primary keyword naturally, under ~70 characters
- **Meta description** — 1-2 sentences, include primary keyword, under 160 characters
- **Full body text** — with H2 subheadings and image placement notes

**Writing style (from Tim's preferences):**
- Conversational, knowledgeable contractor voice — not salesy or overly polished
- Story-driven: frame the project as a narrative with a beginning (the problem/need), middle (the work and challenges), and end (the result)
- Focus on real challenges, creative solutions, and craftsmanship details
- Don't repeat the same keyword multiple times in quick succession
- Don't use names of former employees — use roles like "our designer" instead
- Verify material/finish names with Tim — he's precise about these
- End strong — the best content shouldn't be buried in the middle
- Always close with a CTA linking to `/contact/` and the phone number `(253) 448-9462`

**Iterate until Tim approves.** He usually gives feedback on phrasing, detail accuracy, and paragraph order. Incorporate it and re-present.

### Phase 4: Build and deploy

Once Tim approves the content, build the full HTML page and deploy in one shot.

#### 4a. Choose the slug
Pick a kebab-case, SEO-friendly URL slug based on the title. Keep it concise (3-5 words). Examples:
- `bedroom-addition-bothell`
- `does-ikea-do-kitchen-installation`
- `view-ridge-remodel-part-one-fireplace-feature-wall`

#### 4b. Copy images
Copy all images from Tim's source folder to `/images/blog/` in the repo. Keep the original filenames — they're typically already descriptive and web-ready.

#### 4c. Create the HTML page
Create `/blog/{slug}/index.html` using the template structure below. Reference an existing post like `blog/does-ikea-do-kitchen-installation/index.html` for the exact HTML if you need to double-check anything.

**Template structure:**
```html
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="follow, index, max-snippet:-1, max-video-preview:-1, max-image-preview:large">
  <meta name="pinterest" content="noform">
  <title>{Post Title} | NW Homeworks</title>
  <meta name="description" content="{meta description}">
  <link rel="canonical" href="https://www.nwhomeworks.com/blog/{slug}/">
  <meta property="og:locale" content="en_US">
  <meta property="og:type" content="article">
  <meta property="og:title" content="{Post Title} | NW Homeworks">
  <meta property="og:description" content="{meta description}">
  <meta property="og:url" content="https://www.nwhomeworks.com/blog/{slug}/">
  <meta property="og:site_name" content="NW Homeworks">
  <meta property="og:image" content="/images/blog/{hero-image-filename}">
  <meta property="article:published_time" content="{YYYY-MM-DD}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{Post Title}",
    "description": "{meta description}",
    "author": {
      "@type": "Person",
      "name": "Tim Hutchinson",
      "jobTitle": "Owner & General Contractor",
      "worksFor": {
        "@type": "GeneralContractor",
        "name": "NW Homeworks",
        "url": "https://www.nwhomeworks.com",
        "address": {"@type": "PostalAddress", "addressLocality": "Tacoma", "addressRegion": "Washington", "postalCode": "98405", "addressCountry": "United States"}
      }
    },
    "publisher": {
      "@type": "Organization",
      "name": "NW Homeworks",
      "url": "https://www.nwhomeworks.com"
    },
    "datePublished": "{YYYY-MM-DD}",
    "image": "https://www.nwhomeworks.com/images/blog/{hero-image-filename}",
    "mainEntityOfPage": "https://www.nwhomeworks.com/blog/{slug}/"
  }
  </script>
  <!-- If the post answers common questions, add FAQPage schema here too -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=Outfit:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&family=Urbanist:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/blog.css" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="/css/blog.css"></noscript>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-KVJ4CWM5DR"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-KVJ4CWM5DR');</script>
</head>
<body>

  <!-- HEADER: copy exactly from an existing post -->
  <header class="site-header">...</header>
  <nav class="mobile-nav">...</nav>

  <div class="post-featured-image">
    <img src="/images/blog/{hero-image}" alt="{descriptive alt text}" fetchpriority="high">
  </div>

  <div class="post-header">
    <h1>{Post Title}</h1>
    <div class="post-meta">{Month DD, YYYY} &bull; By Tim Hutchinson</div>
  </div>

  <div class="post-content">
    <!-- Blog post body goes here -->
    <!-- Use <figure> with <figcaption> for images -->
    <!-- All non-hero images get loading="lazy" -->
  </div>

  <!-- CTA SECTION: copy exactly from an existing post -->
  <section class="testimonial-cta-section">...</section>

  <!-- FOOTER: copy exactly from an existing post -->
  <footer class="site-footer">...</footer>

  <script defer src="/js/main.js"></script>
</body>
</html>
```

**Important HTML details:**
- The hero image uses `fetchpriority="high"` (no `loading="lazy"`)
- All other images use `loading="lazy"`
- Every image should be wrapped in `<figure>` with a `<figcaption>`
- Use `&mdash;` for em dashes, `&ndash;` for en dashes, `&ldquo;`/`&rdquo;` for smart quotes
- Copy the exact header, mobile-nav, CTA section, and footer HTML from the most recent existing post — these are shared boilerplate

#### 4d. Update the blog index

Edit `blog/index.html`:
1. Replace the current featured post (`blog-featured` section) with the new post
2. Insert the old featured post as the first card in the `blog-grid` section
3. The new featured post needs: image, category tag, title, excerpt (1-2 sentences), and date
4. The demoted post becomes a standard `blog-card` matching the format of the other cards in the grid

#### 4e. Update the sitemap

Add the new post URL to `sitemap.xml`, placed right before the other blog entries:
```xml
<url><loc>https://www.nwhomeworks.com/blog/{slug}/</loc><changefreq>yearly</changefreq><priority>0.6</priority></url>
```

#### 4f. Commit and push

```bash
git add blog/{slug}/index.html images/blog/{image-files} blog/index.html sitemap.xml
git commit -m "Add blog post: {short title description}"
git push
```

The site auto-deploys on Cloudflare Pages within a minute or two of the push.

## Category tags

Choose the most appropriate category for the blog index card. Existing categories used on the site:
- IKEA Kitchens
- IKEA Hacks
- Kitchens
- Bathrooms
- Built-Ins
- Apartments
- Fireplace
- Room Additions
- Uncategorized

Use an existing category when possible. Create a new one only if nothing fits.

## Checklist (use this to verify nothing is missed)

- [ ] Images reviewed and understood
- [ ] Keyword research completed and presented
- [ ] Draft written and approved by Tim
- [ ] Images copied to `/images/blog/`
- [ ] Blog post HTML created at `/blog/{slug}/index.html`
- [ ] Blog index updated (new featured post, old one demoted)
- [ ] Sitemap updated with new URL
- [ ] Git commit and push completed
- [ ] Confirmed deployment URL to Tim
