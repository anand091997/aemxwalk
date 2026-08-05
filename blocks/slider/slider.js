import {
  createOptimizedPicture,
  loadCSS,
  loadScript,
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

  const rows = [...block.children];

  // 1. Render placeholder on slider container if no slide items exist yet
  if (rows.length === 0) {
    const placeholder = document.createElement('div');
    placeholder.className = 'slider-placeholder';
    placeholder.innerHTML = '<p>Slider Block (Add Slide items)</p>';
    block.replaceChildren(placeholder);
    return;
  }

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'slider-slides';

  // 2. Process authored slide rows
  rows.forEach((row, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slider-slide';
    moveInstrumentation(row, slide);

    while (row.firstElementChild) {
      slide.append(row.firstElementChild);
    }

    let imgDiv = null;
    let bodyDiv = null;

    [...slide.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'slider-slide-image';
        imgDiv = div;
      } else {
        div.className = 'slider-slide-body';
        bodyDiv = div;
      }
    });

    // If slide does not have an image yet, create a slide image placeholder
    if (!imgDiv) {
      imgDiv = document.createElement('div');
      imgDiv.className = 'slider-slide-image slider-slide-placeholder';
      imgDiv.innerHTML = '<span>Slide Placeholder (Add Image)</span>';
    }

    const overlay = document.createElement('div');
    overlay.className = 'slider-slide-overlay';
    imgDiv.append(overlay);

    imgDiv.querySelectorAll('picture > img').forEach((img) => {
      const optimizedPic = createOptimizedPicture(
        img.src,
        img.alt,
        idx === 0,
        [{ width: '1600' }],
      );
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });

    // If slide body is empty, populate placeholder text overlay
    if (!bodyDiv) {
      bodyDiv = document.createElement('div');
      bodyDiv.className = 'slider-slide-body';
      bodyDiv.innerHTML = '<h2>Slide Title</h2><p>Add slide description text...</p>';
    }

    slide.replaceChildren(imgDiv, bodyDiv);
    slidesWrapper.append(slide);
  });

  block.replaceChildren(slidesWrapper);

  const totalSlides = slidesWrapper.children.length;

  // Initialize Slick Carousel only if there are multiple slides
  if (totalSlides > 1 && window.jQuery && window.jQuery.fn.slick) {
    window.jQuery(slidesWrapper).slick({
      dots: true,
      arrows: true,
      infinite: false,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      autoplay: false,
      adaptiveHeight: false,
    });
  }
}
