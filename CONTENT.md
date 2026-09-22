# Adding project media and certifications

The home page is `index.html`. Dedicated pages provide the full sections:
`about.html`, `research.html`, `projects.html`, `certifications.html`,
`education.html`, and `contact.html`. All pages are plain HTML, sharing `style.css` and
`script.js`, plus `theme.js` for appearance preferences; no build step is needed.
The main navigation and top-right Menu open the dedicated pages. Research appears
directly below About me in the Menu and has an in-progress note with no entries yet.
The Portfolio wordmark returns to the home page.

The home-page About section introduces the engineering work. Personal interests
appear only on `about.html`: sports and fitness, time outdoors, music and family,
reading, and Islam. Edit that page when changing those details. Technical skills remain
fully visible after the home-page introduction, grouped with spacing rather than
horizontal dividers.

Featured project explanations, photos, and videos appear directly below each
project on the homepage. The full archive keeps the expandable **Project details
& media** area for focused browsing, and it works without JavaScript.
Homepage videos autoplay muted while they are visible and pause when scrolled away;
controls remain available for sound and manual playback.
The four featured projects now include 13 photos/screenshots and five videos
from `Documents/ProjectDocumentations`. Images open at full size in a new tab.
Archive videos have native playback controls and poster previews; they remain click-to-play.
The Barbershop entry includes ten interface screenshots from
`assets/projects/barbershop/`. The portfolio entry retains placeholders for
future media.

With JavaScript enabled, a **Collapse project** button stays at the bottom-right
of the reading area while a project is expanded. It pauses videos and returns
you to the project summary with a brief transition. Reduced-motion preferences
disable the animation. The original summary remains usable without JavaScript.

## Light and dark themes

The **Dark theme** switch is inside the Menu panel on every page.
Light is the default. A visitor's choice is saved in their browser and shared
across the portfolio pages; switching still works if browser storage is blocked.
The loading screen follows the saved choice, while printed pages use light colors.
Switching themes reveals the new palette in a circle expanding from the switch
over 600 milliseconds. Browsers without snapshot-transition support blend the
background, text, and border colors over 500 milliseconds instead. Visitors who
prefer reduced motion get an immediate change.

`theme.js` handles the switch. A small inline script in each HTML head reads the
saved choice before the page appears. Theme colors are in `style.css`; keep the
matching critical loading-screen colors in each HTML head consistent when changing
the palette. The site uses light colors and hides the switch without JavaScript.

## Page, Menu, and scroll transitions

Links between portfolio pages navigate immediately. The arriving main content
gently fades from 72% to full opacity over 220 milliseconds as soon as it is ready,
with no vertical movement. The header and homepage sidebar stay steady. The Menu
opens with a small fade and downward movement, and its link arrows respond on hover
or keyboard focus. Section bookmarks, external links, resume links, and new-tab
actions retain their normal behavior. Reduced motion bypasses these effects.

The homepage introduces offscreen sections with a small fade and upward movement.
Project headings and descriptions reveal together; individual media rows enter as
visitors reach them. Interest items have a short stagger, while certificates simply
fade in. Each group animates once per page visit, and the initial viewport stays
immediately readable. Timing ranges from 320 to 420 milliseconds.

`script.js` uses the browser's intersection observer and animation APIs. Content
stays visible without JavaScript or animation support. Reduced-motion preferences,
keyboard focus, and printing bypass the effects so content stays accessible.

## Loading screen

The loading screen appears only when the initial page load takes more than
350 milliseconds. It clears when the stylesheet and page have loaded. Visitors
can select **Continue to portfolio** or press Escape to dismiss it; an
eight-second fallback also releases the page if a file stalls. Reduced-motion
preferences disable the moving indicator, and the page still works without
JavaScript.

Its styles and script stay near the top of each HTML page so the screen can appear
while `style.css` is still loading. Keep the stylesheet's `id="site-styles"`
and the accompanying `noscript` fallback when editing this area. This screen
covers initial loading; future photos and videos load within their project
areas using the settings below.

## Included project documentation

| Project folder | Photos / screenshots | Videos |
| --- | ---: | ---: |
| `assets/projects/vision-scale/` | 2 | 3 |
| `assets/projects/fruityvens/` | 2 | 1 |
| `assets/projects/robotic-arm/` | 2 | 1 |
| `assets/projects/ballclub/` | 7 | 0 |

Original files in `Documents/ProjectDocumentations` were preserved. Web videos
use H.264/AAC MP4 with faststart and total about 26.7 MB. They are fetched when
visitors choose to play; image previews use lazy loading.

The ending home-page sections are **Certifications & Seminars → Education →
Let’s Connect**. Education contains the academic history; technical skills appear
directly after About on the home page.
The complete certificate collection is linked from the certification section.

## Project photos

1. Create `assets/projects/` and put your image there. Use a short filename without
   spaces, for example `fruityvens-scale.webp`.
2. Find the project in `projects.html`. Featured projects also appear in
   `index.html`; update both copies. The research scale is `id="vision-scale"`,
   and the separate companion app is `id="fruityvens"`. Other featured IDs are
   `robotic-arm` and `ballclub`.
