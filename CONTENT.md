# Adding project media and certifications

The home page is `index.html`. The complete collections are `projects.html` and
`certifications.html`. All pages are plain HTML, sharing `style.css` and
`script.js`; no build step is needed. The top-right Menu links them together.

Project photos and videos appear inside
the expandable **Project details & media** area. They work without JavaScript.
The current boxes are intentional placeholders; they do not request missing
files or pretend to be playable videos.

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

## Project photos

1. Create `assets/projects/` and put your image there. Use a short filename without
   spaces, for example `fruityvens-scale.webp`.
2. Find the project in `projects.html`. Featured projects also appear in
   `index.html`; update both copies. The research scale is `id="vision-scale"`,
   and the separate companion app is `id="fruityvens"`. Other featured IDs are
   `robotic-arm` and `ballclub`.
3. Inside its `.project-media` area, replace the entire photo
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

The image fits inside its frame without cropping. Duplicate a complete figure
to add more images. For a screenshot or diagram that needs the full row, use
`class="media-item media-item--wide"` on its figure.

## Project videos

Put your video in `assets/projects/`, then replace the video placeholder figure
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
- The header and menu appear in all three HTML files. Make matching edits in
  each file when adding a page. `script.js` handles closing the native menu.
- Edit your Word résumé, export it to PDF, and replace
  `assets/Amir-Al-Hamadani-Resume.pdf`. Website text is edited separately.
  If your browser still shows an older PDF, refresh its tab or open it with a
  version query such as `?v=2026-09-11`.

## Preview and publish

From the portfolio directory, run `python3 -m http.server 4173`, then open
`http://localhost:4173`. Check the home page, both collection pages, Menu,
certificates, and résumé before committing. Changes remain local until you push.
