var _dragged;
ko.bindingHandlers.drag = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
        var dragElement = $(element);
        var dragOptions = {
            helper: 'clone',
            revert: true,
            revertDuration: 0,
            start: function() {
                _dragged = ko.utils.unwrapObservable(valueAccessor().value);
            },
            cursor: 'default'
        };
        dragElement.draggable(dragOptions).disableSelection();
    }
};

ko.bindingHandlers.drop = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
        var dropElement = $(element);
        var dropOptions = {
            drop: function(event, ui) {
                valueAccessor().value(_dragged);
            }
        };
        dropElement.droppable(dropOptions);
    }
};




$(document).ready(function(){
 $('.dropdown-button').dropdown({
      inDuration: 300,
      outDuration: 225,
      constrain_width: false, // Does not change width of dropdown to that of the activator
      hover: true, // Activate on hover
      gutter: 0, // Spacing from edge
      belowOrigin: true, // Displays dropdown below the button
      alignment: 'left' // Displays dropdown with edge aligned to the left of button
    }
  );
$('.button-collapse').sideNav({
        menuWidth: 300, // Default is 240
        edge: 'left', // Choose the horizontal origin
        closeOnClick: true // Closes side-nav on <a> clicks, useful for Angular/Meteor
      }
    );

  $('.collapsible').collapsible({
    accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
  });


    $('ul.tabs').tabs();
    $('.collapsible').collapsible({
      accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
    });


function typeList(lst){
    var tmp = [];
    tmp.push(new typeUtil('', 'angle-left'));
    _.each(lst, function(item){
        tmp.push(new typeUtil(item[0], item[1]));
    });
    tmp.push(new typeUtil('', 'angle-right'));
    console.log('tmp was :', tmp);
    return tmp;
}

function typeUtil(name, icon){
    var self = this;
    self.name = name;
    self.icon = "fa fa-"+icon;
}


variable_types = [
    ["Tensor", "cubes"],
    ["String", "font"],
    ["Dict", "book"],
    ["script", "code"],
    ["float", "magic"],
    ["list","list"]
];

func_types = [
    ["Dot", "cubes"],
    ["Shared", "font"],
    ["Dict", "book"],
    ["script", "code"],
    ["float", "magic"],
    ["list","list"]
];

function ViewModel(sigmaInstance){
    self = this;
    self.dropped = ko.observableArray();
    self.lastDropped = ko.computed({
         read: function() {
             return self.dropped().length ? this.toppingStack()[0] : "";
         },
         write: function(value) {
            console.log('last is now:', value);
             self.dropped.unshift(value);
         },
         owner: self
    });
    self.math_funcs = ko.observable(math_funcs);
    self.functions = ko.observableArray([]);
    console.log('init vars:', variable_types);
    self.variable_types = ko.observableArray(typeList(variable_types));
    self.func_types = ko.observableArray(typeList(func_types));

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
    this.draggedItem = ko.observable();
      
        this.handleDragStart = function(Item, e) {
            console.log(Item);
            this.draggedItem(Item);
            console.log('dragStart');   
            // Returning true is required to stop KO squashing the default action
            // This will allow dragover to take over from dragstart
            return true;
        }.bind(this);
    
        this.handleDragOver = function(e) {
            //console.log('dragOver');
        }.bind(this);
    
        this.handleDrop = function(Item, e) {     
            console.log('drop')
            // The next 3 lines shows how you can copy the dragged Item onto the dropped target...
            var context = ko.contextFor(e.target);
            self.addFunc(self.draggedItem());
            //var index = context.$index();
            //console.log('index:', index);
            //console.log('context:', context);
            //this.miscItems()[index].ItemData(this.draggedItem().ItemData());
        }.bind(this);

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
    self.hypernodes = [];
    self.addFunc = function(obj){
         var config = {
             type: 'func'
         }
         var name = self.next(obj.name);

         var rootNode = {
             id: name,
             label: name,
             x: Math.random(),
             y: Math.random(),
             size: 30,

             color: 'orange',
         }

         self.g.graph.addNode(rootNode);

         if( (obj.inputs.required.length == 0) && (obj.inputs.options.length == 0) ){
             //then give a default input node dammit
             var defaultname = self.next('default_input');
             self.g.graph.addNode({
                  id: defaultname,

                  label: defaultname,
                  x: rootNode.x - .1,
                  y: rootNode.y,
                  size: 10,

                  color: 'pink'

              });
              self.g.graph.addEdge({
                  "source":defaultname,
                  "target":name,
                  "id": self.next("inputFlow"),
                  "color":"rgba(150,100,100,.7)"
              });
         } else {

            _.each(obj.inputs.required, function(req){
                var reqName = self.next(req);
                var reqNode = {

                    id: reqName,

                    label: "required",
                    x: rootNode.x - .1,
                    y: rootNode.y * Math.random(),
                    size: 10,

                    color: 'red'
                }
                self.g.graph.addNode(reqNode);
                self.g.graph.addEdge({
                    "source": reqName,
                    "target": name,
                    "id": self.next("inputFlow")
                });
            });

            optlen = obj.inputs.options.length;
            var cntr=0;
            _.each(obj.inputs.options, function(opt){
                var optName = self.next(opt);
                var optNode = {

                    id: optName,

                    label: "optional",
                    x: rootNode.x - .1,
                    y: rootNode.y * Math.random(),
                    size: 10,

                    color: 'grey'
                }
                self.g.graph.addNode(optNode);

                self.g.graph.addEdge({
                    "source": optName,
                    "target": name,
                    "id": self.next("inputFlow")
                });
            });



         }

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
        zoomMin: .1,
        zoomMax: 3,

            // {number} The size of the outer border of nodes.
            nodeOuterBorderSize: .1,
            // {string} The default node outer border's color.
        font: "roboto",
        labelAlignment:"inside",
        dragNodeStickiness: 0.01,
        //nodeBorderSize: 2,
        enableEdgeHovering: false,
        //edgeHoverHighlightNodes: 'circle',

      }
    });

    
    
    vm = new ViewModel(sigmaInstance);
    ko.applyBindings(vm);
    
});