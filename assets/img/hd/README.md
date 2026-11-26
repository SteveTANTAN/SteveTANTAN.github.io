# Publication Zoom Images

On desktop, `publication-zoom.js` loads these images directly in the publication
list and reuses them for zoom. On mobile, both the list and zoom use the existing
thumbnails, without loading HD assets. Neither mode swaps images during zoom.
MemoTime intentionally uses its existing image on both desktop and mobile.
These files use lossless WebP encoding after rendering the source PDF figures,
not upscaling the website thumbnails.

| Asset | Source | Extraction |
| --- | --- | --- |
| SkillZip.webp | `SkillZip/assets/framework.pdf` | Full figure, 3000 px wide |
| KaleidoKV.webp | Author's `kvfw-final-final.pdf` | Full figure, 3000 px wide |
| BlindStep.webp | Author's arXiv `figures/system_boundary.pdf` | Full figure, 2800 px wide |
| Hydra.webp | Author's `graphs/method_2.pdf` | PDF crop box, 3000 px wide |
| HyperAgent.webp | https://arxiv.org/pdf/2608.02650 | Page 4, Figure 1, 3000 px wide |
| DocTrace.webp | https://arxiv.org/pdf/2606.10921 | Page 3, Figure 2, 3000 px wide |
| BioWave.webp | https://arxiv.org/pdf/2606.16211 | Page 2, Figure 1, 3000 px wide |
| PrivGemo.webp | https://arxiv.org/pdf/2601.08739v1 | Page 1, Figure 1, 3000 px wide; version matches homepage |
| RGVQ.webp | https://arxiv.org/pdf/2508.06588 | Page 5, Figure 3, 3000 px wide |
| PRoH.webp | https://arxiv.org/pdf/2510.12434 | Page 3, Figure 2, 3000 px wide |
| PoG.webp | Author's WWW 2025 camera-ready PDF | Page 4, Figure 2, 3000 px wide |
| CIKM.webp | `assets/files/CIKM_KHPeak_poster.pdf` | Embedded original, native 2002 x 800 px |

Sources were checked against the homepage figures on 2026-11-27. Published PDF
versions may include small notation updates compared with older thumbnails.
