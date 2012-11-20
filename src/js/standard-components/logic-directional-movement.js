/**
# COMPONENT **logic-directional-movement**
This component Changes the (x, y) position of an object according to its current speed and heading. It maintains its own heading information independent of other components allowing it to be used simultaneously with push and gravity components. It accepts directional messages that can stand alone, or come from a mapped controller, in which case it checks the `pressed` value of the message before changing its course accordingly.

## Dependencies:
- [[handler-logic]] (on entity's parent) - This component listens for a logic tick message to maintain and update its location.

## Messages

### Listens for:
- **handle-logic** - On a `tick` logic message, the component updates its location according to its current state.
  > @param message.deltaT - To determine how far to move the entity, the component checks the length of the tick.
- **[directional message]** - Directional messages include `go-down`, `go-south`, `go-down-left`, `go-southwest`, `go-left`, `go-west`, `go-up-left`, `go-northwest`, `go-up`, `go-north`, `go-up-right`, `go-northeast`, `go-right`, `go-east`, `go-down-right`, and `go-southeast`. On receiving one of these message, the entity adjusts its movement orientation.
  > @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: true causes movement in the triggered direction, false turns off movement in that direction. Note that if no message is included, the only way to stop movement in a particular direction is to trigger `stop` on the entity before progressing in a new orientation. This allows triggering `up` and `left` in sequence to cause `up-left` movement on the entity.
- **stop** - Stops motion in all directions until movement messages are again received.
  > @param message.pressed (boolean) - Optional. If `message` is included, the component checks the value of `pressed`: a value of false will not stop the entity.

### Local Broadcasts: //TODO: v-- fix this documentation after fixing logic state messages - DDD
- **logical-state** - This component fires this message each tick to describe its current state.
  > @param message.state (string) - This string takes the form of "state-heading" where state is either "stopped" or "moving" and heading is "up", "up-right", "right", "down-right", "down", "down-left", "left", or "up-left".
- **stopped** - This message is triggered on the entity when the entity enters a "stopped" state after having been moving.
- **moving** - This message is triggered on the entity when the entity enters a "moving" state after having been stopped.

## JSON Definition:
    {
      "type": "logic-directional-movement",
      
      "top": 100,
      // Optional number specifying top of viewport in world coordinates
      
      "left": 100,
      // Optional number specifying left of viewport in world coordinates
      
      "width": 100,
      // Optional number specifying width of viewport in world coordinates
      
      "height": 100,
      // Optional number specifying height of viewport in world coordinates
      
      "stretch": true,
      // Optional boolean value that determines whether the camera should stretch the world viewport when window is resized. Defaults to false which maintains the proper aspect ratio.
      
      "scaleWidth": 480
      // Optional. Sets the size in window coordinates at which the world zoom should snap to a larger multiple of pixel size (1,2, 3, etc). This is useful for maintaining a specific game pixel viewport width on pixel art games so pixels use multiples rather than smooth scaling. Default is 0 which causes smooth scaling of the game world in a resizing viewport.
    }
*/
platformer.components['logic-directional-movement'] = (function(){
	var processDirection = function(direction){
		return function (state){
			if(state){
				if(state.pressed)
				{
					this[direction] = true;
				} else {
					this[direction] = false;
				}
			} else {
				this[direction] = true;
			}
		};
	},
	component = function(owner, definition){
		this.owner = owner;
		
		// Messages that this component listens for
		this.listeners = [];

		this.addListeners(['handle-logic',
   		    'go-down',       'go-south',
   		    'go-down-left',  'go-southwest',
		    'go-left',       'go-west',
		    'go-up-left',    'go-northwest',
		    'go-up',         'go-north',
		    'go-up-right',   'go-northeast',
		    'go-right',      'go-east',
		    'go-down-right', 'go-southeast',
		    'stop'
		]);
		
		this.speed = definition.speed || .3;

		this.state = {
			moving: false,
			left: false,
			right: false,
			up: false,
			down: false
		};
		
		this.moving = false;
		this.left = false;
		this.right = false;
		this.up = false;
		this.down = false;
		this.upLeft = false;
		this.upRight = false;
		this.downLeft = false;
		this.downRight = false;
	};
	var proto = component.prototype;
	
	proto['handle-logic'] = function(resp){
		var vX    = 0,
		vY        = 0,
		up        = this.up        || this.upLeft || this.downLeft,
		upLeft    = this.upLeft    || (this.up   && this.left),
		left      = this.left      || this.upLeft || this.downLeft,
		downLeft  = this.downLeft  || (this.down && this.left),
		down      = this.down      || this.downLeft || this.downRight,
		downRight = this.downRight || (this.down && this.right),
		right     = this.right     || this.upRight || this.downRight,
		upRight   = this.upRight   || (this.up   && this.right),
		stateChanged = false;
		
		if (this.up && this.down){
			this.moving = false;
		} else if (this.left && this.right) {
			this.moving = false;
		} else if (upLeft) {
			vX = -this.speed / 1.414;
			vY = -this.speed / 1.414;
			this.moving = true;
		} else if (upRight) {
			vY = -this.speed / 1.414;
			vX =  this.speed / 1.414;
			this.moving = true;
		} else if (downLeft) {
			vY =  this.speed / 1.414;
			vX = -this.speed / 1.414;
			this.moving = true;
		} else if (downRight) {
			vY =  this.speed / 1.414;
			vX =  this.speed / 1.414;
			this.moving = true;
		} else if(this.left)	{
			vX = -this.speed;
			this.moving = true;
		} else if (this.right) {
			vX =  this.speed;
			this.moving = true;
		} else if (this.up) {
			vY = -this.speed;
			this.moving = true;
		} else if (this.down) {
			vY =  this.speed;
			this.moving = true;
		} else {
			this.moving = false;
		}

		this.owner.x += (vX * resp.deltaT);
		this.owner.y += (vY * resp.deltaT);
		
		if(this.state.moving !== this.moving){
			this.state.moving = this.moving;
			stateChanged = true;
		}
		if(this.state.up !== up){
			this.state.up = up;
			stateChanged = true;
		}
		if(this.state.right !== right){
			this.state.right = right;
			stateChanged = true;
		}
		if(this.state.down !== down){
			this.state.down = down;
			stateChanged = true;
		}
		if(this.state.left !== left){
			this.state.left = left;
			stateChanged = true;
		}
		
		if(stateChanged){
			this.owner.trigger('logical-state', this.state);
		}
	};
	
	proto['go-down']       = proto['go-south']     = processDirection('down');
	proto['go-down-left']  = proto['go-southwest'] = processDirection('downLeft');
	proto['go-left']       = proto['go-west']      = processDirection('left');
	proto['go-up-left']    = proto['go-northwest'] = processDirection('upLeft');
	proto['go-up']         = proto['go-north']     = processDirection('up');
	proto['go-up-right']   = proto['go-northeast'] = processDirection('upRight');
	proto['go-right']      = proto['go-east']      = processDirection('right');
	proto['go-down-right'] = proto['go-southeast'] = processDirection('downRight');

	proto['stop'] = function(state){
		if(!state || state.pressed)
		{
			this.down = false;
			this.downLeft = false;
			this.left = false;
			this.upLeft = false;
			this.up = false;
			this.upRight = false;
			this.right = false;
			this.downRight = false;
		}
	};

	// This function should never be called by the component itself. Call this.owner.removeComponent(this) instead.
	proto.destroy = function(){
		this.removeListeners(this.listeners);
	};
	
	/*********************************************************************************************************
	 * The stuff below here will stay the same for all components. It's BORING!
	 *********************************************************************************************************/

	proto.addListeners = function(messageIds){
		for(var message in messageIds) this.addListener(messageIds[message]);
	};

	proto.removeListeners = function(listeners){
		for(var messageId in listeners) this.removeListener(messageId, listeners[messageId]);
	};
	
	proto.addListener = function(messageId, callback){
		var self = this,
		func = callback || function(value, debug){
			self[messageId](value, debug);
		};
		this.owner.bind(messageId, func);
		this.listeners[messageId] = func;
	};

	proto.removeListener = function(boundMessageId, callback){
		this.owner.unbind(boundMessageId, callback);
	};
	
	return component;
})();