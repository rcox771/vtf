/**
 * Sigma Wirer
 * =============================
 *
 * @author Florent Schildknecht <florent.schildknecht@gmail.com> (Florent Schildknecht)
 * @version 0.0.2
 */
;(function (undefined) {
  'use strict';

  if (typeof sigma === 'undefined')
    throw 'sigma is not declared';

  // Initialize package:
  sigma.utils.pkg('sigma.plugins');

   var _body = undefined,
       _instances = {};

  /**
   * Wirer Object
   * ------------------
   * @param  {sigma}                                  sigmaInstance The related sigma instance.
   * @param  {renderer} renderer                      The sigma instance renderer.
   * @param  {sigma.classes.configurable} settings    A settings class
   */
  function Wirer(sigmaInstance, renderer, settings) {
    // Wirer is also an event dispatcher
    sigma.classes.dispatcher.extend(this);

    // A quick hardcoded rule to prevent people from using this plugin with the
    // WebGL renderer (which is impossible at the moment):
    if (
      sigma.renderers.webgl &&
      renderer instanceof sigma.renderers.webgl
    )
      throw new Error(
        'The sigma.plugins.Wirer is not compatible with the WebGL renderer'
      );

    this.sigmaInstance = sigmaInstance;
    this.renderer = renderer;
    this.drawingCanvas = undefined;
    this.drawingContext = undefined;
    this.drewPoints = [];
    this.startpoint = {'x': 0, 'y': 0};
    this.destpoint = {'x':0, 'y':0};
    this.selectedNodes = [];
    this.isActive = false;
    this.isDrawing = false;

    _body = document.body;

    // Extends default settings
    this.settings = new sigma.classes.configurable({
      'strokeStyle': 'pink',
      'lineWidth': 20,
      'fillWhileDrawing': false,
      'fillStyle': 'rgba(200, 200, 200, 0.25)',
      'cursor': 'crosshair'
     }, settings || {});
  };

  /**
   * This method is used to destroy the Wirer.
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.clear();
   *
   * @return {sigma.plugins.Wirer} Returns the instance.
   */
  Wirer.prototype.clear = function () {
    this.deactivate();

    this.sigmaInstance = undefined;
    this.renderer = undefined;

    return this;
  };

  // Wirer.prototype.getSigmaInstance = function () {
  //   return this.sigmaInstance;
  // }

  /**
   * This method is used to activate the Wirer mode.
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.activate();
   *
   * @return {sigma.plugins.Wirer} Returns the instance.
   */
  Wirer.prototype.activate = function () {
    if (this.sigmaInstance && !this.isActive) {
      this.isActive = true;

      // Add a new background layout canvas to draw the path on
      if (!this.renderer.domElements['Wirer']) {
        this.renderer.initDOM('canvas', 'Wirer');
        this.drawingCanvas = this.renderer.domElements['Wirer'];

        this.drawingCanvas.width = this.renderer.container.offsetWidth;
        this.drawingCanvas.height = this.renderer.container.offsetHeight;
        this.renderer.container.appendChild(this.drawingCanvas);
        this.drawingContext = this.drawingCanvas.getContext('2d');
        this.drawingCanvas.style.cursor = this.settings('cursor');
      }

      _bindAll.apply(this);
    }

    return this;
  };

  /**
   * This method is used to deactivate the Wirer mode.
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.deactivate();
   *
   * @return {sigma.plugins.Wirer} Returns the instance.
   */
  Wirer.prototype.deactivate = function () {
    if (this.sigmaInstance && this.isActive) {
      this.isActive = false;
      this.isDrawing = false;

      _unbindAll.apply(this);

      if (this.renderer.domElements['Wirer']) {
        this.renderer.container.removeChild(this.renderer.domElements['Wirer']);
        delete this.renderer.domElements['Wirer'];
        this.drawingCanvas.style.cursor = '';
        this.drawingCanvas = undefined;
        this.drawingContext = undefined;
        this.drewPoints = [];
      }
    }

    return this;
  };

  /**
   * This method is used to bind all events of the Wirer mode.
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.activate();
   *
   * @return {sigma.plugins.Wirer} Returns the instance.
   */
  var _bindAll = function () {
    // Mouse events
    this.drawingCanvas.addEventListener('mousedown', onDrawingStart.bind(this));
    _body.addEventListener('mousemove', onDrawing.bind(this));
    _body.addEventListener('mouseup', onDrawingEnd.bind(this));
    // Touch events
    this.drawingCanvas.addEventListener('touchstart', onDrawingStart.bind(this));
    _body.addEventListener('touchmove', onDrawing.bind(this));
    _body.addEventListener('touchcancel', onDrawingEnd.bind(this));
    _body.addEventListener('touchleave', onDrawingEnd.bind(this));
    _body.addEventListener('touchend', onDrawingEnd.bind(this));
  };

  /**
   * This method is used to unbind all events of the Wirer mode.
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.activate();
   *
   * @return {sigma.plugins.Wirer} Returns the instance.
   */
  var _unbindAll = function () {
    // Mouse events
    this.drawingCanvas.removeEventListener('mousedown', onDrawingStart.bind(this));
    _body.removeEventListener('mousemove', onDrawing.bind(this));
    _body.removeEventListener('mouseup', onDrawingEnd.bind(this));
    // Touch events
    this.drawingCanvas.removeEventListener('touchstart', onDrawingStart.bind(this));
    this.drawingCanvas.removeEventListener('touchmove', onDrawing.bind(this));
    _body.removeEventListener('touchcancel', onDrawingEnd.bind(this));
    _body.removeEventListener('touchleave', onDrawingEnd.bind(this));
    _body.removeEventListener('touchend', onDrawingEnd.bind(this));
  };

  /**
   * This method is used to retrieve the previously selected nodes
   *
   * > var Wirer = new sigma.plugins.Wirer(sigmaInstance);
   * > Wirer.getSelectedNodes();
   *
   * @return {array} Returns an array of nodes.
   */
  Wirer.prototype.getSelectedNodes = function () {
    return this.selectedNodes;
  };

  function onDrawingStart (event) {
    var drawingRectangle = this.drawingCanvas.getBoundingClientRect();

    if (this.isActive) {
      this.isDrawing = true;
      this.drewPoints = [];
      this.selectedNodes = [];

      this.sigmaInstance.refresh();

      this.startpoint.x = event.clientX - drawingRectangle.left;
      this.startpoint.y = event.clientY - drawingRectangle.top;


      this.drawingCanvas.style.cursor = this.settings('cursor');

      event.stopPropagation();
    }
  }

  function onDrawing (event) {
    if (this.isActive && this.isDrawing) {
      this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
      var x = 0,
          y = 0,
          drawingRectangle = this.drawingCanvas.getBoundingClientRect();
      switch (event.type) {
        case 'touchmove':
          x = event.touches[0].clientX;
          y = event.touches[0].clientY;
          break;
        default:
          x = event.clientX;
          y = event.clientY;
          break;
      }


      this.destpoint.x = x - drawingRectangle.left;
      this.destpoint.y = y - drawingRectangle.top;

      // Drawing styles
      this.drawingContext.lineWidth = this.settings('lineWidth');
      this.drawingContext.strokeStyle = this.settings('strokeStyle');
      this.drawingContext.fillStyle = this.settings('fillStyle');
      this.drawingContext.lineJoin = 'round';
      this.drawingContext.lineCap = 'round';

      // Clear the canvas
      this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);

      // Redraw the complete path for a smoother effect
      // Even smoother with quadratic curves
      var sourcePoint = this.startpoint,
          destinationPoint = this.destpoint;

      this.drawingContext.beginPath();
      this.drawingContext.moveTo(sourcePoint.x, sourcePoint.y);



      this.drawingContext.lineTo(destinationPoint.x, destinationPoint.y);
      this.drawingContext.stroke();

      if (this.settings('fillWhileDrawing')) {
        this.drawingContext.fill();
      }

      event.stopPropagation();
    }
  }

  function onDrawingEnd (event) {
    if (this.isActive && this.isDrawing) {
      this.isDrawing = false;

      // Select the nodes inside the path
      var nodes = this.renderer.nodesOnScreen,
        nodesLength = nodes.length,
        i = 0,
        prefix = this.renderer.options.prefix || '';

      // Loop on all nodes and check if they are in the path
      while (nodesLength--) {
        var node = nodes[nodesLength],
            x = node[prefix + 'x'],
            y = node[prefix + 'y'];

        if (this.drawingContext.isPointInStroke(x, y) && !node.hidden) {
          console.log(node.id+" is in stroke.");
          this.selectedNodes.push(node);
        }
      }

      // Dispatch event with selected nodes
      this.dispatchEvent('selectedNodes', this.selectedNodes);

      // Clear the drawing canvas
      this.drawingContext.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);

      this.drawingCanvas.style.cursor = this.settings('cursor');

      event.stopPropagation();
    }
  }

  /**
   * @param  {sigma}                                  sigmaInstance The related sigma instance.
   * @param  {renderer} renderer                      The sigma instance renderer.
   * @param  {sigma.classes.configurable} settings    A settings class
   *
   * @return {sigma.plugins.Wirer} Returns the instance
   */
  sigma.plugins.Wirer = function (sigmaInstance, renderer, settings) {
    // Create Wirer if undefined
    if (!_instances[sigmaInstance.id]) {
      _instances[sigmaInstance.id] = new Wirer(sigmaInstance, renderer, settings);
    }

    // Listen for sigmaInstance kill event, and remove the Wirer isntance
    sigmaInstance.bind('kill', function () {
      if (_instances[sigmaInstance.id] instanceof Wirer) {
        _instances[sigmaInstance.id].clear();
        delete _instances[sigmaInstance.id];
      }
    });

    return _instances[sigmaInstance.id];
  };

}).call(this);