function _chart(pack,data,d3,width,height,setCircleColor)
{
  const root = pack(data);
  let focus = root;
  let view;

  const svg = d3.create("svg")
      .attr("viewBox", `-${width / 16} -${height / 16} ${width / 8} ${height / 8}`)
      
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("background", 'white')
      .style("cursor", "pointer")
      .on("click", (event) => zoom(event, root));
      console.log(svg)

  const node = svg.append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", setCircleColor)
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function() { d3.select(this).attr("stroke", "#000"); })
      .on("mouseout", function() { d3.select(this).attr("stroke", null); })
      .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));

  const label = svg.append("g")
      .style("font", "34px sans-serif")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
      .style("fill-opacity", d => d.parent === root ? 1 : 0)
      .style("display", d => d.parent === root ? "inline" : "none")
      .text(d => d.data.name);

  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / (v[2]*16);

    view = v;

    label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
    node.attr("r", d => d.r * k);
  }

  function zoom(event, d) {
    const focus0 = focus;

    focus = d;

    const transition = svg.transition()
        .duration(event.altKey ? 7500 : 750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

    label
      .filter(function(d) { return d.parent === focus || this.style.display === "inline"; })
      .transition(transition)
        .style("fill-opacity", d => d.parent === focus ? 1 : 0)
        .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
        .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
  }

  return svg.node();
}


function _data(FileAttachment){return(
FileAttachment("output.json").json()
)}

function _pack(d3,width,height){return(
data => d3.pack()
    .size([width, height])
    .padding(3)
  (d3.hierarchy(data)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value))
)}

function _width(){return(
932*16
)}

function _height(width){return(
width
)}

function _format(d3){return(
d3.format(",d")
)}

function _color(d3){return(
d3.scaleOrdinal()
        .range(d3.schemeCategory10)
)}

function _setCircleColor(){return(
function setCircleColor(obj) {
  //var hue=(180+(obj.data.value)*120).toString(10);
  var hue=((obj.data.value)*50).toString(10);
  return ["hsl(",hue,",80%,50%)"].join("");  
  }
)}

function _d3(require){return(
require("d3@6")
)}

function _backButton(){
  const backButton = document.createElement("button");
  backButton.textContent = "Return to setup";
  
  backButton.addEventListener("click", function(){
    window.location.href = "../setup.html";
  });

  document.body.appendChild(backButton);
}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["output.json", {url: new URL("../../data/circles.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer("chart")).define("chart", ["pack","data","d3","width","height","setCircleColor"], _chart);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("pack")).define("pack", ["d3","width","height"], _pack);
  main.variable(observer("width")).define("width", _width);
  main.variable(observer("height")).define("height", ["width"], _height);
  main.variable(observer("format")).define("format", ["d3"], _format);
  main.variable(observer("color")).define("color", ["d3"], _color);
  main.variable(observer("setCircleColor")).define("setCircleColor", _setCircleColor);
  main.variable(observer()).define(_backButton);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  

  return main;
}
