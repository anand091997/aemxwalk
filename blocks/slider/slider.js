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

  // Read config from block authoring rows or data attributes with default fallbacks
  const config = readBlockConfig(block);

  const dots = config.dots !== undefined
    ? config.dots === 'true'
    : block.dataset.dots === 'true';

  // Default autoplay to false and infinite to false
  const autoplay = config.autoplay !== undefined
    ? config.autoplay === 'true'
    : block.dataset.autoplay === 'true';

  const infinite = config.infinite !== undefined
    ? config.infinite === 'true'
    : block.dataset.infinite === 'true';

  const speed = parseInt(config.speed || block.dataset.speed || '500', 10);
  const slidesToShow = parseInt(
    config['slides-to-show'] || config.slidestoshow || block.dataset.slidesToShow || '1',
    10,
  );
  const slidesToScroll = parseInt(
    config['slides-to-scroll'] || config.slidestoscroll || block.dataset.slidesToScroll || '1',
    10,
  );
  const autoplaySpeed = parseInt(
    config['autoplay-speed'] || config.autoplayspeed || block.dataset.autoplaySpeed || '3000',
    10,
  );
  const imageSize = config['image-size'] || config.imagesize || block.dataset.imageSize || '1200';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'slider-slides';

  const rows = [...block.children];
  const configKeys = [
    'dots',
    'infinite',
    'speed',
    'slides-to-show',
    'slides-to-scroll',
    'autoplay',
    'autoplay-speed',
    'image-size',
  ];

  rows.forEach((row, idx) => {
    // Skip configuration rows if authored as key-value pairs
    const firstColText = row.firstElementChild?.textContent?.trim().toLowerCase();
    if (configKeys.includes(firstColText)) {
      return;
    }

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
        [{ width: imageSize }],
      );
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });

    slidesWrapper.append(slide);
  });

  block.replaceChildren(slidesWrapper);

  // Initialize Slick Carousel with default autoplay: false and infinite: false
  if (window.jQuery && window.jQuery.fn.slick) {
    window.jQuery(slidesWrapper).slick({
      dots,
      infinite,
      speed,
      slidesToShow,
      slidesToScroll,
      autoplay,
      autoplaySpeed,
      arrows: true,
      adaptiveHeight: true,
    });
  }
}
