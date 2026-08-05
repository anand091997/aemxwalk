import {
  createOptimizedPicture,
  loadCSS,
  loadScript,
  readBlockConfig,
} from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const codeBase = window.hlx?.codeBasePath || '';

  // Load local Slick CSS dependencies
  await Promise.all([
    loadCSS(`${codeBase}/styles/slick.css`),
    loadCSS(`${codeBase}/styles/slick-theme.css`),
  ]);

  // Load local jQuery if not already present
  if (!window.jQuery) {
    await loadScript(`${codeBase}/scripts/jquery.min.js`);
  }

  // Load local Slick JS if not already initialized
  if (window.jQuery && !window.jQuery.fn.slick) {
    await loadScript(`${codeBase}/scripts/slick.min.js`);
  }

  // Read config fallback from block metadata
  const blockConfig = readBlockConfig(block);

  let dots = blockConfig.dots !== undefined
    ? blockConfig.dots === 'true'
    : block.dataset.dots !== 'false';

  let arrows = blockConfig.arrows !== undefined
    ? blockConfig.arrows === 'true'
    : block.dataset.arrows !== 'false';

  let autoplay = blockConfig.autoplay !== undefined
    ? blockConfig.autoplay === 'true'
    : block.dataset.autoplay === 'true';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'slider-slides';

  const rows = [...block.children];
  const configKeys = ['dots', 'arrows', 'autoplay'];
  const slideRows = [];

  rows.forEach((row) => {
    const aueProp = row.dataset?.aueProp?.toLowerCase();
    const cols = [...row.children];
    const firstColText = cols[0]?.textContent?.trim().toLowerCase();
    const fullText = row.textContent?.trim().toLowerCase();
    const hasPicture = !!row.querySelector('picture');
    const hasHeading = !!row.querySelector('h1, h2, h3, h4, h5, h6');

    // 1. Check AUE data attribute configuration
    if (aueProp && configKeys.includes(aueProp)) {
      if (aueProp === 'dots') dots = fullText === 'true';
      if (aueProp === 'arrows') arrows = fullText === 'true';
      if (aueProp === 'autoplay') autoplay = fullText === 'true';
      return;
    }

    // 2. Check key-value configuration row
    if (firstColText && configKeys.includes(firstColText)) {
      const val = cols[1]?.textContent?.trim().toLowerCase();
      if (firstColText === 'dots') dots = val !== 'false';
      if (firstColText === 'arrows') arrows = val !== 'false';
      if (firstColText === 'autoplay') autoplay = val === 'true';
      return;
    }

    // 3. Skip bare boolean configuration rows without picture/heading
    if (!hasPicture && !hasHeading && (fullText === 'true' || fullText === 'false')) {
      return;
    }

    slideRows.push(row);
  });

  slideRows.forEach((row, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slider-slide';
    moveInstrumentation(row, slide);

    while (row.firstElementChild) {
      slide.append(row.firstElementChild);
    }

    [...slide.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'slider-slide-image';
      } else {
        div.className = 'slider-slide-body';
      }
    });

    slide.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(
        img.src,
        img.alt,
        idx === 0,
        [{ width: '1200' }],
      );
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });

    slidesWrapper.append(slide);
  });

  block.replaceChildren(slidesWrapper);

  // Initialize Slick Carousel with dynamic dots & arrows, default autoplay: false
  if (window.jQuery && window.jQuery.fn.slick) {
    window.jQuery(slidesWrapper).slick({
      dots,
      arrows,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay,
      autoplaySpeed: 3000,
      adaptiveHeight: true,
    });
  }
}
