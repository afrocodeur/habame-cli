const ws = new WebSocket("ws://%host%:%port%");
ws.addEventListener("open", () =>{
    console.log("Connected");
    ws.send("Hello H!");
});
let lastQueryData = {};
ws.addEventListener('message', function (event) {
    try {
        const query = JSON.parse(event.data);
        if(query.reload) {
            window.location.reload();
            return;
        }
        if(event.data === lastQueryData) {
            return;
        }
        lastQueryData = event.data;
        if(query.name) {
            const componentFactory = Habame.getComponentFactory(query.name);
            if(!componentFactory) {
                window.location.reload();
                return;
            }
            if(query.type === 'script') {
                const controller = eval('('+query.code+')');
                componentFactory.updateController(controller);
                return;
            }
            if(query.type === 'view') {
                componentFactory.updateView(query.code);
                return;
            }
            if(query.type === 'style') {
                const styleNode = document.querySelector("style[data-component='"+ query.name +"']");
                styleNode.innerHTML = query.code;
                return;
            }

            window.location.reload();
        }
        return;
    }catch(e) {
        console.log(e)
    }
});