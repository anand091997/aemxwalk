import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const slidesContainer = document.createElement('div');
  slidesContainer.className = 'slider-slides-container';

  const slidesWrapper = document.createElement('div');
  slidesWrapper.className = 'slider-slides';

  const navDots = document.createElement('div');
  navDots.className = 'slider-nav-dots';

  const rows = [...block.children];

  rows.forEach((row, idx) => {
    const slide = document.createElement('div');
    slide.className = 'slider-slide';
    if (idx === 0) slide.classList.add('active');
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
      const optimizedPic = createOptimizedPicture(img.src, img.alt, idx === 0, [{ width: '1200' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    });

    slidesWrapper.append(slide);

    const dot = document.createElement('button');
    dot.className = 'slider-dot';
    if (idx === 0) dot.classList.add('active');
    dot.setAttribute('aria-label', `Go to slide ${idx + 1}`);
    dot.addEventListener('click', () => {
      const activeSlide = slidesWrapper.querySelector('.slider-slide.active');
      const activeDot = navDots.querySelector('.slider-dot.active');
      if (activeSlide) activeSlide.classList.remove('active');
      if (activeDot) activeDot.classList.remove('active');
      slide.classList.add('active');
      dot.classList.add('active');
    });
    navDots.append(dot);
  });

  slidesContainer.append(slidesWrapper);

  if (rows.length > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'slider-btn slider-btn-prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.innerHTML = '&#10094;';
    prevBtn.addEventListener('click', () => {
      const current = slidesWrapper.querySelector('.slider-slide.active');
      let target = current ? current.previousElementSibling : null;
      if (!target) target = slidesWrapper.lastElementChild;
      const index = [...slidesWrapper.children].indexOf(target);
      const dots = [...navDots.children];
      dots.forEach((d) => d.classList.remove('active'));
      [...slidesWrapper.children].forEach((s) => s.classList.remove('active'));
      target.classList.add('active');
      if (dots[index]) dots[index].classList.add('active');
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'slider-btn slider-btn-next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.innerHTML = '&#10095;';
    nextBtn.addEventListener('click', () => {
      const current = slidesWrapper.querySelector('.slider-slide.active');
      let target = current ? current.nextElementSibling : null;
      if (!target) target = slidesWrapper.firstElementChild;
      const index = [...slidesWrapper.children].indexOf(target);
      const dots = [...navDots.children];
      dots.forEach((d) => d.classList.remove('active'));
      [...slidesWrapper.children].forEach((s) => s.classList.remove('active'));
      target.classList.add('active');
      if (dots[index]) dots[index].classList.add('active');
    });

    slidesContainer.append(prevBtn, nextBtn);
  }

  block.replaceChildren(slidesContainer, navDots);
}
