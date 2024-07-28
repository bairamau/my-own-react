/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <h1
      onClick={() => {
        console.log("aint no way")
      }}
    >
      Welcome to my own react
    </h1>
    <p style="line-height: 3; background-color: salmon">Some styled text</p>
  </div>
)

const container = document.getElementById("root")
Didact.render(element, container)
