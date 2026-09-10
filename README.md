# Amir Al Hamadani — Portfolio

A personal portfolio about my approach to engineering, interests, and selected work in embedded systems, robotics, and software.

## Preview locally

From this directory:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open <http://localhost:4173>. You can also open `index.html` directly; the copy-email enhancement requires a secure context or localhost.

## Edit the site

- `index.html`: introduction, interests, projects, education, and contact information.
- `style.css`: colors, type, responsive layout, and print styles.
- `script.js`: active navigation, the current year, and accessible email copying.
- `assets/Amir-Al-Hamadani-Resume.docx`: the downloadable résumé, copied from `ResumeForME.docx`.
- `assets/favicon.svg`: the site icon.

The site uses HTML, CSS, and a small amount of JavaScript. There is no build step, package installation, external font, tracking script, or framework required. Main content, links, and expandable details work with JavaScript disabled.

## Publish on GitHub Pages

1. Commit and push these files to the `main` branch of `alhamadaniamir/alhamadaniamir.github.io`.
2. Open **Settings → Pages** in that repository.
3. Choose **Deploy from a branch**, select **main** and **/(root)**, and save.
4. Once GitHub finishes deployment, the site will be available at <https://alhamadaniamir.github.io>.

The `.nojekyll` file tells GitHub Pages to serve this static site without Jekyll processing.

## Content notes

- The portfolio uses `ResumeForME.docx` as its content reference, including the 2022–2024 USTP study dates.
- FruityVens presents the connected scale and companion app together, with separate repository links.
- The robotic arm is presented as a hardware prototype. Its repository was not publicly accessible when this site was prepared, so there is no broken project link.
- The profile illustration is an original monogram; no portrait was included in the résumé.
- The layout and first-person presentation take inspiration from Zachary Bucknor-Smartt’s portfolio. The writing, markup, styles, and illustration were created for this site.
