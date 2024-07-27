// React.createElement(
//   "div",
//   {
//     id: "foo",
//   },
//   React.createElement("a", { children: "bar" }),
//   React.createElement("b", {})
// )

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

// In reality React doesn't create empty arrays when there are no children
// and doesn't wrap plain text into special TEXT_ELEMENT
// but we will do that to sacrifice performance for the sake of simplicity

const Didact = {
  createElement,
}

// Comment below tells babel to use Didact's createElement function when it encounters jsx syntax
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById("root")
// ReactDOM.render(element, container)
