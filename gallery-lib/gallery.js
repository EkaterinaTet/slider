const GalleryClassName = "gallery";
const GalleryDraggableClassName = "gallery__draggable";
const GalleryLineClassName = "gallery__line";
const GalleryLineContainerClassName = "gallery__line-container";
const GallerySlideClassName = "gallery__slide";
const GalleryDotsClassName = "gallery__dots";
const GalleryDotClassName = "gallery__dot";
const GalleryDotActiveClassName = "gallery__dot--active";
const GalleryNavClassName = "gallery__nav";
const GalleryNavLeftClassName = "gallery__nav-left";
const GalleryNavRightClassName = "gallery__nav-right";
const GalleryNavDisabledClassName = "gallery__nav-disabled"; // чтобы кнопка переключения становилась не активной на последнем слайде

class Gallery {
  constructor(element, options = {}) {
    this.containerNode = element;
    console.log(this.containerNode);
    this.size = element.childElementCount;
    this.currentSlide = 0; //отчет с какого слайда будет начинаться
    this.currentSlideWasChanged = false;
    this.settings = {
      margin: options.margin || 0,
    };

    this.manageHTML = this.manageHTML.bind(this); //методы всегда будут точно вызываться с контекстом this
    this.setParameters = this.setParameters.bind(this);
    this.setEvents = this.setEvents.bind(this);
    this.resizeGallery = this.resizeGallery.bind(this);
    this.startDrag = this.startDrag.bind(this);
    this.stopDrag = this.stopDrag.bind(this);
    this.dragging = this.dragging.bind(this);
    this.setStylePosition = this.setStylePosition.bind(this);
    this.clickDots = this.clickDots.bind(this);
    this.moveToLeft = this.moveToLeft.bind(this);
    this.moveToRight = this.moveToRight.bind(this);
    this.changeCurrentSlide = this.changeCurrentSlide.bind(this);
    this.changeActiveDotClass = this.changeActiveDotClass.bind(this);
    this.changeDisabledNav = this.changeDisabledNav.bind(this);

    this.manageHTML();
    this.setParameters(); //задаем параметры(объявляем новый метод и передаем контекст this)
    this.setEvents(); // будем задавать наши события
    // this.destroyEvents();
  }
  manageHTML() {
    this.containerNode.classList.add(GalleryClassName);
    this.containerNode.innerHTML = `
<div class="${GalleryLineContainerClassName}">
<div class="${GalleryLineClassName}">
${this.containerNode.innerHTML}
</div>
</div>
   <div class="${GalleryNavClassName}">
   <button class="${GalleryNavLeftClassName}">Left</button>
   <button class="${GalleryNavRightClassName}">Right</button>
   </div>
   <div class="${GalleryDotsClassName}"></div>
   `; //изменяем внутренний html нашего элемента. прописываем туда строки и добавляем div и туда прописываем html, который был в этом контейнере
    this.lineContainerNode = this.containerNode.querySelector(
      `.${GalleryLineContainerClassName}`
    );
    this.lineNode = this.containerNode.querySelector(
      `.${GalleryLineClassName}`
    ); //получаем эту нашу линию непосредственно в js(далее будем с ней манипулировать).
    this.dotsNode = this.containerNode.querySelector(
      `.${GalleryDotsClassName}`
    );
    this.slideNodes = Array.from(this.lineNode.children).map(
      (
        childNode // создаем массив, чтобы использовать метод map, тк к Node элементов этот метод не применяется.
      ) =>
        wrapElementByDiv({
          //вызываем функцию (выносим в отдельную ф-цию, чтобы код был почище)
          element: childNode,
          className: GallerySlideClassName,
        })
    ); //И определяем наши slideNodes. Для этого нужно по ним пробежать.
    //console.log(this.slideNodes); //распечатываем slideNodes
    console.log(this.slideNodes);
    //console.log(Array.from(Array(this.size).keys())); создаем массив и пробегаемся по нему, чтобы увидеть сколько у нас элементов в слайдере
    this.dotsNode.innerHTML = Array.from(Array(this.size).keys())
      .map(
        (key) =>
          `<button class="${GalleryDotClassName} ${
            key === this.currentSlide ? GalleryDotActiveClassName : ""
          }"></button>`
      )
      .join("");
    this.dotNodes = this.dotsNode.querySelectorAll(`.${GalleryDotClassName}`); //создаем событие (вытаскиваем класс)
    this.navLeft = this.containerNode.querySelector(
      `.${GalleryNavLeftClassName}`
    );
    this.navRight = this.containerNode.querySelector(
      `.${GalleryNavRightClassName}`
    );
  }
  setParameters() {
    const coordsLineContainer = this.lineContainerNode.getBoundingClientRect(); //находим ширину контейнера галереи

    this.width = coordsLineContainer.width; //берем эту ширину
    this.maximumX = -(this.size - 1) * (this.width + this.settings.margin);
    this.x = -this.currentSlide * (this.width + this.settings.margin);

    this.resetStyleTransition();
    this.lineNode.style.width = `${
      this.size * (this.width + this.settings.margin)
    }px`; //устанавливаем ширину lineNode
    this.setStylePosition();

    this.changeActiveDotClass();
    this.changeDisabledNav();

    Array.from(this.slideNodes).forEach((slideNode) => {
      slideNode.style.width = `${this.width}px`; // пробегаемся и задаем ширину каждому слайду
      slideNode.style.marginRight = `${this.settings.margin}px`;
    }); //Пробегаемся по каждому слайду и также задаем им ширину
  }
  setEvents() {
    this.debouncedResizeGallery = debounce(this.resizeGallery);
    window.addEventListener("resize", this.debouncedResizeGallery);
    this.lineNode.addEventListener("pointerdown", this.startDrag); //начинаем наше перетягивание
    window.addEventListener("pointerup", this.stopDrag); //останавливаем наше перетягивание
    window.addEventListener("pointercancel", this.stopDrag);

    this.dotsNode.addEventListener("click", this.clickDots);
    this.navLeft.addEventListener("click", this.moveToLeft);
    this.navRight.addEventListener("click", this.moveToRight);
  }
  destroyEvents() {
    window.removeEventListener("resize", this.debouncedResizeGallery);
    this.lineNode.removeEventListener("pointerdown", this.startDrag);
    window.removeEventListener("pointerup", this.stopDrag);
    window.removeEventListener("pointercancel", this.stopDrag);

    this.dotsNode.removeEventListener("click", this.clickDots);
    this.navLeft.removeEventListener("click", this.moveToLeft);
    this.navRight.removeEventListener("click", this.moveToRight);
  }
  resizeGallery() {
    this.setParameters(); //пересчитываем, то что установили при запуске галерей (при уменьшении контейнера, показатели меняются)
  }
  startDrag(evt) {
    //когда мы кликаем мышкой
    this.currentSlideWasChanged = false;
    this.clickX = evt.pageX; //двигаем галерею только по горизонтали
    this.startX = this.x;
    this.resetStyleTransition();

    this.containerNode.classList.add(GalleryDraggableClassName);
    window.addEventListener("pointermove", this.dragging);
  }
  stopDrag() {
    //должны удалить это событие
    window.removeEventListener("pointermove", this.dragging);
    this.containerNode.classList.remove(GalleryDraggableClassName);
    this.changeCurrentSlide();
  }
  dragging(evt) {
    this.dragX = evt.pageX;
    const dragShift = this.dragX - this.clickX;
    const easing = dragShift / 5; //чтобы убрать оттяжку и первого и последнего слайда(тк сейчас их можно двигать в сторону и будет сильно виден фон)
    this.x = Math.max(
      Math.min(this.startX + dragShift, easing),
      this.maximumX + easing
    ); //перетягиваем линии слайдов
    this.setStylePosition();
    //Меняем активные слайды(чтобы перелистывались сразу полностью)
    if (
      dragShift > 20 &&
      dragShift > 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide > 0
    ) {
      this.currentSlideWasChanged = true; // когда мы сменили активный слайд, он стал true
      this.currentSlide = this.currentSlide - 1;
    }
    if (
      dragShift < -20 &&
      dragShift < 0 &&
      !this.currentSlideWasChanged &&
      this.currentSlide < this.size - 1
    ) {
      this.currentSlideWasChanged = true;
      this.currentSlide = this.currentSlide + 1;
    }
  }
  //Нажатие на точки:
  clickDots(evt) {
    const dotNode = evt.target.closest("button");
    if (!dotNode) {
      return;
    }
    let dotNumber;
    for (let i = 0; i < this.dotNodes.length; i++) {
      if (this.dotNodes[i] === dotNode) {
        dotNumber = i;
        break;
      }
    }
    if (dotNumber === this.currentSlide) {
      return;
    }
    const countSwipes = Math.abs(this.currentSlide - dotNumber);
    this.currentSlide = dotNumber;
    this.changeCurrentSlide(countSwipes);
  }
  //Нажатие на левую кнопку:
  moveToLeft() {
    if (this.currentSlide <= 0) {
      return;
    }
    this.currentSlide = this.currentSlide - 1;
    this.changeCurrentSlide();
  }
  //Нажатие на правую кнопку:
  moveToRight() {
    if (this.currentSlide >= this.size - 1) {
      return;
    }
    this.currentSlide = this.currentSlide + 1;
    this.changeCurrentSlide();
  }
  changeCurrentSlide(countSwipes) {
    this.x = -this.currentSlide * (this.width + this.settings.margin);
    this.setStyleTransition(countSwipes);
    this.setStylePosition();
    this.changeActiveDotClass(); //везде где изменяется слайд окрашивать точки
    this.changeDisabledNav();
  }
  changeActiveDotClass() {
    for (let i = 0; i < this.dotNodes.length; i++) {
      this.dotNodes[i].classList.remove(GalleryDotActiveClassName);
    }
    this.dotNodes[this.currentSlide].classList.add(GalleryDotActiveClassName);
  }
  changeDisabledNav() {
    if (this.currentSlide === 0) {
      this.navLeft.classList.add(GalleryNavDisabledClassName);
    } else {
      this.navLeft.classList.remove(GalleryNavDisabledClassName);
    }
    if (this.currentSlide >= this.size - 1) {
      this.navRight.classList.add(GalleryNavDisabledClassName);
    } else {
      this.navRight.classList.remove(GalleryNavDisabledClassName);
    }
  }

  setStylePosition() {
    this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
  }
  setStyleTransition(countSwipes = 1) {
    this.lineNode.style.transition = `all 0.25s ease 0s`; //при ${0.25 * countSwipes} вместо 0.25s должно происходить пропорциональное переключение слайдов. но этого не происходит.
  }
  resetStyleTransition() {
    this.lineNode.style.transition = `all 0s ease 0s`;
  }
}
function wrapElementByDiv({ element, className }) {
  //объявлем ф-цию и передаем значения
  const wrapperNode = document.createElement("div"); //создаем новый элемент div
  wrapperNode.classList.add(className); //добавляем ему класс

  element.parentNode.insertBefore(wrapperNode, element); //создаем обертку
  wrapperNode.appendChild(element);

  return wrapperNode; //возвращаем, который мы создали
}
function debounce(func, time = 100) {
  let timer;
  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(func, time, event);
  };
}

/*
pointerdown - опускаем указатель (мышка, палец).
pointermove - двигаем указатель вправо, влево.
pointerup - поднимаем указатель.
*/
