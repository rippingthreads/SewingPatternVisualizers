const pi = Math.PI;
var current_pattern = "";

function setupHighResCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.width;
  const height = rect.height || canvas.height;

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  return ctx;
}

function patternSelectChange() {
    //changes what inputs are available based on the selected pattern
    const patternSelect = document.getElementById("patternSelect");
    current_pattern = patternSelect.value;
    const easeContainer = document.getElementById("easeContainer");
    const ratioContainer = document.getElementById("ratioContainer");

    if (current_pattern === "circle") {
        easeContainer.style.display = "block";
        ratioContainer.style.display = "block";
    } else {
        easeContainer.style.display = "none";
        ratioContainer.style.display = "none";
    }
    drawCanavses();
}

function drawCanavses() {
    console.log(current_pattern);
    //setup pattern canvas
    const patternCanvas = document.getElementById("patternCanvas");
    setupHighResCanvas(patternCanvas);
    const pattern_ctx = patternCanvas.getContext("2d");
    pattern_ctx.font = "16px Arial";
    pattern_ctx.clearRect(0, 0, patternCanvas.width, patternCanvas.height);
    //setup cutting canvas
    const cuttingCanvas = document.getElementById("cuttingCanvas");
    setupHighResCanvas(cuttingCanvas);
    const cutting_ctx = cuttingCanvas.getContext("2d");
    cutting_ctx.font = "16px Arial";
    cutting_ctx.clearRect(0, 0, cuttingCanvas.width, cuttingCanvas.height);
    //setup finished canvas
    const finishedCanvas = document.getElementById("finishedCanvas");
    setupHighResCanvas(finishedCanvas);
    const finished_ctx = finishedCanvas.getContext("2d");
    finished_ctx.font = "16px Arial";
    finished_ctx.clearRect(0, 0, finishedCanvas.width, finishedCanvas.height);
    
    const units = document.getElementById("units").value;
    
    if (current_pattern="circle"){
        //pattern
        [ir, or, theta] = findCircleSkirtValues();
        pattern_ctx.strokeStyle = "black";
        var scale = units === "in" ? 5 : 2;
        var offset = {x: 10, y: patternCanvas.clientHeight - 10}
        var [height, width, left] = drawCircleSkirtPattern(pattern_ctx, offset, scale, ir, or, theta, false);

        //cutting, 4 pieces
        scale = units === "in" ? 100 : 30;
        offset = {x: 10, y: cuttingCanvas.clientHeight - 10};
        drawCircleSkirtCutting(cutting_ctx, offset, scale, ir, or, theta, height, width, left, units);

        //finished
        scale = (finishedCanvas.clientHeight / (length+20));
        offset = {x: 10, y: finishedCanvas.clientHeight - 10};
        drawCircleSkirtFinished(cutting_ctx, offset, scale, ir, or, theta, units);
    }
}

