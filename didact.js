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

function createDom(fiber) {
  // In reality React doesn't create empty arrays when there are no children
  // and doesn't wrap plain text into special TEXT_ELEMENT
  // but we will do that to sacrifice performance for the sake of simplicity

  const dom =
    fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type)

  for (let prop in fiber.props) {
    if (prop === "children") continue
    dom[prop] = fiber.props[prop]
  }

  return dom
}

function commitRoot() {
  commitWork(wipRoot.child)

  wipRoot = null
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render(element, container) {
  // keep track of the root fiber
  // in order to update the whole tree at once later
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
  }

  // set the next unit of work to the root of the fiber tree
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  // commit the whole fiber tree to the DOM when there's no more work to do
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  // this function is similar to setTimeout, but instead of us telling the browser
  // when to run, the browser will run the callback when the main thread is idle
  // React doesn't use this API anymore, instead it uses the scheduler package
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  let index = 0
  let prevSibling = null

  while (index < elements.length) {
    const element = elements[index]

    // create a new fiber for each child
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    // add it to the fiber tree setting it as a child on the ancestor or
    // as a sibling on the previous sibling
    // depending on whether it's the first child or not
    if (index === 0) {
      fiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }

  // search for the next unit of work
  // first try child
  // then sibling
  // then sibling of parent
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }
}

const Didact = {
  createElement,
  render,
}
