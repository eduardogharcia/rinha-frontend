let filename = "";
let list = [];
const lineHeight = 20;
let listScrolltop = 0;
const listHeaderHeight = 80;
const inputElement = document.querySelector("input");
const listElement = document.querySelector(".viewer__list");
const promptElement = document.querySelector(".prompt");
const loadingElement = document.querySelector(".prompt__loading");
const errorElement = document.querySelector(".prompt__error");
const viewerElement = document.querySelector(".viewer");
const viewHeaderElement = document.querySelector(".viewer__header");
const renderTimeDisplay = document.querySelector(".render-time__value");
let jsonContent = {};
const renderTimes = [];

viewerElement.style.display = "none";

function flattenJSONObj(obj, prevNormalized = [], level = 0) {
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      prevNormalized.push({ type: "PRIMTIVE", key, value: obj[key], level });
    } else {
      if (obj[key] == null) {
        prevNormalized.push({ type: "PRIMTIVE", key, value: "null", level });
      } else {
        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "ARRAY_START", key, value: "[", level });
        } else {
          prevNormalized.push({ type: "OBJECT_START", key, value: "{", level });
        }

        flattenJSONObj(obj[key], prevNormalized, level + 1);

        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "OBJECT_START", value: "]", level });
        } else {
          prevNormalized.push({ type: "OBJECT_END", value: "}", level });
        }
      }
    }
  }

  return prevNormalized;
}

function addNewRenderTime(renderTime) {
  if (renderTimes.length >= 20) {
    renderTimes.shift();
  }
  renderTimes.push(renderTime);
}

function renderRenderTime() {
  const sum = renderTimes.reduce((prev, acc) => prev + acc, 0);

  const average = sum / renderTimes.length;

  renderTimeDisplay.innerHTML = average.toFixed(4) + "ms";
}

listElement.addEventListener("scroll", () => {
  listScrolltop = listElement.scrollTop;
  renderList();
});

window.addEventListener("resize", () => {
  renderList();
});

document
  .querySelector("input")
  .addEventListener("change", readSingleFile, false);

function getListHeights() {
  const windowHeight = window.innerHeight;
  const listHeight =
    windowHeight -
    listHeaderHeight -
    ((windowHeight - listHeaderHeight) % lineHeight);
  return {
    windowHeight,
    listHeight,
    visibleListAmount: listHeight / lineHeight,
  };
}

function readSingleFile(e) {
  console.time("all");
  if (!e.target.files) return;
  hideErrorMessage();
  showLoadingMessage();
  disableInput();
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  filename = file.name;

  var reader = new FileReader();
  reader.onload = function (e) {
    if (!e.target) return;
    var contents = e.target.result;

    console.time("parse-json");
    jsonContent = JSON.parse(contents);
    console.timeEnd("parse-json");

    console.time("flatten-json");
    list = flattenJSONObj(jsonContent);
    console.timeEnd("flatten-json");

    console.time("render");
    displayContents();
    console.timeEnd("render");
  };

  reader.readAsText(file);
}

function displayContents() {
  try {
    showViewer();
    renderList();
    console.timeEnd("all");
  } catch (error) {
    // show error message
    console.log("invalid json", error);
  }
}

function renderList() {
  const beginTime = window.performance.now();
  const { listHeight, visibleListAmount } = getListHeights();

  listElement.style.height = listHeight + "px";

  const fullListHeight = lineHeight * clamp(list.length, 0, 500000);
  const scrollingPercentage = clamp(
    (listScrolltop * 100) / (fullListHeight - listHeight),
    0,
    100
  );

  const indexFromScrollingPercentage = Math.floor(
    (scrollingPercentage * (list.length - visibleListAmount)) / 100
  );

  const visibleItems = list.slice(
    indexFromScrollingPercentage,
    indexFromScrollingPercentage + visibleListAmount
  );

  const startGhostItemHeight = listScrolltop;

  const endGhostItemHeight = fullListHeight - startGhostItemHeight - listHeight;

  listElement.innerHTML = "";

  listElement.append(createGhostListItem(startGhostItemHeight));

  visibleItems.forEach((item) => {
    listElement.appendChild(createListItem(item));
  });

  listElement.append(createGhostListItem(endGhostItemHeight));
  const endTime = window.performance.now();
  addNewRenderTime(endTime - beginTime);
  renderRenderTime();
}

function hidePrompt() {
  promptElement.style.display = "none";
}

function enableInput() {
  inputElement.removeAttribute("disabled");
}

function disableInput() {
  inputElement.setAttribute("disabled", "disabled");
}

function showLoadingMessage() {
  loadingElement.style.visibility = "initial";
}

function hideLoadingMessage() {
  loadingElement.style.visibility = "hidden";
}

function showErrorMessage() {
  errorElement.style.display = "block";
}

function hideErrorMessage() {
  errorElement.style.display = "none";
}

function showViewer() {
  hidePrompt();
  viewerElement.style.display = "initial";
  viewHeaderElement.innerHTML = filename;
}

function createListItem(item) {
  const itemlist = document.createElement("li");
  itemlist.classList.add("viewer__list-item");
  itemlist.style.paddingLeft = `calc(10px * ${item.level})`;

  if (item.key) {
    const listKeyElement = document.createElement("span");
    listKeyElement.classList.add("viewer__list-item__key");
    listKeyElement.append(item.key);
    itemlist.append(listKeyElement);

    const listCollonElement = document.createElement("span");
    listCollonElement.classList.add("viewer__list-item__collon");
    listCollonElement.append(": ");
    itemlist.append(listCollonElement);
  }

  const listValueElement = document.createElement("span");
  listValueElement.classList.add("viewer__list-item__value");

  if (
    ["ARRAY_START", "ARRAY_END", "OBJECT_START", "OBJECT_END"].includes(
      item.type
    )
  ) {
    listValueElement.classList.add("viewer__list-item__value--block");
  }

  listValueElement.append(renderValue(item));
  itemlist.append(listValueElement);

  const verticalLines = document.createElement("div");
  verticalLines.classList.add("viewer__list-item__lines");
  verticalLines.style.width = `calc(10px * ${item.level})`;

  itemlist.prepend(verticalLines);

  function renderValue(item) {
    if (typeof item.value === "string" && item.type === "PRIMTIVE") {
      return `"${item.value}"`;
    }

    return item.value;
  }

  return itemlist;
}

function createGhostListItem(height) {
  const ghostItem = document.createElement("div");
  ghostItem.style.height = height + "px";
  return ghostItem;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
