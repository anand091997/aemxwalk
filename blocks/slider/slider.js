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

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'slider-slides';

  const rows = [...block.children];

  // If no slide rows exist yet, populate with 16:9 overlay dummy slides
  if (rows.length === 0) {
    const dummySlidesData = [
      {
        imgSrc: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600',
        alt: 'Mountain View',
        title: 'Explore Beautiful Mountains',
        text: 'Discover breath-taking mountain landscapes and scenic hiking trails across the globe.',
        buttonText: 'Learn More',
      },
      {
        imgSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
        alt: 'Ocean Sunset',
        title: 'Serene Beach Escapes',
        text: 'Relax by the crystal clear ocean waters and enjoy golden sunsets every evening.',
        buttonText: 'Book Vacation',
      },
      {
        imgSrc: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600',
        alt: 'Lush Forest',
        title: 'Walk Through Nature',
        text: 'Immerse yourself in peaceful green forests and experience raw natural beauty.',
        buttonText: 'Explore Trails',
      },
    ];

    dummySlidesData.forEach((item, idx) => {
      const slide = document.createElement('div');
      slide.className = 'slider-slide';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'slider-slide-image';
      const pic = createOptimizedPicture(item.imgSrc, item.alt, idx === 0, [{ width: '1600' }]);
      const overlay = document.createElement('div');
      overlay.className = 'slider-slide-overlay';
      imgDiv.append(pic, overlay);

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'slider-slide-body';
      bodyDiv.innerHTML = `
        <h2>${item.title}</h2>
        <p>${item.text}</p>
        <p class="button-container"><a href="#" class="button primary">${item.buttonText}</a></p>
      `;

      slide.append(imgDiv, bodyDiv);
      slidesWrapper.append(slide);
    });
  } else {
    // Process authored rows from AEM
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

      if (imgDiv) {
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
      }

      if (imgDiv && bodyDiv) {
        slide.replaceChildren(imgDiv, bodyDiv);
      }

      slidesWrapper.append(slide);
    });
  }

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
      autoplaySpeed: 3000,
      adaptiveHeight: false,
    });
  }
}
