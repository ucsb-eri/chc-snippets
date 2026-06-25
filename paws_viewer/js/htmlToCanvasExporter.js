"use strict";
function cropCanvas(canvas, x1, y1, x2, y2) {
    // Get cropped original canvas data
    var imgData = canvas.getContext('2d').getImageData(x1, y1, x2, y2);

    // Create a new temporary canvas
    var tempCanvas = document.createElement('canvas');
    var tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = x2 - x1;
    tempCanvas.height = y2 - y1;
    tempContext.putImageData(imgData, 0, 0);

    return tempCanvas;
}

function save_reports() {
    let node = null;

    let params = getHashParamsObject();
    node = document.getElementById('contentRoot');
    let filename = params['place'];
    
    // add offset to fix bad rendering
    const zoom = window.devicePixelRatio;
    const options = {
        'width': node.scrollWidth + node.offsetLeft, 
        'height': node.scrollHeight + node.offsetTop,
        'windowWidth': node.outerWidth,
        'windowHeight': node.outerHeight,
        'backgroundColor': null,
        'ignoreElements': (element) => {
            return element.classList.contains('capture-ignore');
        },
        'onclone': rootElement => { // Workaround for zoomed document
            if (zoom === 1.0) {
                return
            }
            const allElements = rootElement.querySelectorAll('*');
            Array.from(allElements).forEach(element => {
                if (!element) {
                    return
                }
                element.style.boxShadow = 'none';
                const style = element.style;
                style.setProperty('box-shadow', 'none', 'important');
            });
            },
        'logging': false,
    }

    html2canvas(node, options)
        .then(function (canvas) {
            const tempCanvas = cropCanvas(canvas, 0, 0, node.scrollWidth*zoom, node.scrollHeight*zoom)
            let dataUrl = tempCanvas.toDataURL();

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
        });
}