3. Inside its `.project-media` area, duplicate or replace an entire photo
   `<figure class="media-item">…</figure>` with this example. Update the filename,
   image description, caption, and dimensions to match your actual image.

```html
<figure class="media-item">
  <img
    class="project-image"
    src="assets/projects/fruityvens-scale.webp"
    alt="Describe what your photo actually shows"
    width="1600"
    height="1000"
    loading="lazy"
    decoding="async">
  <figcaption>
    <span class="media-type">PHOTO</span>
    Your caption about the build or result
  </figcaption>
</figure>
```

The image fits inside its frame without cropping. For the full-size link used by
the current galleries, wrap the image in
`<a class="media-image-link" href="THE_SAME_IMAGE_PATH" target="_blank" rel="noopener noreferrer">`.
Duplicate a complete figure to add more images. For a screenshot or diagram that needs the full row, use
`class="media-item media-item--wide"` on its figure.

## Project videos

Put your video in the appropriate `assets/projects/PROJECT/` folder, then duplicate or replace a video figure
with the following. Change both file paths and the caption to match your video.

```html
<figure class="media-item media-item--wide">
  <video class="project-video" controls playsinline preload="none">
    <source src="assets/projects/fruityvens-demo.mp4" type="video/mp4">
    Your browser does not support this video.
    <a href="assets/projects/fruityvens-demo.mp4">Open the video file</a>.
  </video>
  <figcaption>
    <span class="media-type">VIDEO</span>
    Your caption explaining what the demonstration shows
  </figcaption>
</figure>
```

`controls` lets visitors choose when to play. `preload="none"` avoids downloading
the video itself during the initial page load. Keep videos short and compressed
so they remain practical on mobile connections.

To display a still image before playback, add
`poster="assets/projects/fruityvens-demo-poster.webp"` to `<video>` **after adding
that image file**. For spoken content, provide captions by adding this after
`<source>` once you have created the matching WebVTT file:

```html
<track kind="captions" src="assets/projects/fruityvens-demo-en.vtt"
       srclang="en" label="English" default>
```

A short explanation of silent demonstrations can go in the caption. A longer
text explanation or transcript can follow the figure, so visitors can understand
the result without watching the video.

## Certifications

The home page shows three selected credentials. The complete set of certificates
and participation records is in `certifications.html`, including expandable
ISC2 domain and assessment certificates. Each preview opens its original PDF
in a new tab. The supplied files are in `assets/certifications/`.

1. Add the new original PDF and a JPEG or WebP preview to `assets/certifications/`.
2. Duplicate an existing `.certificate-card` in the appropriate section of
   `certifications.html`. Update the title, issuer, date, image, and PDF links.
3. Set the status to what the document establishes, such as **Course completion**,
   **Professional certificate**, or **Webinar participation**. Add a verification
   link only when one exists.
4. If you also feature that credential on the home page, update `index.html` too.

The following is a reusable card template:

```html
<article class="certificate-card">
  <a class="certificate-preview"
     href="assets/certifications/your-certificate.pdf"
     target="_blank" rel="noopener noreferrer"
     aria-label="Open EXACT CERTIFICATE TITLE in a new tab">
    <img src="assets/certifications/your-certificate.webp"
         alt="EXACT CERTIFICATE TITLE issued to Amir Al Hamadani by ISSUER"
         width="1200" height="900" loading="lazy" decoding="async">
  </a>
  <div class="certificate-info">
    <p class="certificate-status">COURSE COMPLETION</p>
    <h3>EXACT CERTIFICATE TITLE</h3>
    <p class="certificate-issuer">ISSUING ORGANIZATION</p>
    <p class="certificate-date">Issued MONTH YEAR</p>
    <p class="certificate-description">A brief description of what you learned.</p>
    <a class="certificate-link" href="REPLACE_WITH_VERIFICATION_URL"
       target="_blank" rel="noopener noreferrer">
      Verify credential <span aria-hidden="true">↗</span>
    </a>
  </div>
</article>
```

Duplicate a complete article to add more credentials. If there is no verification
URL, omit the `certificate-link` element. If there is no PDF, link the preview to
the certificate image instead. Set image width and height to the actual file
dimensions; the layout displays the full image without cropping.

After editing, preview the page locally and open each project disclosure. Check
that your photos display, videos play with sound/captions as appropriate, and
certificate links reach the intended documents. Commit and push when ready to
publish; these local changes do not update the live site automatically.

## Profile, navigation, and résumé

- Replace `assets/profile.jpg` to update the portrait. The homepage profile uses
  `.profile-photo`; its framing is set by `object-fit` and `object-position`.
- The green mask is the SVG in `assets/favicon.svg`. It is used in the header,
  loading screen, and browser tab.
- The header and menu appear in all seven HTML files. Make matching edits in
  each file when adding a page. `script.js` handles closing the native menu.
- Edit your Word résumé, export it to PDF, and replace
  `assets/Amir-Al-Hamadani-Resume.pdf`. Website text is edited separately.
  If your browser still shows an older PDF, refresh its tab or open it with a
  version query such as `?v=2026-09-11`.

## Preview and publish

From the portfolio directory, run `python3 -m http.server 4173`, then open
`http://localhost:4173`. Check the home page and each detail page through the Menu,
along with certificate and résumé links, before committing. Changes remain local
until you push.
