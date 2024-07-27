function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

// In reality React doesn't create empty arrays when there are no children
// and doesn't wrap plain text into special TEXT_ELEMENT
// but we will do that to sacrifice performance for the sake of simplicity

function render(element, container) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  for (let prop in element.props) {
    if (prop === "children") continue
    dom[prop] = element.props[prop]
  }

  container.appendChild(dom)

  element.props.children.forEach((child) => render(child, dom))
}

let nextUnitOfWork = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  // this function is similar to setTimeout, but instead of us telling the browser
  // when to run, the browser will run the callback when the main thread is idle
  // React doesn't use this API anymore, instead it uses the scheduler package
  requestIdleCallback(workLoop)
}

function performUnitOfWork(nextUnitOfWork) {

}

const Didact = {
  createElement,
  render,
}
