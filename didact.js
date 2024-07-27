const createElement = (type, props, ...children) => {
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

const createTextElement = (text) => {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

const render = (element, container) => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type)

  for (let prop in element.props) {
    if (prop === "children") continue
    dom[prop] = element.props[prop]
  }

  console.log(dom)

  container.appendChild(dom)

  element.props.children.forEach((child) => render(child, dom))
}

// In reality React doesn't create empty arrays when there are no children
// and doesn't wrap plain text into special TEXT_ELEMENT
// but we will do that to sacrifice performance for the sake of simplicity

const Didact = {
  createElement,
  render,
}

/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <h1>Welcome to my own react</h1>
    <p style="line-height: 3; background-color: salmon">Some styled text</p>
  </div>
)

const container = document.getElementById("root")
Didact.render(element, container)