function toScreenSpace(canvas, objPosition, cameraPosition, cameraRotation) {
    const [width, height] = [canvas.width, canvas.height];
    const [cx, cy, cz] = cameraPosition;
    const [rx, ry, rz] = cameraRotation;
    
    // Apply camera rotation to the object position
    let [x, y, z] = objPosition;
    // Rotate around x axis
    const cosRY = Math.cos(ry);
    const sinRY = Math.sin(ry);
    const y1 = y * cosRY - z * sinRY;
    const z1 = y * sinRY + z * cosRY;
    // Rotate around y axis
    const cosRX = Math.cos(rx);
    const sinRX = Math.sin(rx);
    const x2 = x * cosRX + z1 * sinRX;
    const z2 = -x * sinRX + z1 * cosRX;
    // Rotate around z axis
    const cosRZ = Math.cos(rz);
    const sinRZ = Math.sin(rz);
    const x3 = x2 * cosRZ - y1 * sinRZ;
    const y3 = x2 * sinRZ + y1 * cosRZ;
    
    // Translate to camera position
    const x4 = x3 + cx;
    const y4 = y3 + cy;
    const z4 = z2 + cz;

    // Project to screen space (assuming perspective projection)
    const fov = Math.PI / 4; // Field of view in radians
    const aspectRatio = width / height;
    const near = 0.1;
    const far = 100;
    const zScreen = (far * (z4 - near)) / (far - near);
    const xScreen = (x4 * height / (zScreen * Math.tan(fov / 2))) + width / 2;
    const yScreen = -(y4 * height / (zScreen * Math.tan(fov / 2))) + height / 2;
    
    return [xScreen, yScreen, zScreen];

}
function RadToDeg(rad){
    return (rad*(180/pi))
}
function drawPieSlice(context, position, ir, or, theta) {
    context.beginPath();
    const start_pos = {x: position.x + or * Math.cos(-theta), y: position.y + or * Math.sin(-theta)};
    context.moveTo(start_pos.x, start_pos.y);
    context.arc(position.x, position.y, ir, -theta, 0);
    const end_pos = {x: position.x + or, y: position.y};
    context.lineTo(end_pos.x, end_pos.y);
    context.stroke();
    //
    context.beginPath();
    context.arc(position.x, position.y, or, -theta, 0);
    context.stroke();
}


