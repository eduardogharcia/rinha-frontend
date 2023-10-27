const flattenWorker = new Worker("./src/flatten-worker.js");

let filename = "";
let list: any[] = [];
const lineHeight = 20;
let listScrolltop = 0;
const listHeaderHeight = 80;

const listElement = document.querySelector(".viewer__list") as HTMLElement;
const promptElement = document.querySelector(".prompt") as HTMLElement;
const viewerElement = document.querySelector(".viewer") as HTMLElement;
const viewHeaderElement = document.querySelector(
  ".viewer__header"
) as HTMLElement;

viewerElement.style.display = "none";

listElement.addEventListener("scroll", () => {
  listScrolltop = listElement.scrollTop;
  renderList();
});

window.addEventListener("resize", () => {
  renderList();
});

(document.querySelector("input") as Element).addEventListener(
  "change",
  readSingleFile,
  false
);

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

function readSingleFile(e: any) {
  if (!e.target.files) return;
  var file = e.target.files[0];
  if (!file) {
    return;
  }

  filename = file.name;

  var reader = new FileReader();
  reader.onload = function (e) {
    if (!e.target) return;
    var contents = e.target.result as string;
    flattenWorker.postMessage(contents);
  };

  reader.readAsText(file);
}

flattenWorker.onmessage = function (e) {
  if (e.data.type === "CHUNK") {
    list = list.concat(e.data.data);
    return;
  }

  if (e.data.type === "EOF") {
    displayContents();
  }
};

function displayContents() {
  try {
    showViewer();
    renderList();
  } catch (error) {
    // show error message
    console.log("invalid json", error);
  }
}

function renderList() {
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
}

function hidePrompt() {
  promptElement.style.display = "none";
}

function showViewer() {
  hidePrompt();
  viewerElement.style.display = "initial";
  viewHeaderElement.innerHTML = filename;
}

function createListItem(item: any) {
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

  function renderValue(item: any) {
    if (typeof item.value === "string" && item.type === "PRIMTIVE") {
      return `"${item.value}"`;
    }

    return item.value;
  }

  return itemlist;
}

function createGhostListItem(height: number) {
  const ghostItem = document.createElement("div");
  ghostItem.style.height = height + "px";
  return ghostItem;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
