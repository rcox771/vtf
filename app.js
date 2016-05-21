$(document).ready(function(){
  $('.collapsible').collapsible({
    accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
  });





function ViewModel(sigmaInstance){
    self = this;
    
    self.functions = ko.observableArray([]);
    self.g = sigmaInstance;
    self.counters = ko.observable({});
    self.next = function(key){
      if(!_.has(self.counters(), key)){
        self.counters()[key] = 0;
      } else {
        self.counters()[key]++
      }

      return key+self.counters()[key];
    }

    self.connect = function(n){
        //todo
    }

    /*
    self.nearest = function(x1,y1){
        var dists = {};
        _.each(self.g.graph.nodes(), function(n){
            var x2 = n.x,
                y2 = n.y;

            var d = Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) );
            if(Math.abs(d)<.05){
                return n.id;
            }
            dists[d] = n.id;
        });
        closest = Math.min(Object.keys(dists));

        console.log('dists:', dists);
        console.log('closest was: ' , closest);
        return dists[closest];
    }*/

    self.addTestFunc = function(){
        var config = {
            type: 'func'
        }
        var name = self.next('func');
        console.log('next was: ', name);

        self.g.graph.addNode({
            id: name,
            label: name,
            x: Math.random(),
            y: Math.random(),
            size: Math.random(),
            color: '#666'
        });
        self.g.refresh();
    }

    self.addTestVar = function(){
        var config = {
            type: 'var'
        }
        var name = self.next('var');
        console.log('next was: ', name);

        self.g.graph.addNode({
            id: name,
            label: name,
            x: Math.random(),
            y: Math.random(),
            size: Math.random(),
            color: 'purple'
        });
        self.g.refresh();
    }
    /*
    self.g.bind('overNode outNode clickNode doubleClickNode rightClickNode', function(e) {
        console.log(e.type, e.data.node.label, e.data.captor);
    });
    */

    self.toggleWirer = function(){
        if(!self.wirer.isActive){
            self.wirer.activate();
        } else {
            self.wirer.deactivate();
        }
    }


    self.renderer = sigmaInstance.renderers[0];
    // Instanciate the ActiveState plugin:
    self.activeState = sigma.plugins.activeState(sigmaInstance);
        
    // Initialize the dragNodes plugin:
    self.dragListener = sigma.plugins.dragNodes(self.g, self.renderer, self.activeState);
    self.dragListener.bind('startdrag', function(event) {
        console.log('start drag.');
    });
    // Initialize the Select plugin:
    self.select = sigma.plugins.select(self.g, self.activeState);
        
    // Initialize the Keyboard plugin:
    self.keyboard = sigma.plugins.keyboard(self.g, self.renderer);
        
    // Bind the Keyboard plugin to the Select plugin:
    self.select.bindKeyboard(self.keyboard);
    //self.renderer.glyphs();
    
    self.renderer.bind('render', function(e) {
      //self.renderer.glyphs();
    });
    /*
    self.g.bind('clickNode', function(e) {
        console.log(e.type, e);
        if(e.data.node){
            var node = e.data.node;
            self.drawTemporaryConnection(node);

        }
    });
    */

    self.wirer = new sigma.plugins.Wirer(self.g, self.renderer, {});



    self.wirer.bind('selectedNodes', function (event) {
      var nodes = event.data;
      console.log("got back:", nodes);

      // Do whatever you want with those nodes

      // Eventually unactivate the lasso-tool mode
      if(nodes.length>1){
        self.g.graph.addEdge({
            source: nodes[0].id,
            target: nodes[1].id,
            id: self.next("e")
        });
        self.g.refresh();
      }
      self.wirer.deactivate();
    });

    self.wirer.isActive; // true

}


      g = {
        nodes: [],
        edges: []
      },
      positions = [
        'top-right',
        'top-left',
        'bottom-left',
        'bottom-right'
      ],
      icons = [
        "\uF11b",
        "\uF11c",
        "\uF11d",
        "\uF128",
        "\uF129",
        "\uF130",
        "\uF131",
        "\uF132"
      ];

    sigma.renderers.def = sigma.renderers.canvas;

    // Instantiate sigma:
    sigmaInstance = new sigma({
      graph: g,
      container: 'graph-container',
      
      settings: {
        zoomMin: 0.001,
        zoomMax: 10,
        dragNodeStickiness: 0.01,
        nodeBorderSize: 2,
        defaultNodeBorderColor: '#000',
        enableEdgeHovering: false,
        edgeHoverHighlightNodes: 'circle',
        glyphScale: 0.7,
        glyphFillColor: '#666',
        glyphTextColor: 'white',
        glyphStrokeColor: 'transparent',
        glyphFont: 'FontAwesome',
        glyphFontStyle: 'normal',
        glyphTextThreshold: 6,
        glyphThreshold: 3
      }
    });

    
    
    vm = new ViewModel(sigmaInstance);
    ko.applyBindings(vm);
    
});