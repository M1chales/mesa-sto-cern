# Μέσα στο CERN

A guided, tutor-style 3D explorer (installable on phones) about what CERN does, in Greek, styled like "cern-journey" (one chapter per page, pager, serif headings). In every chapter the guide, Mi, walks the reader through the 3D model step by step.
Built from the CERN presentations "Λίγα λόγια για το CERN" and "Η περίφημη… Εργασία!" (September 2026).
Audience: a 15-year-old who likes games and anime and wants to become a programmer, so every
chapter has editable JavaScript "code labs" showing the code behind the simulation.
Plain HTML/CSS/JS + three.js (bundled in `vendor/`, no build step).

## Run it
Browsers block ES modules from `file://`, so serve the folder:

    cd app
    python3 -m http.server 8000
    # open http://localhost:8000  (on a phone: http://<your-PC-IP>:8000 on the same Wi-Fi)

## Chapters
| # | Chapter | Interactive part | Code lab |
|---|---------|------------------|----------|
| 01 | Καλώς ήρθες στο CERN | 3D Globe of Science, founders, stats | budget per person |
| 02 | Κβαντικό ζουμ | zoom salt grain → quark | powers of ten |
| 03 | Τα 17 σωματίδια | 3D Standard Model explorer | proton charge from quarks |
| 04 | Με κλειστά μάτια | find a hidden shape by firing particles | ray–sphere intersection |
| 05 | Το ταξίδι ενός πρωτονίου | Linac4 → PSB → PS → SPS → LHC, collision | speed from energy |
| 06 | Πώς «βλέπουμε» τα σωματίδια | identify particles in a 3D detector | particle identifier |
| 07 | Κυνήγι του Higgs | collect γγ data to 5σ | significance |
| 08 | Το μιόνιο και ο χρόνος | cosmic muons with/without relativity, twins | Lorentz factor |
| 09 | Το CERN πέρα από τον LHC | n_TOF, CLOUD, ISOLDE, antimatter, WWW… + FCC map | — |
| 10 | Προγραμματισμός στο CERN | 3D data centre & Grid, how to get started | write your own trigger |

Code labs run in a Web Worker with a 2-second limit, so broken code can't freeze the page.

## Adding photos
Copy images into `assets/photos/` and list them in `js/photos.js`:

    { src: 'assets/photos/tunnel.webp', caption: 'Inside the LHC tunnel' },

They appear in the album at the end of chapter 10.

## Put it online (free)
Upload the `app` folder to a GitHub repository → Settings → Pages → deploy from branch.
