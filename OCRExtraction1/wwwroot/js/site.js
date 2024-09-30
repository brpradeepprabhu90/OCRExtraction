// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.
class PDFExtraction extends HTMLElement {
    #container;
    #pdfCanvas;
    #stagedCanvas;
    #stagedContainer;
    #outputCanvas;
    #currentPDF;
    #currentId;
    #isExtraction = false;
    constructor() {
        super();
    }
    connectedCallback() {
        this.createContainer();
    }
    createContainer() {
        this.#container = document.createElement("div");
        this.#container.id = "pdf-extraction-container";
        this.#container.innerHTML = `
    <div class="row">
        <div class="col-8" id="pdf-container-area">
        </div>
        <div class="col-4">
            <div class="row">
                <div class="col-4">
                    <label> Bill 1 </label>
                </div>
                <div class="col-8">
                        <span style= "position: absolute;    height: 38px;    padding: 10px;    background: darkgray;" class="extract">
                             <i class="fa-solid fa-eye-dropper"></i>
                        </span>
                     <input id="bill1" type="text" class="form-control" style="margin-left:35px"/> 
                </div>
            </div>
        </div>
    </div>        
    `;
        this.appendChild(this.#container);
        $(this)
            .find("#pdf-container-area")
            .html(
                '<canvas id="the-canvas"></canvas><canvas id="stage-canvas"></canvas><canvas id="output-canvas"></canvas>'
            );
        this.createPdfCanvas();
    }
    createPdfCanvas() {
        $('.extract').on('click', (e) => {
            this.#isExtraction = !this.#isExtraction;
            const parent = $(e.currentTarget).parent();

            this.#currentId = $(parent).find("input");
        })
        const url =
            "https://raw.githubusercontent.com/HarshVadaliya/tech-books-library/1f4716519ca2b4f159bf620beee1903cb92e94a0/Git%20(Version%20Control)/Pro%20GIT.pdf";

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";

        // Asynchronous download of PDF
        const loadingTask = pdfjsLib.getDocument(url).promise.then(
            (pdf) => {
                console.log("PDF loaded");
                const pdfContainer = $(this).find("#pdf-container-area")[0];
                // Fetch the first page
                this.#currentPDF = pdf;
                const pageNumber = 2;
                this.loadPage(pageNumber);
            },
            function (reason) {
                // PDF loading error
                console.error(reason);
            }
        );
    }
    loadPage(pageNumber) {
        this.#currentPDF.getPage(pageNumber).then((page) => {
            const scale = 1;
            const viewport = page.getViewport({ scale: scale });
            console.log(viewport);
            // Prepare canvas using PDF page dimensions
            this.#pdfCanvas = document.getElementById("the-canvas");
            this.#stagedCanvas = document.getElementById("stage-canvas");
            this.#outputCanvas = document.getElementById("output-canvas");
            this.#outputCanvas.style.top = "1000px"
            const context = this.#pdfCanvas.getContext("2d");
            this.#pdfCanvas.height =
                this.#stagedCanvas.height =
                this.#outputCanvas.height =
                viewport.height;
            this.#pdfCanvas.width =
                this.#stagedCanvas.width =
                this.#outputCanvas.width =
                viewport.width;
            this.setupStagedCanvas();
            // Render PDF page into canvas context
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            const renderTask = page.render(renderContext);
            renderTask.promise.then(function () {
                console.log("Page rendered");
            });
        });
    }
    iconClicked(e) {
      
    }
    setupStagedCanvas() {
        var stage = new createjs.Stage(this.#stagedCanvas);
        this.#stagedContainer = new createjs.Container();
        stage.addChild(this.#stagedContainer);
        var g = new createjs.Graphics();
        g.setStrokeStyle(2);
        g.beginStroke("#ffff00");
        g.drawRect(0, 0, 0, 0);
        var shape = new createjs.Shape(g);
        shape.name = "area";
        const mouseMoveEvent = this.stageMouseMove.bind(this);
        stage.addEventListener("stagemousedown", (e) => {
            if (this.#isExtraction) {
                this.#stagedContainer.x = e.stageX;
                this.#stagedContainer.y = e.stageY;
                stage.addEventListener("stagemousemove", mouseMoveEvent);
            }
        });
        stage.addEventListener("stagemouseup", (e) => {         
            if (this.#isExtraction) {
                stage.removeEventListener("stagemousemove", mouseMoveEvent);
                this.drawOutPutCanvas();
            }
        });

        this.#stagedContainer.addChild(shape);
        createjs.Ticker.addEventListener("tick", handleTick);
        function handleTick(event) {
            stage.update();
        }
    }
    drawOutPutCanvas() {
        this.#outputCanvas.width = this.#stagedContainer.width * 2
        this.#outputCanvas.height = this.#stagedContainer.height * 2;
        const ctx = this.#outputCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.#outputCanvas.width, this.#outputCanvas.height);
        ctx.drawImage(this.#pdfCanvas, this.#stagedContainer.x, this.#stagedContainer.y, this.#stagedContainer.width, this.#stagedContainer.height, 0, 0, this.#stagedContainer.width * 2, this.#stagedContainer.height * 2);
        this.#isExtraction = false;
        const shape = this.#stagedContainer.getChildByName("area");
        shape.graphics.clear();
        shape.graphics.setStrokeStyle(2);
        shape.graphics.beginStroke("#ffff00");
        shape.graphics.drawRect(0, 0, 0, 0);
        var post = JSON.stringify({ Base64Image: this.#outputCanvas.toDataURL().split(",")[1] });


        fetch('/Home/GetTextFromImages', {
            method: 'post',
            body: post,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            return response.text()
        }).then((res) => {
            console.log(res)
            res = res.replace(/["]/g, '');
            res = res.replace(/\\n/g,'')
            console.log("res", res)
            $(this.#currentId).val(res)
        }).catch((error) => {
            console.log(error)
        })
    }
    stageMouseMove(e) {
        const width = e.stageX - this.#stagedContainer.x;
        const height = e.stageY - this.#stagedContainer.y;
        const shape = this.#stagedContainer.getChildByName("area");
        shape.graphics.clear();
        shape.graphics.setStrokeStyle(2);
        shape.graphics.beginStroke("#ffff00");
        shape.graphics.drawRect(0, 0, width, height);
        this.#stagedContainer.width = width;
        this.#stagedContainer.height = height;
    }
}

window.customElements.define("pdf-extraction", PDFExtraction);
