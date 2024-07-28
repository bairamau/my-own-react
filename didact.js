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
  console.log("create dom")
  // In reality React doesn't create empty arrays when there are no children
  // and doesn't wrap plain text into special TEXT_ELEMENT
  // but we will do that to sacrifice performance for the sake of simplicity

  const dom =
    fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

// if the prop name starts with "on", we handle them differently
const isEvent = (key) => key.startsWith("on")
const isProperty = (key) => key !== "children" && !isEvent(key)
const isNew = (prev, next) => (key) => prev[key] !== next[key]
const isGone = (prev, next) => (key) => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  console.log("update dom")
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name])
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name]
    })

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

function commitRoot() {
  console.log("commit root")
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)

  currentRoot = wipRoot
  wipRoot = null
}

function commitWork(fiber) {
  console.log("commit work")
  if (!fiber) {
    return
  }

  const domParent = fiber.parent.dom
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    console.log("placement")
    domParent.appendChild(fiber.dom)
  }
  if (fiber.effectTag === "DELETION" && fiber.dom != null) {
    console.log("deleteion")
    domParent.removeChild(fiber.dom)
  }
  if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    console.log("update")
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render(element, container) {
  console.log("render")
  // keep track of the root fiber
  // in order to update the whole tree at once later
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // a link to the old fiber, which was commited to the DOM in the previous commit phase
    alternate: currentRoot,
  }

  // when we commit the fiber tree to the DOM we do it from the wipRoot,
  // which doesn't have the old fibers
  // so we need a separate array to keep track of the nodes we want to remove
  deletions = []
  // set the next unit of work to the root of the fiber tree
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let wipRoot = null
let currentRoot = null
let deletions = null

function workLoop(deadline) {
  console.log("work loop")
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
  console.log("perform unit of work")
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

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

function reconcileChildren(wipFiber, elements) {
  console.log("reconcile children")
  let index = 0
  let oldFiber = wipFiber.alternate?.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]

    let newFiber = null

    const sameType = oldFiber && element && element.type == oldFiber.type

    // React also does key prop comparison for a better reconcilication
    if (sameType) {
      // if the old fiber and the element have the new element have the same type
      // we can keep to DOM node and just update it with the new props

      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // if the type is different and there is a new element
      // it means we need to create a new DOM node

      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      // if old fiber is present and the types are different
      // we need to remove the old node

      oldFiber.effectTag = "DELETION"
      deleteions.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // add it to the fiber tree setting it as a child on the ancestor or
    // as a sibling on the previous sibling
    // depending on whether it's the first child or not
    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

const Didact = {
  createElement,
  render,
}
