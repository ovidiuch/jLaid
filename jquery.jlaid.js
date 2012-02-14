;(function($, window, document, undefined)
{
	/* Layout Grid constructor */

	var Laid = function(wrapper, options)
	{
		$.data(this.wrapper = wrapper, 'laid', this);

		this.options = Laid.args
		(
			$.extend({}, options), Laid.defaults
		);
		this.init();
	};

	/* Laid static */

	Laid.defaults =
	{
		debug: false,
		delay: 200,
		duration: 0.2,
		respond: null,
		scale: true,
		stretch: false,
		transition: true,
		wait: false
	};
	Laid.INFINITY = 999999;

	Laid.args = function(object, args, override)
	{
		for(var i in args)
		{
			if(!args.hasOwnProperty(i))
			{
				continue;
			}
			if(object[i] === undefined || override)
			{
				object[i] = args[i];
			}
		}
		return object;
	};

	/* Laid prototype */

	Laid.prototype.init = function()
	{
		var that = this;

		this.children = function()
		{
			return $(that.wrapper).find('> li');
		};
		$(this.wrapper).css('position', 'relative');

		this.frame = $(window).width();

		var resize = function()
		{
			that.presize();
		};
		window.setInterval(resize, 13);

		this.index();
	};
	Laid.prototype.update = function(options, handle)
	{
		var o = this.options;

		if(handle && this.find(handle))
		{
			if(typeof($.data(handle, 'options')) != 'object')
			{
				$.data(handle, 'options', {});
			}
			o = $.data(handle, 'options');
		}
		else if(handle && handle != this.wrapper)
		{
			return;
		}
		Laid.args(o, options, true);
	};
	Laid.prototype.option = function(name, handle)
	{
		var options = $.data(handle || {}, 'options') || {};

		if(options[name] !== undefined)
		{
			return options[name];
		};
		return this.options[name];
	};
	Laid.prototype.index = function()
	{
		var that = this;

		if(!this.items)
		{
			this.items = [];
		}
		this.children().each(function(i)
		{
			if(that.find(this))
			{
				return;
			}
			that.items.splice(i, 0, new Item(this, that));
		});
		if(!this.option('wait'))
		{
			this.render();
		}
	};
	Laid.prototype.find = function(child)
	{
		for(var i in this.items)
		{
			if(this.items[i].child == child)
			{
				return this.items[i];
			}
		}
		return false;
	};
	Laid.prototype.reset = function()
	{
		this.lines = [ new Line() ];
		this.stack = [];
	};
	Laid.prototype.each = function(callback)
	{
		for(var i = 0; i < this.lines.length; i++)
		{
			if(callback.call(this.lines[i], i, this.lines[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Laid.prototype.presize = function()
	{
		if(!this.lines || this.resizing)
		{
			return;
		}
		if(this.frame == (this.frame = $(window).width()))
		{
			return;
		}
		var that = this;

		this.resizing = window.setTimeout(function()
		{
			that.resizing = null;

			that.render();
		},
		this.option('delay'));
	};
	Laid.prototype.queue = function()
	{
		if(this.queued)
		{
			window.clearTimeout(this.queued);

			this.queued = null;
		}
		var that = this;

		this.queued = window.setTimeout(function()
		{
			that.queued = null;

			that.render();
		});
	};
	Laid.prototype.render = function(t)
	{
		if(!this.lines || t)
		{
			this.reset();
		}
		if(!t)
		{
			this.frame = $(window).width();

			t = time();
		}
		this.limit = $(this.wrapper).width();

		for(var i = 0, item; i < this.items.length; i++)
		{
			item = this.items[i];

			if($.inArray(item.outline, this.stack) == -1)
			{
				this.append(item);
			}
		};
		this.adjust();

		if(this.frame > (this.frame = $(window).width()))
		{
			this.render(t);

			return;
		}
		for(var i = 0; i < this.items.length; i++)
		{
			this.items[i].lay();
		}
		if(this.option('debug'))
		{
			this.print(time() - t);
		}
		this.reset();
	};
	Laid.prototype.adjust = function()
	{
		this.width = this.height = 0;

		var that = this;

		this.each(function(i, line)
		{
			if(this.width > that.width)
			{
				that.width = this.width;
			}
		});
		this.ratio = this.limit / this.width;

		for(var i = 0, block; i < this.stack.length; i++)
		{
			block = this.stack[i];

			if(!block.width || !block.height)
			{
				continue;
			}
			if(block.y + block.height > this.height)
			{
				this.height = block.y + block.height;
			}
		}
		var height = this.height;

		if(this.option('scale'))
		{
			height = Math.round(this.height * this.ratio);
		}
		$(this.wrapper).height(height);
	};
	Laid.prototype.append = function(item, fixed)
	{
		var block = item.outer(item.next);

		if(!fixed)
		{
			this.position(block);

			item.next.x = block.x;
			item.next.y = block.y;
		}
		var indices = [], that = this;

		this.stack.push(block);

		indices.push(this.line(block.y));
		indices.push(this.line(block.y + block.height));

		for(var i = 0, j, line; i < indices.length; i++)
		{
			if(indices[i] == -1)
			{
				continue;
			}
			line = this.lines[indices[i]];

			for(j = 0; j < this.stack.length; j++)
			{
				if(this.inline(that.stack[j], indices[i]))
				{
					line.block(that.stack[j]);
				}
			}
		}
		this.each(function(i, line)
		{
			if(that.inline(block, i))
			{
				this.block(block);
			}
		});
	};
	Laid.prototype.position = function(block)
	{
		var sibling, valid, that = this;

		block.x = block.y = Laid.INFINITY;

		this.each(function(i, line)
		{
			if(this.y > block.y)
			{
				return;
			}
			if(!this.width || that.check(0, this.y, block.width, block.height))
			{
				block.x = 0;
				block.y = this.y;
			}
			this.each(function(j)
			{
				while((sibling = line[++j]))
				{
					if(sibling.x > this.x + this.width)
					{
						break;
					}
					if(sibling.y == this.y)
					{
						return;
					}
				}
				if(this.x + this.width > block.x && line.y == block.y)
				{
					return;
				}
				valid = that.check
				(
					this.x + this.width, line.y, block.width, block.height
				);
				if(valid)
				{
					block.x = this.x + this.width;
					block.y = line.y;
				}
			});
		});
	};
	Laid.prototype.check = function(x, y, width, height)
	{
		if(x && x + width > this.limit)
		{
			return false;
		}
		return this.each(function(i, line)
		{
			if(this.y >= y + height)
			{
				return true;
			}
			return this.each(function(j, block)
			{
				if(x >= this.x + this.width)
				{
					return true;
				}
				if(x + width <= this.x)
				{
					return true;
				}
				if(y >= this.y + this.height)
				{
					return true;
				}
				if(y + height <= this.y)
				{
					return true;
				}
				return false;
			});
		});
	};
	Laid.prototype.inline = function(block, i)
	{
		var line = this.lines[i];

		if(line.y >= block.y + block.height)
		{
			return false;
		}
		if(line.y < block.y)
		{
			if(line.width >= block.x + block.width)
			{
				return false;
			}
			while(this.lines[i++].y < block.y)
			{
				if(this.lines[i].width > block.x + block.width)
				{
					return false;
				}
			}
		}
		return true;
	};
	Laid.prototype.line = function(y)
	{
		var index = 0;

		this.each(function(i, line)
		{
			if(this.y >= y)
			{
				if(this.y == y)
				{
					index = -1;
				}
				return;
			}
			index = i + 1;
		});
		if(index != -1)
		{
			this.lines.splice(index, 0, new Line(y));
		}
		return index;
	};
	Laid.prototype.print = function(time)
	{
		var that = this;

		this.each(function(i, line)
		{
			that.log
			(
				'line #' + (i + 1) + ' [' +
				this.y + ' ' +
				this.width + ']'
			,
			true);

			this.each(function(j, block)
			{
				that.log
				(
					'> #' + (j + 1) + ' [' +
					this.x + ' ' +
					this.y + ' ' +
					this.width + ' ' +
					this.height + ']'
				,
				true);
			});
		});
		that.log('built in ' + time + 'ms', true);
	};
	Laid.prototype.log = function(message, bypass)
	{
		if(this.option('debug') || bypass)
		{
			console.log('jLaid: ' + message);
		}
	};

	/* Line constructor */

	var Line = function(y)
	{
		this.y = y || 0;

		this.width = 0;
	};

	/* Line prototype */

	Line.prototype = [];

	Line.prototype.each = function(callback)
	{
		for(var i = 0; i < this.length; i++)
		{
			if(callback.call(this[i], i, this[i]) === false)
			{
				return false;
			}
		}
		return true;
	};
	Line.prototype.block = function(block)
	{
		var index = 0;

		this.each(function(j)
		{
			if(this == block)
			{
				index = -1;

				return false;
			}
			if(this.x <= block.x)
			{
				index = j + 1;
			}
			return true;
		});
		if(index != -1)
		{
			if(block.x + block.width > this.width)
			{
				this.width = block.x + block.width;
			}
			this.splice(index, 0, block);
		}
	};

	/* Block constructor */

	var Block = function(params)
	{
		this.update(params);
	};

	/* Block static */

	Block.PROPERTIES = ['x', 'y', 'width', 'height'];

	/* Block prototype */

	Block.prototype.update = function(block)
	{
		for(var i = 0, property; i < Block.PROPERTIES.length; i++)
		{
			property = Block.PROPERTIES[i];

			if(block[property] != undefined)
			{
				this[property] = block[property];
			}
		}
		return this;
	};
	Block.prototype.diff = function(block)
	{
		var diff = {};

		diff.x = this.x - block.x;
		diff.y = this.y - block.y;

		diff.width = this.width - block.width;
		diff.height = this.height - block.height;

		if(!diff.x
		&& !diff.y
		&& !diff.width
		&& !diff.height)
		{
			return false;
		}
		return diff;
	};
	Block.prototype.scale = function(block)
	{
		var scale = {};

		scale.x = this.width / block.width;
		scale.y = this.height / block.height;

		return scale;
	};

	/* Item constructor */

	var Item = function(child, laid)
	{
		if(!(this.child = child))
		{
			return;
		}
		$.data(child, 'laid', this.laid = laid);

		this.init();
	};

	/* Item static */

	Item.SIDES = ['top', 'bottom', 'left', 'right'];

	/* Item prototype */

	Item.prototype = $.extend({}, Block.prototype);

	Item.prototype.init = function()
	{
		var c = $(this.child).css('position', 'absolute');

		this.bounds();

		this.outer(this.next = new Block
		(
			this.original = new Block(this)
		));
		c.css('display', 'none');
	};
	Item.prototype.bounds = function()
	{
		var c = $(this.child);

		this.width = c.outerWidth();
		this.height = c.outerHeight();

		this.margin = {};

		for(var i = 0, side; i < Item.SIDES.length; i++)
		{
			side = Item.SIDES[i];

			this.margin[side] = Number
			(
				c.css('margin-' + side).replace(/[^0-9-]+/g, '')
			);
		}
		this.padding =
		{
			x: this.width - c.width(),
			y: this.height - c.height()
		};
	};
	Item.prototype.option = function(name)
	{
		return this.laid.option(name, this.child);
	};
	Item.prototype.preset = function()
	{
		if(!$(this.child).is(':hidden'))
		{
			return false;
		}
		this.x = this.next.x;
		this.y = this.next.y;

		this.current = this.transform(this);

		return true;
	};
	Item.prototype.lay = function()
	{
		var init = this.preset();

		var next = this.transform
		(
			this.update(this.next)
		);
		var diff = next.diff(this.current);

		if(!diff)
		{
			Animation.cancel(this);

			if(!init)
			{
				return;
			}
		}
		var transition = this.option('transition');

		if(!transition || !diff)
		{
			this.assign(next);

			return;
		}
		var duration = this.option('duration'), that = this;

		new Animation(this, duration, transition, function(ratio)
		{
			ratio = 1 - ratio;

			that.assign(
			{
				x: next.x - diff.x * ratio,
				y: next.y - diff.y * ratio,
				width: next.width - diff.width * ratio,
				height: next.height - diff.height * ratio
			});
		});
	};
	Item.prototype.outer = function(block)
	{
		var b = new Block(block);

		b.width += this.margin.left + this.margin.right;
		b.height += this.margin.top + this.margin.bottom;

		return (this.outline = b);
	};
	Item.prototype.transform = function(block)
	{
		var b = new Block(block);

		if(!this.option('stretch') && !this.option('scale'))
		{
			return b;
		}
		var ratio = this.laid.ratio;

		b.x = Math.round(block.x * ratio);

		b.width = -b.x + Math.min
		(
			Math.round((block.x + block.width) * ratio), this.laid.limit
		);
		if(this.option('scale'))
		{
			b.y = Math.round(block.y * ratio);

			b.height = -b.y + Math.round((block.y + block.height) * ratio);
		}
		return b;
	};
	Item.prototype.assign = function(block)
	{
		this.current.update(block);

		var width = block.width - this.padding.x;
		var height = block.height - this.padding.y;

		width = Math.max(width, 0);
		height = Math.max(height, 0);

		$(this.child).css(
		{
			left: block.x, top: block.y, width: width, height: height
		});
		$(this.child).css
		(
			'display', width && height ? 'block' : 'none'
		);
		this.respond(this.option('respond'));
	};
	Item.prototype.respond = function(fn)
	{
		if(typeof(fn) == 'function')
		{
			fn.call(this, this.current.scale(this.original));
		}
	};
	Item.prototype.remove = function()
	{
		this.next.width = 0;
		this.next.height = 0;

		this.lay();

		if(!this.option('transition'))
		{
			this.destroy();

			return;
		}
		var that = this;

		window.setTimeout(function()
		{
			that.destroy();
		},
		this.option('duration') * 1000);
	};
	Item.prototype.destroy = function()
	{
		$(this.child).remove();
	};

	/* Animation constructor */

	var Animation = function(id, duration, transition, callback)
	{
		this.id = id;

		this.b = (this.a = time()) + (duration * 1000);

		if(typeof(transition) == 'function')
		{
			this.transition = transition;
		}
		if(typeof(this.callback = callback) == 'function')
		{
			Animation.push(this);
		}
	};

	/* Animation static */

	Animation.stack = [];

	Animation.init = function()
	{
		if(this.interval)
		{
			window.clearInterval(this.interval);
		}
		var that = this;

		this.interval = window.setInterval(function()
		{
			that.frame();
		},
		13);
	};
	Animation.push = function(animation)
	{
		if(!this.interval)
		{
			this.init();
		}
		this.cancel(animation.id);

		if(animation.b > animation.a)
		{
			this.stack.push(animation);
		}
		animation.frame(time());
	};
	Animation.cancel = function(id)
	{
		for(var i = 0; i < this.stack.length; i++)
		{
			if(this.stack[i].id === id)
			{
				this.stack.splice(i, 1);

				return;
			}
		}
	};
	Animation.frame = function(x, t)
	{
		if(x != undefined)
		{
			this.stack.splice(x, 1);
		}
		t = t || time();

		for(var i = x || 0; i < this.stack.length; i++)
		{
			if(!this.stack[i].frame(t))
			{
				this.frame(i, t);

				return;
			}
		}
	};

	/* Animation prototype */

	Animation.prototype.frame = function(time)
	{
		var ratio = this.b <= this.a ? 1 : Math.min
		(
			(time - this.a) / (this.b - this.a), 1
		);
		if(this.transition)
		{
			ratio = this.transition(ratio);
		}
		this.callback(ratio);

		return ratio < 1;
	};

	/* time */

	var time = function()
	{
		return new Date().getTime();
	};

	/* API */

	var API = Laid.fn = {};

	API.render = function(args)
	{
		this.update(args || {});

		this.render();
	};
	API.sort = function(callback)
	{
		this.items.sort(callback);

		this.render();
	};
	API.reset = function(child)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		item.next.update(item.original);

		this.queue();
	};
	API.set = function(child, args, lock)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		item.next.update(args);

		if(lock)
		{
			var next = item.next;

			next.x = Math.min(next.x, this.width - next.width);
			next.x = Math.max(next.x, 0);
			next.y = Math.max(next.y, 0);

			this.append(item, true);
		}
		this.queue();
	};
	API.hide = function(child)
	{
		API.set.call(this, child,
		{
			width: 0, height: 0
		},
		true);
	};
	API.remove = function(child)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		this.items.splice
		(
			$.inArray(item, this.items), 1
		);
		item.remove();

		this.queue();
	};
	API.insert = function(child, baby)
	{
		if(typeof(baby) == 'function')
		{
			baby = baby();
		}
		if(!baby)
		{
			return;
		}
		var item = this.find(child);

		$(this.wrapper).prepend(baby);

		if(item)
		{
			$(child).after(baby);
		}
		this.items.splice($.inArray(item, this.items) + 1, 0,
		(
			item = new Item(baby, this)
		));
		item.width = item.height = 0;

		this.queue();
	};
	API.retract = function(child)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		item.lay();

		var prev = Number($(child).css('z-index'));

		$(child).css('z-index', prev == 3 ? 2 : 1);
	};
	API.expand = function(child, args, center)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		var prev = new Block(item.next);

		var next = item.next.update(args);

		if(center)
		{
			var diff = next.diff(prev);

			next.x -= Math.round(diff.width / 2);
			next.y -= Math.round(diff.height / 2);
		}
		var scale = { x: 1, y: 1 };

		if(this.option('scale'))
		{
			scale.x = scale.y = this.ratio;
		}
		else if(this.option('stretch'))
		{
			scale.x = this.ratio;
		}
		var bottom = $(window).scrollTop() + $(window).height();

		bottom -= $(child).offset().top - item.current.y;

		next.x = Math.min(next.x, this.limit / scale.x - next.width);
		next.x = Math.max(next.x, 0);

		next.y = Math.min(next.y, bottom / scale.y - next.height);
		next.y = Math.max(next.y, 0);

		item.lay();

		item.next.update(prev);

		for(var i = 0; i < this.items.length; i++)
		{
			if(this.items[i].child != child)
			{
				API.retract.call(this, this.items[i].child);
			}
		}
		$(child).css('z-index', 3);
	};

	/* plugin */

	$.fn.laid = function()
	{
		var laid, method, args = Array.prototype.slice.call(arguments);

		if(typeof(args[0]) == 'string')
		{
			method = args.shift();
		}
		this.each(function()
		{
			if(!(laid = $.data(this, 'laid')))
			{
				method || new Laid(this, args[0]);
			}
			else if(!method)
			{
				laid.update(args[0], this);
			}
			else API[method].apply
			(
				laid, this == laid.wrapper ? args : [this].concat(args)
			);
		});
		return this;
	};
	$.laid = Laid;
})
(jQuery, window, document);