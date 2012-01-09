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
		duration: 0.4,
		scale: false,
		stretch: false,
		transition: true
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

		$(window).resize(function()
		{
			that.presize();
		});
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
		this.render();
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
	Laid.prototype.render = function()
	{
		var t = time();

		if(!this.lines)
		{
			this.reset();
		}
		this.width = $(this.wrapper).width();

		for(var i = 0, item; i < this.items.length; i++)
		{
			item = this.items[i];

			if($.inArray(item.next, this.stack) == -1)
			{
				this.append(this.next(item.next));
			}
		};
		this.adjust();

		for(var i = 0; i < this.items.length; i++)
		{
			this.items[i].set();
		}
		if(this.option('debug'))
		{
			this.print(time() - t);
		}
		this.reset();
	};
	Laid.prototype.adjust = function()
	{
		var width = 0, height = 0, block = this.stack[0];

		this.each(function(i, line)
		{
			if(this.width > width)
			{
				width = this.width;
			}
		});
		for(var i = 0; i < this.stack.length; block = this.stack[++i])
		{
			if(!block.width || !block.height)
			{
				continue;
			}
			if(block.y + block.height > height)
			{
				height = block.y + block.height;
			}
		}
		this.ratio = this.width / width;

		$(this.wrapper).height(height);
	};
	Laid.prototype.next = function(block)
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
		return block;
	};
	Laid.prototype.check = function(x, y, width, height)
	{
		if(x && x + width > this.width)
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
	Laid.prototype.append = function(block)
	{
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

	/* Block prototype */

	Block.prototype.update = function(block)
	{
		this.x = block.x;
		this.y = block.y;

		this.width = block.width;
		this.height = block.height;

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

	/* Item prototype */

	Item.prototype = $.extend({}, Block.prototype);

	Item.prototype.init = function()
	{
		var c = $(this.child).css('position', 'absolute');

		var position = c.position();

		this.x = position.left;
		this.y = position.top;

		this.width = c.outerWidth();
		this.height = c.outerHeight();

		this.h = this.width - c.width();
		this.v = this.height - c.height();

		this.next = new Block
		(
			this.original = new Block(this)
		);
		c.css('display', 'none');
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
	Item.prototype.set = function()
	{
		var init = this.preset();

		var next = this.transform(this.next);

		var diff = next.diff(this.current);

		if(!diff && !init)
		{
			return;
		}
		this.update(this.next);

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
	Item.prototype.transform = function(block) // add scaling
	{
		if(!this.option('stretch'))
		{
			return block;
		}
		var ratio = this.laid.ratio;

		var b = new Block(block);

		b.x = Math.round(block.x * ratio);

		b.width = -b.x + Math.min
		(
			(block.x + block.width) * ratio, this.laid.width
		);
		return b;
	};
	Item.prototype.assign = function(block)
	{
		this.current.update(block);

		var width = block.width - this.h;
		var height = block.height - this.v;

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
	};
	Item.prototype.remove = function()
	{
		this.next.width = 0;
		this.next.height = 0;

		this.set();

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
		for(var i = 0; i < this.stack.length; i++)
		{
			if(this.stack[i].id === animation.id)
			{
				this.stack.splice(i, 1);

				break;
			}
		}
		this.stack.push(animation);

		animation.frame(time());
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
		var ratio = Math.min(1, (time - this.a) / (this.b - this.a));

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
		Laid.args(item.next, item.original, true);

		this.queue();
	};
	API.set = function(child, args, lock)
	{
		var item = this.find(child);

		if(!item)
		{
			return;
		}
		Laid.args(item.next, args, true);

		if(lock)
		{
			var next = item.next;

			next.x = Math.min(next.x, this.width - next.width);
			next.x = Math.max(next.x, 0);
			next.y = Math.max(next.y, 0);

			this.append(next);
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

	/* plugin */

	$.fn.laid = function()
	{
		var laid, method, args = $.extend([], arguments);

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