//
function drawCircleSkirtPattern(context, offset, scale, ir, or, theta, patternOnly) {
        // draw the pie slice
        context.strokeStyle = "black";
        drawPieSlice(context, offset, ir*scale, or*scale, theta);
        // draw bounding box
        context.strokeStyle = "red";
        var left = ir*Math.cos(-theta);
        const x = left*scale+offset.x;
        var height = or*Math.sin(-theta);
        var width = (or-left);
        context.strokeRect(x, offset.y, width*scale, height*scale);
        if (patternOnly) {
            return [height, width, left];
        }
        //draw center point
        context.beginPath();
        context.arc(offset.x, offset.y, 2, 0, 2 * Math.PI);
        context.fill();
        // draw the dimensions
        const irLabel = `inner radius: ${ir.toFixed(2)}`;
        const orLabel = `outer radius: ${or.toFixed(2)}`;
        const thetaLabel = `theta: ${RadToDeg(theta).toFixed(1)}`;
        const sizeLabel = `size: ${width.toFixed(2)}x${Math.abs(height).toFixed(2)}`;
        document.getElementById("patternInfo").innerHTML = `<li>${irLabel}</li><li>${orLabel}</li><li>${thetaLabel}</li><li>${sizeLabel}</li>`;
        return [height, width, left];
}
function drawRotatedCircleSkirtPattern(context, offset, scale, ir, or, theta) {
    context.save();
    context.translate(offset.x, offset.y);
    context.rotate(pi / 2);
    drawCircleSkirtPattern(context, {x: 0, y: 0}, scale, ir, or, theta, true);
    context.restore();
}
function drawCircleSkirtCutting(context, offset, scale, ir, or, theta, height, width, left, units) {
    context.strokeStyle = "blue";
        var boltHeight = 0
        if (units == "in") {
            boltHeight = (44/36);
            height = Math.abs(height/36);
            width = Math.abs(width/36)
            or = Math.abs(or/36);
            ir = Math.abs(ir/36);
            left = Math.abs(left/36);
        } else {
            boltHeight = ((44*2.54)/100)
            height = Math.abs(height/100);
            width = Math.abs(width/100);
            or = Math.abs(or/100);
            ir = Math.abs(ir/100);
        }
        offset.y -= boltHeight * scale;
        context.strokeStyle = "black";
        // determine the best orientation
        const widthWiseLength = Math.ceil(4/Math.floor(boltHeight / width))*height;
        const heightWiseLength = Math.ceil(4/Math.floor(boltHeight / height))*width;
        console.log(`Width-wise length: ${widthWiseLength}, Height-wise length: ${heightWiseLength}`);
        const bestOrientation = widthWiseLength < heightWiseLength ? "width-wise" : "height-wise";

        //draw cutting text
        const lengthUnit = units === "cm" ? "meters" : "yards"
        const bestLength = bestOrientation === "width-wise" ? widthWiseLength : heightWiseLength;
        //calculate waste from height
        var bestWaste;
        if (bestOrientation === "width-wise") {
            bestWaste = boltHeight - Math.floor(boltHeight / width)*width;
        } else {
            bestWaste = boltHeight - Math.floor(boltHeight / height)*height;
        }
        document.getElementById("cuttingInfo").innerHTML = 
        `
        <li>Best orientation: ${bestOrientation}</li>
        <li>Best length: ${bestLength.toFixed(2)} ${lengthUnit}</li>
        <li>Waste: ${bestWaste.toFixed(2)}</li>
        `;
        
        context.strokeRect(offset.x, offset.y, bestLength*scale, boltHeight*scale);
        if (bestOrientation === "width-wise") {
            const patternsAcross = Math.floor(boltHeight / width);
            for (let i = 0; i < 4; i++) {
                const column = Math.floor(i / patternsAcross);
                const row = i % patternsAcross;
                const tileX = offset.x + column * height * scale;
                const tileY = offset.y + row * width * scale;
                drawRotatedCircleSkirtPattern(context, {
                    x: tileX,
                    y: tileY - left * scale
                }, scale, ir, or, theta);
            }
        } else {
            const patternsAcross = Math.floor(boltHeight / height);
            for (let i = 0; i < 4; i++) {
                const column = Math.floor(i / patternsAcross);
                const row = i % patternsAcross;
                const tileX = offset.x + column * width * scale;
                const tileY = offset.y + row * height * scale;
                drawCircleSkirtPattern(context, {
                    x: tileX - left * scale,
                    y: tileY + height * scale
                }, scale, ir, or, theta, true);
            }
        }
}
function drawCircleSkirtFinished(context, offset, scale, ir, or, theta, units){
    //renders pattern if cut & sewn
    const upperCircumference = 4*theta*ir;
    const lowerCircumference = 4*theta*or;
    const upperRadius = upperCircumference / (2 * Math.PI);
    const lowerRadius = lowerCircumference / (2 * Math.PI);
    console.log("Upper circumference:", upperCircumference, "Upper radius:", upperRadius);
    console.log("Lower circumference:", lowerCircumference, "Lower radius:", lowerRadius);
    context.strokeStyle = "black";
    context.beginPath(offset.x, offset.y);
    context.moveTo(offset.x+lowerCircumference * scale * 0.5, offset.y);
    context.lineTo(offset.x+lowerCircumference * scale * 0.5, offset.y+length * scale);
    context.lineTo(offset.x+lowerCircumference * scale * 0.5, offset.y+length * scale);
    context.lineTo(offset.x+lowerCircumference * scale * 0.5, offset.y);
    context.stroke();
}
function findCircleSkirtValues() {
    const waist = parseFloat(document.getElementById("waist").value);
    const ease = parseFloat(document.getElementById("ease").value);
    const length = parseFloat(document.getElementById("length").value);
    const num = parseFloat(document.getElementById("numerator").value);
    const denom = parseFloat(document.getElementById("denominator").value);

    const inner_radius = ((waist+ease)*denom)/(2*num*pi);
    const outer_radius = inner_radius + length;
    const theta = (num * pi) / (2*denom)
    
    return [inner_radius, outer_radius, theta]
}

document.getElementById("patternSelect").addEventListener("change", patternSelectChange);
document.getElementById("units").addEventListener("change", drawCanavses);
document.querySelectorAll("#controls input").forEach((input) => {
    input.addEventListener("input", drawCanavses);
});
document.addEventListener("DOMContentLoaded", function() {
    patternSelectChange();
});